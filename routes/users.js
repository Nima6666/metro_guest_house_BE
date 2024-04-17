const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

const path = require("path");
const multer = require("multer");
const { isAuthenticated } = require("../middleware/userAuth");

const storage = multer.diskStorage({
  destination: function (req, image, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

router.post("/register", upload.single("image"), userController.register);
router.post("/login", userController.login);

router.get("/getCurrentUser", isAuthenticated, userController.getCurrentUser);

module.exports = router;
