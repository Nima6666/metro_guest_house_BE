const fs = require("fs");
const path = require("path");

// Ensure logs folder exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

module.exports.responseLogger = (req, res, next) => {
  // Store the original res.send method
  const originalSend = res.send;

  // Override the res.send method
  res.send = function (data) {
    // Log the response data to a file
    const logEntry = `
      Time: ${new Date().toISOString()}
      Request URL: ${req.originalUrl}
      Method: ${req.method}
      Response Data: ${data}
      --------------------------------------------
    `;

    // Asynchronously append log entry to the file
    fs.appendFile(path.join(logsDir, "api_response.log"), logEntry, (err) => {
      if (err) {
        console.error("Failed to write API response log:", err);
      }
    });

    // Call the original res.send with the data to send the response
    return originalSend.call(this, data); // Use 'call' to maintain the context
  };

  // Proceed to the next middleware
  next();
};

const logToFileSync = (logDetails) => {
  const logEntry = JSON.stringify(logDetails) + "\n";

  // Append the log entry synchronously to the log file
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error("Failed to write API usage log:", err);
  }
};

const logFilePath = path.join(logsDir, "api_usage.log");

// Middleware to log detailed API usage (response time, status code, etc.)
module.exports.logApiUsage = (req, res, next) => {
  const startTime = Date.now(); // Start timing the request

  // When the response finishes, log the details
  res.on("finish", () => {
    const duration = Date.now() - startTime; // Calculate how long the request took
    const logDetails = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip, // Optionally log the user's IP address
    };

    // Write log details synchronously to the file
    logToFileSync(logDetails);
  });

  next(); // Call the next middleware or route handler
};
