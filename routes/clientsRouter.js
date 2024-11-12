const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Client } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult, check } = require("express-validator");

router.get(
  "/get",
  asyncHandler(async (req, res) => {
    const allClients = await Client.find().exec();
    return res.json({ ok: true, result: allClients });
  })
);
router.post(
  "/delete/:id",
  asyncHandler(async (req, res) => {
    try {
      const deletedClient = await Client.findByIdAndDelete(
        req.params.id
      ).exec();
      if (!deletedClient) {
        return res.json({
          ok: false,
          message: "Problem przy usuwaniu klienta",
        });
      }
    } catch (err) {
      return res.json({
        ok: false,
        message: "Problem przy usuwaniu klienta",
        error: err,
      });
    }
    return res.json({ ok: true, message: "Klient pomyślnie usunięty" });
  })
);
router.post("/add", [
  body("address").trim().isLength({ min: 1 }),
  body("phone").trim().isLength({ min: 11 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
      return res.json({
        ok: false,
        message: "Incorrect data received",
        errors: errors,
      });
    }
    const address = req.body.address;
    const phone = req.body.phone;

    try {
      const checkDuplicate = await Client.findOne({ address: address }).exec();
      if (checkDuplicate) {
        return res.json({ ok: false, message: "Ten adres już istnieje" });
      }
    } catch (err) {
      console.log(err);
    }
    console.log("yo2");
    const newClient = new Client({
      address,
      phone,
    });

    try {
      await newClient.save();
      return res.json({
        ok: true,
        message: "Nowy klient zapisany",
        result: newClient,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: "Wystąpił problem zapisując nowego klienta, spróbuj ponownie",
      });
    }
  }),
]);

module.exports = router;
