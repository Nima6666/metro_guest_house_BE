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

const imageFilter = function (req, file, cb) {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only image files are allowed!"), false); // Reject the file
  }
};

const uploadProfile = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 1 MB size limit (in bytes)
  },
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

// router.get("/myProfile", isAuthenticated, userController.myProfile);

router.get("/getCurrentUser", isAuthenticated, userController.myProfile);

router.get("/:id", isAuthenticated, isAdmin, userController.getUser);
router.patch("/:id", isAuthenticated, isAdmin, userController.editUser);
router.post(
  "/:id/resetPassword",
  isAuthenticated,
  isAdmin,
  userController.resetUsersPassword
);
router.post(
  "/resetPasswordAdm",
  isAuthenticated,
  isAdmin,
  userController.resetAdminPassword
);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  uploadProfile.single("image"),
  userController.reuploadProfile
);
router.delete("/:id", isAuthenticated, isAdmin, userController.deleteUser);

module.exports = router;
