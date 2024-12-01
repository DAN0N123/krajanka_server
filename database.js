require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const conn = process.env.DB_STRING;
const { DateTime } = require("luxon");
const connection = mongoose.createConnection(conn, {});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  packagingMethod: String,
  note: String,
  image: { type: String, default: null },
  seasonal: Boolean,
});

const clientSchema = new mongoose.Schema({
  address: String,
  phone: String,
});

const routeSchema = new mongoose.Schema({
  destination: String,
  driver: String,
  date: String,
  quantityList: [
    {
      productName: String,
      quantities: [
        {
          value: Number,
          packed: Boolean,
        },
      ],
    },
  ],
  orders: [{ type: Schema.ObjectId, ref: "Order" }],
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
const Route = connection.model("Route", routeSchema);

const deleteFulfilledOrders = async () => {
  try {
    const currentDate = DateTime.now().toISODate(); // Current date in ISO format (YYYY-MM-DD)
    const orders = await Order.find(); // Fetch all orders from the database

    const ordersToDelete = orders.filter((order) => {
      const orderDate = DateTime.fromFormat(order.date, "dd-MM-yyyy");

      if (!orderDate.isValid) {
        console.error(
          `Invalid date format for order: ${order._id}, date: ${order.date}`
        );
        return false; // Skip invalid dates
      }
      return orderDate < DateTime.fromISO(currentDate); // Compare parsed date with the current date
    });

    const orderIds = ordersToDelete.map((order) => order._id);

    // Delete orders with matching IDs
    const result = await Order.deleteMany({ _id: { $in: orderIds } });

    console.log(`${result.deletedCount} fulfilled orders deleted.`);
    return { success: true, deletedCount: result.deletedCount }; // Return success and count of deleted orders
  } catch (error) {
    console.error("Error deleting fulfilled orders:", error);
    return { success: false, error: error.message }; // Return error details
  }
};

// (async () => {
//   const result = await deleteFulfilledOrders();
//   console.log(result);
// })();

module.exports = connection;
