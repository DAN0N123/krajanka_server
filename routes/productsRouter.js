const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Product } = connection.models;
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

router.put("/edit/:id", [
  body("price").trim().isLength({ min: 1 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        ok: false,
        error: errors,
        message: "Wprowadź poprawne dane",
      });
    }
    const id = req.params.id;
    try {
      const editedProduct = await Product.findByIdAndUpdate(id, {
        price: req.body.price,
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
