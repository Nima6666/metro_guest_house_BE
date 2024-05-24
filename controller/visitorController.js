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
    console.log(req.headers.authData);
    visitorToAddEntryTo.entries.push({
      time: Date.now(),
      by: req.headers.authData.id,
      companion: req.body.companion ? [...req.body.companion] : [""],
    });

    await visitorToAddEntryTo.save();
    res.json({ visitorToAddEntryTo });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};
