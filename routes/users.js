const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

const path = require("path");
const multer = require("multer");
const { isAuthenticated, isAdmin } = require("../middleware/userAuth");

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

router.get("/serverStat", userController.getStat);
router.get("/", isAuthenticated, userController.getUsers);

router.post(
  "/register",
  isAuthenticated,
  isAdmin,
  uploadProfile.single("image"),
  userController.register
);

router.post(
  "/admin",
  uploadProfile.single("image"),
  userController.adminRegister
);

router.post("/login", userController.login);

router.get("/getCurrentUser", isAuthenticated, userController.getCurrentUser);

router.get("/:id", isAuthenticated, isAdmin, userController.getUser);
router.patch("/:id", isAuthenticated, isAdmin, userController.editUser);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  uploadProfile.single("image"),
  userController.reuploadProfile
);
router.delete("/:id", isAuthenticated, isAdmin, userController.deleteUser);

module.exports = router;
