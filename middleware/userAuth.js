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
