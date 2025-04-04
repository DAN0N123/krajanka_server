const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Product, Order } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

router.get(
  "/get",
  asyncHandler(async (req, res) => {
    const allProducts = await Product.find().exec();
    return res.json({ ok: true, result: allProducts });
  })
);

router.get(
  "/get/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id }).exec();
    return res.json({ ok: true, result: product });
  })
);

router.get(
  "/getProductTotals",
  asyncHandler(async (req, res) => {
    try {
      const allOrders = await Order.find().exec();
      const allCurrentOrders = allOrders.filter((order) => {
        // Extract the day, month, and year from the order's date string
        const [day, month, year] = order.date.split("-").map(Number);

        // Convert the extracted values into a Date object
        const orderDueDate = new Date(year, month - 1, day);

        // Get today's date and zero out the time components for date-only comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Also zero out the orderDueDate time for a fair comparison
        orderDueDate.setHours(0, 0, 0, 0);

        // Return true if the order is due strictly after today
        return orderDueDate > today;
      });

      const productTotals = {};

      allCurrentOrders.forEach((order) => {
        order.products.forEach((product) => {
          const productName = product.name;
          // Convert the product quantity from string to number
          const quantity = Number(product.quantity);

          if (!productTotals[productName]) {
            productTotals[productName] = 0;
          }
          productTotals[productName] += quantity;
        });
      });
      console.log(productTotals);
      return res.json({ ok: true, result: productTotals });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
);

router.post(
  "/updateNotes/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const note = req.body.note;

    try {
      const product = await Product.findOne({ _id: id }).exec();
      console.log("Note: ", note);
      product.note = note;
      await product.save();
      return res.json({
        ok: true,
        message: "Pomyślnie zmieniono notatkę dla produktu",
      });
    } catch (err) {
      return res.json({ ok: false, err: err });
    }
  })
);

router.get(
  "/getFavorite",
  asyncHandler(async (req, res) => {
    const products = await Product.find();
    const favoriteProducts = products.filter((product) => product.favorite);
    return res.json({ ok: true, result: favoriteProducts });
  })
);

router.post(
  "/updateFavorite/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { favorite } = req.body;

    if (typeof favorite !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, message: "'favorite' must be a boolean." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { favorite },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ ok: false, message: "Product not found." });
    }

    return res.status(200).json({
      ok: true,
      message: "Favorite status updated.",
      result: updatedProduct,
    });
  })
);

router.put("/edit/:id", [
  body("price").trim().isLength({ min: 1 }),
  body("name").trim().isLength({ min: 1 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        ok: false,
        error: errors,
        message: "Wprowadź poprawne dane",
      });
    }
    console.log(req.body);
    const id = req.params.id;
    try {
      const editedProduct = await Product.findByIdAndUpdate(id, {
        price: req.body.price,
        name: req.body.name,
      }).exec();
      if (!editedProduct) {
        return res.json({
          ok: false,
          message: "Nie znaleziono tego produktu w bazie danych",
        });
      }
      return res.json({ ok: true, message: "Pomyślnie zmieniono produkt" });
    } catch (err) {
      return res.status(500).json({ ok: false, message: err.message });
    }
  }),
]);

router.post("/add", [
  body("name").trim().isLength({ min: 1 }),
  body("price").trim().isLength({ min: 1 }),
  body("packaging").trim().isLength({ min: 1 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        ok: false,
        error: errors,
        message: "Wprowadź poprawne dane",
      });
    }
    const newProduct = new Product({
      name: req.body.name.charAt(0).toUpperCase() + req.body.name.slice(1),
      price: req.body.price,
      packagingMethod: req.body.packaging,
      seasonal: req.body.seasonal,
      image: req.body.image,
      note: { stock: "", toOrder: "" },
    });

    try {
      newProduct.save();
      return res.json({ ok: true, message: "Pomyślnie dodano produkt" });
    } catch (err) {
      return res
        .status(500)
        .json({ ok: false, message: "Problem przy dodawaniu produktu" });
    }
  }),
]);

router.post(
  "/delete/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const deletedProduct = await Product.findByIdAndDelete(id).exec();
      if (!deletedProduct) {
        return res.json({
          ok: false,
          message: "Wystąpił problem przy usuwaniu produktu",
        });
      }
      return res.json({ ok: true, message: "Pomyślnie usunięto produkt" });
    } catch (err) {
      return res.status(500).json({ ok: false, message: err.message });
    }
  })
);

module.exports = router;
