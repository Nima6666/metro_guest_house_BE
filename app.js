const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const visitorRouter = require("./routes/visitor");
const errorHandler = require("./utils/errorHandler");
const customLogger = require("./middleware/responseLogger");

const cors = require("cors");
const { isAuthenticated } = require("./middleware/userAuth");

const app = express();

require("dotenv").config();

require("./db/databaseConnection");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(
//   "/static",
//   isAuthenticated,
//   express.static(path.join(__dirname, "public"))
// );

const clientCors = {
  origin: process.env.CLIENTORIGIN,
};
app.use(customLogger.responseLogger);
app.use(customLogger.logApiUsage);
app.use(
  "/uploads",
  cors(clientCors),
  isAuthenticated,
  express.static("uploads/")
);

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());

// app.get("/", (req, res) => {
//   res.json({
//     message: "Welcome to MetroGuestHouse API",
//   });
// });

app.use("/", cors(clientCors), indexRouter);
app.use("/v1/users", cors(clientCors), usersRouter);
app.use("/v1/visitor", cors(clientCors), visitorRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log(404);
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
