const visitor = require("../model/visitor");
const fs = require("fs");
const path = require("path");

module.exports.addVisitor = async (req, res) => {
  console.log("adding visitor");
  console.log(req.headers.authData);

  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      address,
      documentType,
      gender,
      age,
      documentId,
      occupation,
    } = req.body;

    console.log(req.body);

    // res.json(req.body);

    const visitorFound = await visitor.findOne({ phone: phone });

    // if (visitorFound) {
    //   console.log("visitor found");
    //   return res.json({
    //     visitor: visitorFound,
    //   });
    // }

    if (req.file) {
      // console.log("File uploaded to:", req.file.path);
      const visitorToBeAdded = new visitor({
        firstname,
        lastname,
        email,
        phone,
        address,
        documentType,
        documentId,
        gender,
        age,
        occupation,
        documentLocation: `${process.env.SELFORIGIN}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`,
        enteredBy: req.headers.authData.id,
      });

      console.log(visitorToBeAdded);

      await visitorToBeAdded.save();

      visitorToBeAdded.populate("enteredBy");
      console.log("visitor added", visitorToBeAdded);
      res.status(201).json({
        success: true,
        message: "visitor added",
        visitorAdded: visitorToBeAdded,
      });
    } else {
      console.log("error uploading file");
      res.status(400).send("Error uploading file");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getVisitors = async (req, res) => {
  // console.log("getting all visitors");
  try {
    const allVisitors = await visitor.find({});

    await Promise.all(
      allVisitors.map((visitor) => visitor.populate("enteredBy"))
    );

    res.json({
      success: true,
      visitors: [...allVisitors],
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "something went wrong",
    });
  }
};

module.exports.getVisitor = async (req, res) => {
  console.log("getting selected visitor");
  try {
    const id = req.params.id;

    const selectedVisitor = await visitor.findById(id);
    await selectedVisitor.populate("enteredBy");
    await selectedVisitor.populate("entries.by");
    await selectedVisitor.populate("entries.checkoutBy");

    // if (selectedVisitor.entries.length > 0) {
    //   await selectedVisitor.populate("entries.by").execPopulate();
    // }

    res.json({
      success: true,
      selectedVisitor,
    });
  } catch (err) {
    console.log(err);
    res.json({ err });
  }
};

module.exports.numberSearch = async (req, res) => {
  console.log(req.body);
  try {
    const { number } = req.body;

    const numberString = number.toString();

    const regex = new RegExp(`^${numberString}`);

    const foundUsersWithInitialOfProvidedNumber = await visitor.find({
      phone: { $regex: regex },
    });

    await Promise.all(
      foundUsersWithInitialOfProvidedNumber.map((visitor) =>
        visitor.populate("enteredBy")
      )
    );

    console.log(foundUsersWithInitialOfProvidedNumber);
    res.json({ foundUsersWithInitialOfProvidedNumber });
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
};

module.exports.addEntry = async (req, res) => {
  const id = req.params.id;
  try {
    console.log(id, " getting user");
    const visitorToAddEntryTo = await visitor.findById(id);
    console.log("body ", req.body);
    visitorToAddEntryTo.entries.push({
      time: Date.now(),
      room: req.body.room,
      by: req.headers.authData.id,
      companion: [...req.body.companions],
      lastVisitedAddress: req.body.lastVisitedAddress,
      nextDestination: req.body.nextDestination,
      purposeOfVisit: req.body.purpose,
      vechileNumber: req.body.vechileNumber,
      remarks: req.body.remarks,
    });

    console.log(visitorToAddEntryTo);

    await visitorToAddEntryTo.save();

    res.json({ visitorToAddEntryTo });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};

module.exports.entriesToday = async (req, res) => {
  console.log("getting entries today");
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const now = new Date();
    const visitorsToday = await visitor.find({
      entries: {
        $elemMatch: {
          $or: [
            { time: { $gte: startOfToday, $lt: now } },
            { checkoutTime: { $gte: startOfToday, $lt: now } },
          ],
        },
      },
    });

    console.log(visitorsToday);

    const flattenedData = visitorsToday.flatMap((person) =>
      person.entries.map((entry) => ({
        firstname: person.firstname,
        lastname: person.lastname,
        phone: person.phone,
        room: entry.room,
        time: entry.time,
        enteredBy: entry.by,
        visitorId: person._id,
        entryId: entry._id,
        with: entry.companion.length,
        checkout: entry.checkoutTime,
        checkoutBy: entry.checkoutBy,
        // otherField: entry.otherField,
      }))
    );

    console.log(visitorsToday.length);
    console.log(flattenedData.length);

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    // console.log("populated Data");
    // console.log(flattenedData);

    return res.json({
      success: true,
      visitorsToday: flattenedData,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};

module.exports.removeEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const foundVisitor = await visitor.findById(id);
    foundVisitor.entries = foundVisitor.entries.filter(
      (entry) => entry._id.toString() !== entryId
    );

    await foundVisitor.save();
    console.log(foundVisitor);
    res.json({
      success: true,
      message: "Deleted Entry Successfully",
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports.editEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const foundVisitor = await visitor.findById(id);
    const entryToEdit = foundVisitor.entries.find(
      (entry) => entry._id.toString() === entryId
    );
    const index = foundVisitor.entries.findIndex(
      (entry) => entry._id.toString() === entryId
    );

    const existingEntry = foundVisitor.entries[index].toObject();

    console.log(existingEntry);
    foundVisitor.entries[index] = {
      ...existingEntry,
      room: req.body.room,
      companion: [...req.body.companions],
      lastVisitedAddress: req.body.lastVisitedAddress,
      nextDestination: req.body.nextDestination,
      purposeOfVisit: req.body.purpose,
      vechileNumber: req.body.vechileNumber,
      remarks: req.body.remarks,
      edited: true,
      editedTimeStamp: Date.now(),
    };

    console.log(foundVisitor.entries[index]);

    await foundVisitor.save();
    await foundVisitor.populate("entries.by");

    res.json({
      success: true,
      editedEntry: foundVisitor.entries[index],
      message: "Edited Entry Successfully",
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports.deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVisitor = await visitor.findByIdAndDelete(id);

    console.log(deletedVisitor);

    if (deletedVisitor) {
      res.json({ success: true, message: "Visitor deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Visitor not found." });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the visitor." });
  }
};

module.exports.reuploadDocument = async (req, res) => {
  try {
    if (req.file) {
      console.log(req.file);

      const { id } = req.params;
      console.log("File uploaded to:", req.file.path, id);

      const visitorFound = await visitor.findById(id);

      if (!visitorFound) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      console.log(req.body);

      const fileUrl = visitorFound.documentLocation;
      const urlParts = fileUrl.split("/");
      const relativePath = urlParts.slice(3).join("/"); // Adjust this based on your URL structure
      const filePath = path.join(__dirname, "..", relativePath);
      const normalizedPath = path.normalize(filePath);

      console.log(`Deleting file at path: ${normalizedPath}`);

      if (fs.existsSync(normalizedPath)) {
        fs.unlink(normalizedPath, async (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
            return res
              .status(500)
              .json({ message: "Error deleting file", error: err.message });
          }
          console.log("File deleted successfully");

          visitorFound.documentLocation = `${
            process.env.SELFORIGIN
          }/${req.file.path.replace(/\\/g, "/")}`;

          visitorFound.documentId = req.body.documentId;
          visitorFound.documentType = req.body.documentType;

          await visitorFound.save();

          res.json({
            success: true,
            updatedUser: visitorFound,
            message: "Document updated successfully",
          });
        });
      } else {
        console.log("File not found");

        visitorFound.documentLocation = `${
          process.env.SELFORIGIN
        }/${req.file.path.replace(/\\/g, "/")}`;

        await visitorFound.save();

        res.json({
          success: true,
          updatedUser: visitorFound,
          message: "File not found, but user image updated successfully",
        });
      }
    } else {
      res.status(400).json({ message: "No file uploaded" });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

module.exports.checkout = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const foundVisitor = await visitor.findById(id);
    const entryToEdit = foundVisitor.entries.find(
      (entry) => entry._id.toString() === entryId
    );
    const index = foundVisitor.entries.findIndex(
      (entry) => entry._id.toString() === entryId
    );

    const existingEntry = foundVisitor.entries[index].toObject();

    console.log(existingEntry);

    if (foundVisitor.entries[index].checkoutTime) {
      res.json({
        success: false,
        message: "Visitor Already Checked Out",
      });
    } else {
      foundVisitor.entries[index] = {
        ...existingEntry,
        checkoutTime: Date.now(),
        checkoutBy: req.headers.authData.id,
      };

      await foundVisitor.populate("entries.by");
      await foundVisitor.populate("entries.checkoutBy");
      await foundVisitor.save();

      res.json({
        success: true,
        editedEntry: foundVisitor.entries,
        message: "Checked Out",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports.getCurrentVisitors = async (req, res) => {
  try {
    console.log("getting current visitors");
    const currentVisitors = await visitor.aggregate([
      {
        $match: {
          "entries.checkoutTime": null,
        },
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          phone: 1,
          entries: {
            $filter: {
              input: "$entries",
              as: "entry",
              cond: { $eq: ["$$entry.checkoutTime", null] },
            },
          },
        },
      },
    ]);

    const flattenedData = currentVisitors.flatMap((person) =>
      person.entries.map((entry) => ({
        firstname: person.firstname,
        lastname: person.lastname,
        phone: person.phone,
        room: entry.room,
        time: entry.time,
        visitorId: person._id,
        entryId: entry._id,
        with: entry.companion.length,
        // otherField: entry.otherField,
      }))
    );

    console.log(flattenedData);

    res.json({ success: true, currentVisitors: flattenedData });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "something went wrong",
    });
  }
};
