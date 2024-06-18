const express = require("express");
const router = express.Router();
const multer = require("multer");

const path = require("path");

const { isAuthenticated, isAdmin } = require("../middleware/userAuth");

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

router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  visitorController.deleteVisitor
);

router.patch("/:id", isAuthenticated, isAdmin, visitorController.editEntry);

router.post("/numberSearch", isAuthenticated, visitorController.numberSearch);

router.post("/:id/addEntry", isAuthenticated, visitorController.addEntry);

router.delete(
  "/:id/:entryId",
  isAuthenticated,
  isAdmin,
  visitorController.removeEntry
);

router.patch(
  "/:id/:entryId",
  isAuthenticated,
  isAdmin,
  visitorController.editEntry
);
router.put("/:id/:entryId", isAuthenticated, visitorController.checkout);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  uploadDocument.single("image"),
  visitorController.reuploadDocument
);

module.exports = router;
