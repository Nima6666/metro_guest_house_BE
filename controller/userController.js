const expressAsyncHandler = require("express-async-handler");
const User = require("../model/users");
const bcrypt = require("bcryptjs");

module.exports.register = expressAsyncHandler(async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone, role } = req.body;

    if (req.file) {
      console.log("File uploaded to:", req.file.path);

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        phone,
        role,
        image: req.file.path,
      });

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
  if (!["staff", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = new User({
    email,
    password,
  });
  await user.save();

  res.status(201).json({ message: "User login successfully", user });
});
