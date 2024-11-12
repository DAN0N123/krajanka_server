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
    if (!route) {
      res.json({ ok: false, message: "Wystąpił problem przy usuwaniu trasy" });
    }
    return res.json({ ok: true, result: route });
  })
);

router.get(
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
