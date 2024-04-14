const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    errorMessage = "Invalid input data";
  }

  if (err.code === 11000) {
    statusCode = 400;
    errorMessage = "Duplicate key error";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    errorMessage = "Invalid data type";
  }

  if (err.name === "MongooseError") {
    statusCode = 500;
    errorMessage = "Mongoose error";
  }

  console.error(err);

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
  });
};

module.exports = errorHandler;
