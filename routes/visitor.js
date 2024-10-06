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

const uploadDocument = multer({
  storage: storageDocument,
  fileFilter: imageFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 1 MB size limit (in bytes)
  },
});

router.post(
  "/",
  isAuthenticated,
  uploadDocument.single("image"),
  visitorController.addVisitor
);

router.get(
  "/currentVisitors",
  isAuthenticated,
  visitorController.getCurrentVisitors
);

router.get("/", isAuthenticated, visitorController.getVisitors);
router.get("/entriesToday", isAuthenticated, visitorController.entriesToday);
router.get("/allEntries", isAuthenticated, visitorController.getAllEntries);
router.get(
  "/checkoutsToday",
  isAuthenticated,
  visitorController.checkoutsToday
);
router.get("/checkInsToday", isAuthenticated, visitorController.checkInsToday);

router.get("/:id", isAuthenticated, visitorController.getVisitor);

router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  visitorController.deleteVisitor
);

router.patch("/:id", isAuthenticated, isAdmin, visitorController.editVisitor);

router.post("/numberSearch", isAuthenticated, visitorController.numberSearch);

router.post("/:id/addEntry", isAuthenticated, visitorController.addEntry);

router.delete(
  "/:id/:entryId",
  isAuthenticated,
  isAdmin,
  visitorController.removeEntry
);

router.get("/:id/:entryId", isAuthenticated, visitorController.getEntry);

router.patch(
  "/:id/:entryId",
  isAuthenticated,
  isAdmin,
  visitorController.editEntry
);
router.put("/:id/:entryId", isAuthenticated, visitorController.checkout);
router.put(
  "/:id/:entryId/notCheckout",
  isAuthenticated,
  isAdmin,
  visitorController.notCheckout
);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  uploadDocument.single("image"),
  visitorController.reuploadDocument
);

module.exports = router;
