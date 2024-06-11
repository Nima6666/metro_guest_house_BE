const jwt = require("jsonwebtoken");

module.exports.isAuthenticated = (req, res, next) => {
  const bearerToken = req.headers.authorization;

  if (typeof bearerToken !== "undefined") {
    const token = bearerToken.split(" ")[1];
    jwt.verify(token, process.env.SECRET, (err, authData) => {
      if (err) {
        res.json({
          success: false,
          message: "access denied",
        });
      } else {
        req.headers.authData = authData;
        setTimeout(() => {
          next();
        }, 0);
      }
    });
  } else {
    console.log("smthng went wrong validating token");
    res.sendStatus(403).json({
      message: "something went wrong",
    });
  }
};

module.exports.isAdmin = async (req, res, next) => {
  try {
    if (req.headers.authData.role == "admin") {
      next();
    } else {
      res.json({
        success: false,
        message: "access denied",
      });
    }
  } catch (err) {
    console.log(err);
    console.log("admin check failed");
    res.sendStatus(403).json({
      message: "something went wrong",
    });
  }
};
