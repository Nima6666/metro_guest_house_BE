const express = require("express");
const router = express.Router();
const multer = require("multer");

const path = require("path");

const { isAuthenticated } = require("../middleware/userAuth");

const visitorController = require("../controller/visitorController");

const storageDocument = multer.diskStorage({
  destination: function (req, image, cb) {
    cb(null, "uploads/document/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadDocument = multer({
  storage: storageDocument,
});

router.post(
  "/",
  isAuthenticated,
  uploadDocument.single("image"),
  visitorController.addVisitor
);

router.get("/", isAuthenticated, visitorController.getVisitors);
router.get("/entriesToday", isAuthenticated, visitorController.entriesToday);

router.get("/:id", isAuthenticated, visitorController.getVisitor);

router.post("/numberSearch", isAuthenticated, visitorController.numberSearch);

router.post("/:id/addEntry", isAuthenticated, visitorController.addEntry);

module.exports = router;
