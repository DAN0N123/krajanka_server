require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");
const conn = process.env.DB_STRING;

const connection = mongoose.createConnection(conn, {});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  packagingMethod: String,
  image: { type: String, default: null },
  seasonal: Boolean,
});

const clientSchema = new mongoose.Schema({
  address: String,
  phone: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: Number,
  address: String,
  phone: String,
  note: String,
  paymentMethod: String,
  date: String,
  time: String,
  products: [Object],
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Product = connection.model("Product", productSchema);
const Client = connection.model("Client", clientSchema);
const Order = connection.model("Order", orderSchema);

module.exports = connection;
