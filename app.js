var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const connection = require("./database");
const cors = require("cors");
var app = express();
const passport = require("./passport");
require("dotenv").config();

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  next();
};

//routes
const productsRouter = require("./routes/productsRouter");
const clientsRouter = require("./routes/clientsRouter");
const ordersRouter = require("./routes/ordersRouter");
const circuitRouter = require("./routes/circuitRouter");
const authRouter = require("./routes/authRouter");
const routesRouter = require("./routes/routesRouter");

const corsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

app.use("/auth", authRouter);

app.use(isAuthenticated);

app.use("/products", productsRouter);
app.use("/clients", clientsRouter);
app.use("/circuit", circuitRouter);
app.use("/orders", ordersRouter);
app.use("/routes", routesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
});

module.exports = app;
