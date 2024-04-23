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
            file.originalname +
                "-" +
                Date.now() +
                path.extname(file.originalname)
        );
    },
});

const uploadProfile = multer({
    storage: storage,
});

const storageDocument = multer.diskStorage({
    destination: function (req, image, cb) {
        cb(null, "uploads/document/");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.originalname +
                "-" +
                Date.now() +
                path.extname(file.originalname)
        );
    },
});

const uploadDocument = multer({
    storage: storageDocument,
});

router.get("/", isAuthenticated, userController.getUsers);

router.post(
    "/register",
    uploadProfile.single("image"),
    userController.register
);
router.post("/login", userController.login);

router.get("/getCurrentUser", isAuthenticated, userController.getCurrentUser);

router.post(
    "/visitor",
    isAuthenticated,
    uploadDocument.single("image"),
    userController.addVisitor
);

router.get("/:id", isAuthenticated, userController.getUser);

module.exports = router;
