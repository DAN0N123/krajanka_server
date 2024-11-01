const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Order } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult, check } = require("express-validator");

router.get(
  "/getOrderNumber",
  asyncHandler(async (req, res) => {
    try {
      if (connection.readyState !== 1) {
        throw new Error("Database connection not established");
      }

      // Access the collection by name
      const collection = connection.db.collection("config");

      // Query the collection using the criteria
      const document = await collection.findOne({ name: "APP_SETTINGS" });

      return res.json({ ok: true, result: document.orderNumber });
    } catch (error) {
      return res.json({ ok: false, message: "Baza danych nie odpowiada" });
    }
  })
);
router.post("/add", [
  body("address").trim().isLength({ min: 1 }),
  body("date").trim().isLength({ min: 1 }),
  body("time").trim().isLength({ min: 1 }),
  body("phone").trim().isLength({ min: 11 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(500)
        .json({ ok: false, message: "Wprowadź poprawne dane" });
    }
    const config = connection.db.collection("config");
    const APP_SETTINGS = await config.findOne({ name: "APP_SETTINGS" });
    const orderNumber = APP_SETTINGS.orderNumber;
    const address = req.body.address;
    const phone = req.body.phone;
    const products = req.body.products;
    const date = req.body.date;
    const time = req.body.time;
    const orderNumberCheck = await Order.findOne({
      orderNumber: orderNumber,
    }).exec();
    if (orderNumberCheck) {
      return res.json({
        ok: false,
        message: "Zamówienie o tym numerze już istnieje",
      });
    }
    const newOrder = new Order({
      address,
      orderNumber,
      products,
      phone,
      date,
      time,
    });

    try {
      await newOrder.save();
      console.log("yo");
      await config.updateOne(
        { name: "APP_SETTINGS" },
        { $set: { orderNumber: orderNumber + 1 } }
      );
      return res.json({
        ok: true,
        message: "Pomyślnie dodano nowe zamówienie",
      });
    } catch (err) {
      return res.json({
        ok: false,
        message: "Wystąpił problem przy dodawaniu nowego zamówienia",
      });
    }
  }),
]);

router.put(
  "/edit/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const orderNumber = req.body.orderNumber;
      if (orderNumber != req.body.originalOrderNumber) {
        const orderNumberCheck = await Order.findOne({
          orderNumber: orderNumber,
        }).exec();
        if (orderNumberCheck) {
          return res.json({
            ok: false,
            message: "Zamówienie o tym numerze już istnieje",
          });
        }
      }

      const order = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!order) {
        throw new Error("To zamówienie nie istnieje");
      }

      return res.json({ ok: true, message: "Pomyślnie zmieniono zamówienie" });
    } catch (error) {
      return res.status(500).json({ ok: false, message: error.message });
    }
  })
);

router.post(
  "/remove/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const order = await Order.findByIdAndDelete(id).exec();
      if (order) {
        return res.json({ ok: true, message: "Pomyślnie usunięto zamówienie" });
      } else {
        throw new Error("To zamówienie nie istnieje");
      }
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: "Wystąpił problem przy usuwaniu zamówienia",
        error: err,
      });
    }
  })
);

router.get(
  "/get/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const order = await Order.findById(id).exec();
      return res.json({ ok: true, result: order });
    } catch (err) {
      return res.json({
        ok: false,
        error: err,
        message: "Wystąpił problem przy zwracaniu zamówieia. Odśwież stronę",
      });
    }
  })
);

router.get(
  "/get",
  asyncHandler(async (req, res) => {
    try {
      const allOrders = await Order.find().exec();
      return res.json({ ok: true, result: allOrders });
    } catch (err) {
      return res.json({
        ok: false,
        error: err,
        message: "Wystąpił problem przy zwracaniu zamówień. Odśwież stronę",
      });
    }
  })
);

module.exports = router;
