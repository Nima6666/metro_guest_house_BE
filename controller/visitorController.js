const visitor = require("../model/visitor");
const fs = require("fs");
const path = require("path");

const checkDuplication = async (field, value) => {
  const alreadyRegistered = await visitor.findOne({ [field]: value });
  if (alreadyRegistered) {
    return true;
  }
  return false;
};

const deleteFile = (filePath) => {
  try {
    const normalizedPath = path.normalize(filePath); // Normalize the file path

    fs.unlinkSync(normalizedPath); // Synchronously delete the file
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.addVisitor = async (req, res) => {
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
      remarks,
      vechileNumber,
      religion,
      lastVisited,
      nextDestination,
      room,
      purpose,
    } = req.body;

    if (
      !lastname ||
      !phone ||
      !address ||
      !gender ||
      !age ||
      !occupation ||
      !lastVisited ||
      !nextDestination ||
      !room ||
      !purpose
    ) {
      return res.json({
        message: "form fields missing",
      });
    }

    if (email) {
      const foundVisitorUsingEmail = await checkDuplication("email", email);
      if (foundVisitorUsingEmail) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.json({
          message: "email in use",
        });
      }
    }

    const phoneAlreadyReistered = await checkDuplication("phone", phone);

    if (phoneAlreadyReistered) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.json({
        message: "phone number in use",
      });
    }

    if (documentType && documentId) {
      const foundVisitorWithDoc = await visitor.findOne({
        documentType,
        documentId,
      });
      if (foundVisitorWithDoc) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.json({
          message: "found visitor with provided document",
        });
      }
    }

    if (req.file) {
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
        documentLocation: req.file.path,
        enteredBy: req.headers.authData.id,
        religion,
      });

      visitorToBeAdded.entries.push({
        time: Date.now(),
        room: room,
        by: req.headers.authData.id,
        companion: [...JSON.parse(req.body.companions)],
        lastVisitedAddress: lastVisited,
        nextDestination: nextDestination,
        purposeOfVisit: purpose,
        vechileNumber: vechileNumber,
        remarks: remarks,
      });

      await visitorToBeAdded.save();

      visitorToBeAdded.populate("enteredBy");
      res.status(201).json({
        success: true,
        message: "visitor added",
        visitorAdded: visitorToBeAdded,
      });
    } else {
      const visitorToBeAdded = new visitor({
        firstname,
        lastname,
        email,
        phone,
        address,
        gender,
        age,
        occupation,
        enteredBy: req.headers.authData.id,
        religion,
      });

      visitorToBeAdded.entries.push({
        time: Date.now(),
        room: room,
        by: req.headers.authData.id,
        companion: [...JSON.parse(req.body.companions)],
        lastVisitedAddress: lastVisited,
        nextDestination: nextDestination,
        purposeOfVisit: purpose,
        vechileNumber: vechileNumber,
        remarks: remarks,
      });

      await visitorToBeAdded.save();

      visitorToBeAdded.populate("enteredBy");
      res.status(201).json({
        success: true,
        message: "visitor added without document",
        visitorAdded: visitorToBeAdded,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getVisitors = async (req, res) => {
  try {
    let allVisitors = [];

    const { firstname, lastname, number, documentId, entry } = req.query;

    const query = {};

    if (firstname && firstname.trim() !== "") {
      query.firstname = { $regex: firstname, $options: "i" }; // case-insensitive regex search
    }
    if (lastname && lastname.trim() !== "") {
      query.lastname = { $regex: lastname, $options: "i" };
    }
    if (number && number.trim() !== "") {
      query.phone = { $regex: number, $options: "i" };
    }
    if (documentId && documentId.trim() !== "") {
      query.documentId = { $regex: documentId, $options: "i" };
    }

    // If query is empty, find all visitors
    if (Object.keys(query).length === 0) {
      allVisitors = await visitor.find({});
    } else {
      allVisitors = await visitor.find(query);
    }
    await Promise.all(
      allVisitors.map((visitor) => visitor.populate("enteredBy"))
    );

    if (entry) {
      const filtered = allVisitors.filter((visitor) => {
        return visitor.entries.length > 0;
      });

      const flattenedData = filtered.flatMap((person) =>
        person.entries.map((entry) => ({
          firstname: person.firstname,
          lastname: person.lastname,
          phone: person.phone,
          room: entry.room,
          time: entry.time,
          enteredBy: entry.enteredBy,
          visitorId: person._id,
          entryId: entry._id,
          with: entry.companion.length,
          checkout: entry.checkoutTime,
          checkoutBy: entry.checkoutBy,
        }))
      );

      flattenedData.sort((a, b) => new Date(b.time) - new Date(a.time));

      res.json({
        success: true,
        visitors: flattenedData,
      });
    } else {
      res.json({
        success: true,
        visitors: allVisitors,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getVisitor = async (req, res) => {
  try {
    const id = req.params.id;

    const selectedVisitor = await visitor.findById(id);
    await selectedVisitor.populate("enteredBy");
    await selectedVisitor.populate("entries.by");
    await selectedVisitor.populate("entries.checkoutBy");

    // if (selectedVisitor.entries.length > 0) {
    //   await selectedVisitor.populate("entries.by").execPopulate();
    // }

    selectedVisitor.entries.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({
      success: true,
      selectedVisitor,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.numberSearch = async (req, res) => {
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

    res.json({ foundUsersWithInitialOfProvidedNumber });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.addEntry = async (req, res) => {
  const id = req.params.id;
  try {
    const visitorToAddEntryTo = await visitor.findById(id);
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

    await visitorToAddEntryTo.save();

    await visitorToAddEntryTo.populate("enteredBy");
    await visitorToAddEntryTo.populate("entries.by");
    await visitorToAddEntryTo.populate("entries.checkoutBy");
    res.json({ success: true, visitorToAddEntryTo, message: "Entry Added" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const foundVisitor = await visitor.findById(id);

    await foundVisitor.populate("entries.by");
    await foundVisitor.populate("entries.checkoutBy");

    const entry = foundVisitor.entries.find(
      (entry) => entry._id.toString() === entryId
    );
    res.json({
      success: true,
      selectedEntry: entry,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.entriesToday = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const now = new Date();
    const visitorsToday = await visitor.aggregate([
      {
        $match: {
          entries: {
            $elemMatch: {
              $or: [
                { time: { $gte: startOfToday, $lt: now } },
                { checkoutTime: { $gte: startOfToday, $lt: now } },
              ],
            },
          },
        },
      },
      {
        $addFields: {
          entries: {
            $filter: {
              input: "$entries",
              as: "entry",
              cond: {
                $or: [
                  {
                    $and: [
                      { $gte: ["$$entry.time", startOfToday] },
                      { $lt: ["$$entry.time", now] },
                    ],
                  },
                  {
                    $and: [
                      { $gte: ["$$entry.checkoutTime", startOfToday] },
                      { $lt: ["$$entry.checkoutTime", now] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]);

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

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    return res.json({
      success: true,
      visitorsToday: flattenedData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.checkoutsToday = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const now = new Date();

    const visitorsToday = await visitor.aggregate([
      {
        $match: {
          entries: {
            $elemMatch: {
              checkoutTime: { $gte: startOfToday, $lt: now, $ne: null },
            },
          },
        },
      },
      {
        $addFields: {
          entries: {
            $filter: {
              input: "$entries",
              as: "entry",
              cond: {
                $and: [
                  { $gte: ["$$entry.checkoutTime", startOfToday] },
                  { $lt: ["$$entry.checkoutTime", now] },
                  { $ne: ["$$entry.checkoutTime", null] },
                ],
              },
            },
          },
        },
      },
    ]);

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

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    return res.json({
      success: true,
      checkoutsToday: flattenedData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.checkInsToday = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const now = new Date();

    const visitorsToday = await visitor.aggregate([
      {
        $match: {
          entries: {
            $elemMatch: {
              time: { $gte: startOfToday, $lt: now, $ne: null },
            },
          },
        },
      },
      {
        $addFields: {
          entries: {
            $filter: {
              input: "$entries",
              as: "entry",
              cond: {
                $and: [
                  { $gte: ["$$entry.time", startOfToday] },
                  { $lt: ["$$entry.time", now] },
                  { $ne: ["$$entry.time", null] },
                ],
              },
            },
          },
        },
      },
    ]);

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

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    return res.json({
      success: true,
      checkInsToday: flattenedData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
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
    res.json({
      success: true,
      message: "Deleted Entry Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
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

    await foundVisitor.save();
    await foundVisitor.populate("entries.by");

    res.json({
      success: true,
      editedEntry: foundVisitor.entries[index],
      message: "Edited Entry Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVisitor = await visitor.findByIdAndDelete(id);

    if (deletedVisitor) {
      res.json({ success: true, message: "Visitor deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Visitor not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.reuploadDocument = async (req, res) => {
  try {
    if (req.file) {
      const { id } = req.params;

      const visitorFound = await visitor.findById(id);

      if (!visitorFound) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      if (
        visitorFound.documentId !== req.body.documentId ||
        visitorFound.documentType !== req.body.documentType
      ) {
        const visitorFoundUsingDoc = await visitor.findOne({
          documentType: req.body.documentType,
          documentId: req.body.documentId,
        });

        if (visitorFoundUsingDoc) {
          return res.json({
            message: "visitor found with provided document.",
          });
        }
      }
      if (visitorFound.documentLocation) {
        const fileUrl = visitorFound.documentLocation;
        const filePath = path.join(__dirname, "..", fileUrl);
        const normalizedPath = path.normalize(filePath);

        if (fs.existsSync(normalizedPath)) {
          fs.unlink(normalizedPath, async (err) => {
            if (err) {
              console.error(`Error deleting file: ${err.message}`);
              return res
                .status(500)
                .json({ message: "Error deleting file", error: err.message });
            }

            visitorFound.documentLocation = req.file.path;

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
          visitorFound.documentLocation = req.file.path;
          visitorFound.documentId = req.body.documentId;
          visitorFound.documentType = req.body.documentType;

          await visitorFound.save();

          res.json({
            success: true,
            updatedUser: visitorFound,
            message: "File not found, but user image updated successfully",
          });
        }
      } else {
        visitorFound.documentLocation = req.file.path;

        visitorFound.documentId = req.body.documentId;
        visitorFound.documentType = req.body.documentType;

        await visitorFound.save();
        res.json({
          success: true,
          updatedUser: visitorFound,
          message: "image updated successfully",
        });
      }
    } else {
      res.status(400).json({ message: "No file uploaded" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
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

      flattenedData.sort((a, b) => {
        const timeA = a.time;
        const timeB = b.time;
        return new Date(timeA) - new Date(timeB);
      });

      res.json({
        success: true,
        editedEntry: foundVisitor.entries,
        currentVisitors: flattenedData,
        message: "Checked Out",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.notCheckout = async (req, res) => {
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

    foundVisitor.entries[index] = {
      ...existingEntry,
      checkoutTime: null,
      checkoutBy: req.headers.authData.id,
    };

    await foundVisitor.populate("entries.by");
    await foundVisitor.populate("entries.checkoutBy");
    await foundVisitor.save();

    res.json({
      success: true,
      editedEntry: foundVisitor.entries,
      message: "operation completed successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getCurrentVisitors = async (req, res) => {
  try {
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
      }))
    );

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    res.json({ success: true, currentVisitors: flattenedData });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.editVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const foundVisitor = await visitor.findById(id);

    const email = req.body.email;
    const phone = req.body.phone;

    if (email !== foundVisitor.email) {
      const foundVisitorWithEmail = await visitor.findOne({ email: email });
      if (foundVisitorWithEmail) {
        return res.json({ message: "Email in use by another visitor" });
      }
    }

    if (phone !== foundVisitor.phone) {
      foundVisitorWithPhone = await visitor.findOne({ phone: phone });
      if (foundVisitorWithPhone) {
        return res.json({ message: "phone in use by another visitor" });
      }
    }

    const existingDatas = foundVisitor.toObject();

    const editedVisitor = {
      ...existingDatas,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      gender: req.body.gender,
      age: req.body.age,
      religion: req.body.religion,
      edited: true,
      editedTimeStamp: Date.now(),
    };

    Object.assign(foundVisitor, editedVisitor);

    await foundVisitor.save();
    res.json({
      success: true,
      editedVisitor: foundVisitor,
      message: "Edited Visitor Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getAllEntries = async (req, res) => {
  try {
    let visitors = null;
    const { date } = req.query;
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      visitors = await visitor.aggregate([
        {
          $addFields: {
            entries: {
              $filter: {
                input: "$entries",
                as: "entry",
                cond: {
                  $or: [
                    {
                      $and: [
                        { $gte: ["$$entry.time", startOfDay] },
                        { $lt: ["$$entry.time", endOfDay] },
                      ],
                    },
                    {
                      $and: [
                        { $gte: ["$$entry.checkoutTime", startOfDay] },
                        { $lt: ["$$entry.checkoutTime", endOfDay] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            "entries.0": { $exists: true },
          },
        },
      ]);
    } else {
      visitors = await visitor.aggregate([
        {
          $addFields: {
            entries: "$entries",
          },
        },
      ]);
    }

    const flattenedData = visitors.flatMap((person) =>
      person.entries.map((entry) => ({
        firstname: person.firstname,
        lastname: person.lastname,
        phone: person.phone,
        room: entry.room,
        time: entry.time,
        enteredBy: entry.enteredBy,
        visitorId: person._id,
        entryId: entry._id,
        with: entry.companion.length,
        checkout: entry.checkoutTime,
        checkoutBy: entry.checkoutBy,
      }))
    );

    flattenedData.sort((a, b) => new Date(b.time) - new Date(a.time));

    return res.json({
      success: true,
      allEntries: flattenedData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};
