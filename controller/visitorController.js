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
      remarks,
      vechileNumber,
      religion,
      lastVisited,
      nextDestination,
      room,
      companions,
      purpose,
    } = req.body;

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
        religion,
      });

      // console.log(visitorToBeAdded);

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
  const highlightMatchedWords = (text = "", searchString = "") => {
    if (!searchString) return text;
    const regex = new RegExp(`(${searchString})`, "gi");
    return text.replace(regex, "$1");
  };

  try {
    console.log("query ", req.query);

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

    // const highlightedVisitors = allVisitors.map((visitor) => {
    //   return {
    //     ...visitor.toObject(),
    //     firstname: highlightMatchedWords(visitor.firstname, firstname),
    //     lastname: highlightMatchedWords(visitor.lastname, lastname),
    //     number: highlightMatchedWords(visitor.number, number),
    //     documentId: highlightMatchedWords(visitor.documentId, documentId),
    //   };
    // });

    if (entry) {
    } else {
      res.json({
        success: true,
        visitors: allVisitors,
      });
    }
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

module.exports.getEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const foundVisitor = await visitor.findById(id);

    await foundVisitor.populate("entries.by");
    await foundVisitor.populate("entries.checkoutBy");

    const entry = foundVisitor.entries.find(
      (entry) => entry._id.toString() === entryId
    );

    setTimeout(() => {
      res.json({
        success: true,
        selectedEntry: entry,
      });
    }, 2000);

    console.log(entry);
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "something went wrong" });
  }
};

module.exports.entriesToday = async (req, res) => {
  console.log("getting entries today");
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
    res.json(err);
  }
};

module.exports.checkoutsToday = async (req, res) => {
  console.log("getting entries today");
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
    res.json(err);
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

      if (visitorFound.documentLocation) {
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
        visitorFound.documentLocation = `${
          process.env.SELFORIGIN
        }/${req.file.path.replace(/\\/g, "/")}`;

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

    console.log(existingEntry);

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

    flattenedData.sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return new Date(timeA) - new Date(timeB);
    });

    // console.log(flattenedData);

    res.json({ success: true, currentVisitors: flattenedData });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "something went wrong",
    });
  }
};

module.exports.editVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const foundVisitor = await visitor.findById(id);

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

    // console.log(editedVisitor);

    Object.assign(foundVisitor, editedVisitor);

    await foundVisitor.save();

    res.json({
      success: true,
      editedVisitor: foundVisitor,
      message: "Edited Visitor Successfully",
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Something went wrong editing",
    });
    console.log(err);
  }
};

module.exports.getAllEntries = async (req, res) => {
  console.log("getting all entries ", req.query.date);
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
    res.json(err);
  }
};
