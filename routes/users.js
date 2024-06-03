const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

const path = require("path");
const multer = require("multer");
const { isAuthenticated } = require("../middleware/userAuth");

const storage = multer.diskStorage({
  destination: function (req, image, cb) {
    cb(null, "uploads/profile/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadProfile = multer({
  storage: storage,
});

router.get("/", isAuthenticated, userController.getUsers);

router.post(
  "/register",
  uploadProfile.single("image"),
  userController.register
);

router.post("/login", userController.login);

router.get("/getCurrentUser", isAuthenticated, userController.getCurrentUser);

router.get("/:id", isAuthenticated, userController.getUser);

module.exports = router;
