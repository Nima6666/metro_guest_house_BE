var express = require("express");
const { isAuthenticated, isAdmin } = require("../middleware/userAuth");
var router = express.Router();
const userController = require("../controller/userController");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json({ title: "Express" });
});

router.post(
  "/admpswdrst",
  isAuthenticated,
  isAdmin,
  userController.resetAdminPassword
);

module.exports = router;
