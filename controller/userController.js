const expressAsyncHandler = require("express-async-handler");
const User = require("../model/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const visitor = require("../model/visitor");

module.exports.register = expressAsyncHandler(async (req, res) => {
  console.log("registering");
  try {
    const { firstname, lastname, email, password, phone } = req.body;

    const alreadyReistered = await User.findOne({ email: email });

    if (alreadyReistered) {
      console.log("already registered");
      delete req.file;
      return res.json({
        message: "email already registered",
      });
    }

    if (req.file) {
      console.log("File uploaded to:", req.file.path);

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        phone,
        imageURL: `${process.env.SELFORIGIN}/${req.file.path.replace(
          /\\/g,
          "/"
        )}`,
      });

      const existingUsers = await User.find({});
      if (existingUsers.length === 0) {
        user.role = "admin";
      }

      console.log(user);

      await user.save();
      console.log("user created successfully");
      res
        .status(201)
        .json({ success: true, message: "User registered successfully", user });
    } else {
      console.log("error uploading file");
      res.status(400).send("Error uploading file");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports.login = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const userFound = await User.findOne({ email: email });

    if (userFound) {
      const isValidPassword = await bcrypt.compare(
        password,
        userFound.password
      );

      if (!isValidPassword) {
        return res.json({
          message: "incorrect password",
        });
      }

      const infoObject = {
        id: userFound._id,
        name: userFound.firstname,
        image: userFound.image,
      };
      const expiryInfo = {
        expiresIn: "1h",
      };

      const token = jwt.sign(infoObject, process.env.SECRET, expiryInfo);

      return res.json({
        success: true,
        message: "loggedIn successfully",
        token,
        user: userFound,
      });
    } else {
      return res.json({
        message: "incorrect username or password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong",
      err: err,
    });
  }
});

module.exports.getCurrentUser = expressAsyncHandler(async (req, res) => {
  console.log("getting current user");
  try {
    res.json(req.headers.authData);
  } catch (err) {
    res.status(500).json({
      err,
    });
  }
});

module.exports.getUsers = async (req, res) => {
  console.log("getting all users");
  try {
    const allUsers = await User.find({});
    res.json({
      allusers: [...allUsers],
    });
  } catch (err) {
    console.log("error");
    res.json(err);
  }
};

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
        document: req.file.path,
        companion,
        enteredBy: req.headers.authData.id,
      });

      console.log(visitorToBeAdded);

      await visitorToBeAdded.save();
      console.log("visitor added");
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
