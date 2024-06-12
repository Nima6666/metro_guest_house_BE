const visitor = require("../model/visitor");

module.exports.addVisitor = async (req, res) => {
  console.log("adding visitor");
  console.log(req.headers.authData);

  try {
    const { firstname, lastname, phone, documentType, companion } = req.body;

    const visitorFound = await visitor.findOne({ phone: phone });

    if (visitorFound) {
      console.log("visitor found");
      return res.json({
        visitor: visitorFound,
      });
    }

    if (req.file) {
      console.log("File uploaded to:", req.file.path);
      const visitorToBeAdded = new visitor({
        firstname,
        lastname,
        phone,
        documentType,
        document: `${process.env.SELFORIGIN}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`,
        companion,
        enteredBy: req.headers.authData.id,
      });

      console.log(visitorToBeAdded);

      await visitorToBeAdded.save();

      const savedVisitor = await visitor
        .findById(visitorToBeAdded._id)
        .populate("enteredBy")
        .exec();

      console.log("visitor added", savedVisitor);
      res.status(201).json({ success: true, message: "visitor added" });
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
  console.log("getting all visitors");
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
          time: { $gte: startOfToday, $lt: now },
        },
      },
    });

    await Promise.all(
      visitorsToday.map(async (visitorT) => {
        await visitorT.populate("enteredBy");
        await visitorT.populate("entries.by");
      })
    );

    visitorsToday.sort((a, b) => {
      const timeA = a.entries[a.entries.length - 1].time;
      const timeB = b.entries[b.entries.length - 1].time;
      return new Date(timeA) - new Date(timeB);
    });

    const transformedData = visitorsToday.map((visitor) => {
      const lastEntryTime = visitor.entries[visitor.entries.length - 1].time;
      const enteredByAtLast = visitor.entries[visitor.entries.length - 1].by;
      const visitorObj = visitor.toObject(); // Convert Mongoose document to plain JavaScript object
      return {
        ...visitorObj,
        enteredAt: lastEntryTime,
        enteredBy: enteredByAtLast,
      };
    });

    console.log("Transformed Data", transformedData);

    return res.json({
      success: true,
      visitorsToday: transformedData,
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
