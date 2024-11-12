const express = require("express");
const router = express.Router();
const connection = require("../database");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// Logout route
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "User logged out successfully" });
});

router.get("/check", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ ok: false, message: "Not authenticated" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ ok: true, message: "Authenticated", user: decoded });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ ok: false, message: "Invalid token" });
  }
});

// Login route
router.post("/login", [
  body("password", "Password is required").trim().isLength({ min: 1 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // Access the config collection
    const configCollection = connection.db.collection("config");

    // Retrieve the APP_SETTINGS document
    const appSettings = await configCollection.findOne({
      name: "APP_SETTINGS",
    });

    if (!appSettings || !appSettings.passwordHash) {
      return res.status(500).json({
        success: false,
        message: "Configuration error: No password set for the application.",
      });
    }

    const isMatch = await bcrypt.compare(
      req.body.password,
      appSettings.passwordHash
    );

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password is incorrect" });
    }

    // Generate JWT token
    const payload = { id: crypto.randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "168h",
    });

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ ok: true, message: "Login successful" });
  }),
]);

module.exports = router;
