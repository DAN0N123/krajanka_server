const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Route, Order } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

router.get(
  "/get",
  asyncHandler(async (req, res) => {
    const allRoutes = await Route.find().exec();
    return res.json({ ok: true, result: allRoutes });
  })
);

router.get(
  "/getQuantityList/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const route = await Route.findOne({ _id: id })
      .select("quantityList")
      .exec();

    if (!route) {
      res.json({ ok: false, message: "Wystąpił nieoczekiwany problem." });
    }
    const quantityList = route.quantityList;
    console.log(route);
    return res.json({ ok: true, result: quantityList });
  })
);

router.post(
  "/updateQuantityList/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const newQuantityList = req.body.quantityList;
    const route = await Route.findByIdAndUpdate(
      id,
      { quantityList: newQuantityList },
      { new: true }
    ).exec();
    route.save();
    if (!route) {
      res.json({ ok: false, message: "Wystąpił problem przy usuwaniu trasy" });
    }
    return res.json({ ok: true, result: route });
  })
);

router.post(
  "/delete/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const route = await Route.findByIdAndDelete(id).exec();
    if (!route) {
      res.json({ ok: false, message: "Wystąpił problem przy usuwaniu trasy" });
    }
    return res.json({ ok: true, result: route });
  })
);

router.get(
  "/get/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const route = await Route.findById(id).populate("orders").exec();
    return res.json({ ok: true, result: route });
  })
);

router.get("/getDrivers", async (req, res) => {
  try {
    const db = connection.db;
    const collection = db.collection("config");

    const configDoc = await collection.findOne({ name: "APP_SETTINGS" });
    if (!configDoc) {
      return res.status(404).json({ message: "Config not found" });
    }

    res.json({ ok: true, result: configDoc.drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/updateDrivers", async (req, res) => {
  try {
    const { drivers } = req.body;
    console.log(drivers);
    if (!Array.isArray(drivers)) {
      return res.status(400).json({ message: "Invalid drivers array" });
    }

    const db = connection.db;
    const collection = db.collection("config");

    const result = await collection.updateOne(
      { name: "APP_SETTINGS" },
      { $set: { drivers: drivers } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Config not found or not updated" });
    }

    res.status(200).json({ message: "Drivers updated successfully" });
  } catch (error) {
    console.error("Error updating drivers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/update/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const route = await Route.findById(id).exec();
    const date = route.date;
    const orderObjects = await Order.find({ date: date })
      .select("_id")
      .lean()
      .exec();
    let newOrders = [];
    for (const order of orderObjects) {
      newOrders.push(order._id);
    }

    try {
      route.orders = newOrders;
      await route.save();
    } catch (err) {
      console.log(err);
    }
  })
);

router.post("/add", [
  body("destination").trim().isLength({ min: 1 }),
  body("date").trim().isLength({ min: 1 }),
  body("driver").trim().isLength({ min: 1 }),

  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.json({
        ok: false,
        message: "Wprowadzone dane są nieprawidłowe",
      });
    }

    const destination = req.body.destination;
    const date = req.body.date;
    const driver = req.body.driver;
    const orderObjects = await Order.find({ date: date })
      .select("_id")
      .lean()
      .exec();
    let orders = [];
    for (const order of orderObjects) {
      orders.push(order._id);
    }
    const route = new Route({
      destination,
      date,
      driver,
      orders,
    });
    try {
      route.save();
      return res.json({ ok: true, message: "Pomyślnie dodano trasę" });
    } catch (err) {
      return res.json({ ok: false, message: err.message });
    }
  }),
]);

module.exports = router;
