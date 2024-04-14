const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, image, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    console.log(req, "name for file");
    cb(
      null,
      req.body.firstname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

router.post("/register", upload.single("image"), userController.register);
router.post("/login", userController.login);

module.exports = router;
