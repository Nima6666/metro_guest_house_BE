const expressAsyncHandler = require("express-async-handler");
const User = require("../model/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../model/users");

module.exports.register = expressAsyncHandler(async (req, res) => {
  console.log("registering");
  try {
    const { firstname, lastname, email, password, phone, role } = req.body;

    const alreadyReistered = await users.findOne({ email: email });

    if (alreadyReistered) {
      console.log("already registered");
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
        image: req.file.path,
      });

      const existingUsers = await users.find({});
      if (existingUsers.length === 0) {
        user.role = "admin";
      }

      console.log(user);

      await user.save();
      console.log("user created successfully");
      res.status(201).json({ message: "User registered successfully", user });
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
    const userFound = await users.findOne({ email: email });

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

  const userFound = await users.findOne({ email: email });

  // res.status(201).json({ message: "User login successfully", user });
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

module.exports.addVisitor = async (req, res) => {
  console.log("adding visitor");

  try {
    res.json(req.body);
  } catch (err) {
    res.json(err);
  }
};

module.exports.getUsers = async (req, res) => {
  console.log("getting all users");
  try {
    const allUsers = await users.find({});
    res.json({
      allusers: [...allUsers],
    });
  } catch (err) {
    console.log("error");
    res.json(err);
  }
};
