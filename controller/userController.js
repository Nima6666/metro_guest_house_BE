const expressAsyncHandler = require("express-async-handler");
const User = require("../model/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const visitor = require("../model/visitor");
const path = require("path");
const fs = require("fs");

const containsWhitespace = (str) => /\s/.test(str);

module.exports.adminRegister = async (req, res) => {
  console.log("registering");
  try {
    const { firstname, lastname, email, password, phone, username } = req.body;

    if (containsWhitespace(username)) {
      delete req.file;
      return res.json({
        success: false,
        message: "username should not contain whitespace",
      });
    }

    const users = await User.find({});
    if (users.length) {
      return res.json({
        success: false,
        message: "Admin for this server is already registered",
      });
    }

    if (req.file) {
      console.log("File uploaded to:", req.file.path);

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new User({
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        phone,
        imageURL: req.file.path,
        role: "admin",
      });

      // const existingUsers = await User.find({});
      // if (existingUsers.length === 0) {
      //   user.role = "admin";
      // }

      await admin.save();
      res.status(201).json({
        success: true,
        message: "Admin registered successfully for this server.",
        admin,
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

module.exports.register = async (req, res) => {
  console.log("registering");
  try {
    const { firstname, lastname, email, password, phone, username } = req.body;

    if (containsWhitespace(username)) {
      delete req.file;
      return res.json({
        success: false,
        message: "username should not contain whitespace",
      });
    }

    const UsernameAlreadyReistered = await User.findOne({ username: username });

    if (UsernameAlreadyReistered) {
      console.log("already registered");
      delete req.file;
      return res.json({
        success: false,
        message: "username already taken",
      });
    }

    const EmailAlreadyReistered = await User.findOne({ email: email });

    if (email && email.trim() !== "" && EmailAlreadyReistered) {
      console.log("already registered");
      delete req.file;
      return res.json({
        success: false,
        message: "email already registered",
      });
    }

    if (req.file) {
      console.log("File uploaded to:", req.file.path);

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        phone,
        imageURL: req.file.path,
      });

      // const existingUsers = await User.find({});
      // if (existingUsers.length === 0) {
      //   user.role = "admin";
      // }

      console.log(user);

      await user.save();
      console.log("user created successfully");
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
      });
    } else {
      console.log("error uploading file");
      res.json({ success: false, message: "no image selected" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.login = expressAsyncHandler(async (req, res) => {
  const username = req.body.username;
  const passwordBody = req.body.password;
  try {
    const userFound = await User.findOne({ username });

    if (userFound) {
      const isValidPassword = await bcrypt.compare(
        passwordBody,
        userFound.password
      );

      if (!isValidPassword) {
        return res.json({
          message: "incorrect password",
        });
      }

      const infoObject = {
        id: userFound._id,
        username: userFound.username,
        role: userFound.role,
        image: userFound.imageURL,
      };
      const expiryInfo = {
        expiresIn: "1h",
      };

      const token = jwt.sign(infoObject, process.env.SECRET, expiryInfo);

      const { password, ...userWithoutPassword } = userFound;

      return res.json({
        success: true,
        message: "loggedIn successfully",
        token,
        user: userWithoutPassword,
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
    const loggedInUser = await User.findById(req.headers.authData.id).select(
      "-password"
    );
    // console.log(req.headers.authData, "Auth data");

    if (!loggedInUser) {
      return res.json({
        success: false,
        message: "User not found",
      });
    } else {
      res.json({
        success: true,
        loggedInUser,
      });
    }
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
    const staffs = allUsers.filter(
      (user) => user._id.toString() !== req.headers.authData.id
    );
    res.json({
      success: "true",
      allusers: [...staffs],
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (deletedUser) {
      const fileUrl = deletedUser.imageURL;
      const normalizedPath = path.normalize(fileUrl);

      console.log(`Deleting file at path: ${normalizedPath}`);

      if (fs.existsSync(normalizedPath)) {
        fs.unlink(normalizedPath, async (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
            return res
              .status(500)
              .json({ message: "Error deleting file", error: err.message });
          }
          console.log("deleted user");
          res.json({ success: true, message: "User deleted successfully." });
        });
      } else {
        console.log("Profile Img not found but deleted user");
        res.json({
          status: true,
          message: "Profile Img not found but deleted user",
        });
      }
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the visitor." });
  }
};

module.exports.getUser = async (req, res) => {
  console.log("getting selected user");

  const id = req.params.id;

  try {
    const selectedUser = await User.findById(id).select("-password");

    if (!selectedUser) {
      return res.json({
        success: false,
        message: "user not found",
      });
    }

    if (selectedUser.role === "admin") {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: selectedUser,
    });
  } catch {
    res.json({
      success: false,
      message: "something went wrong",
    });
  }
};

module.exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const foundUser = await User.findById(id);

    if (
      req.body.firstname.trim() === "" ||
      req.body.lastname.trim() === "" ||
      req.body.phone.trim === ""
    ) {
      return res.json({ success: false, message: "all fields are required" });
    }

    const editedUser = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      // address: req.body.address,
      // gender: req.body.gender,
      // age: req.body.age,
      // edited: true,
      // editedTimeStamp: Date.now(),
    };

    console.log(editedUser);

    Object.assign(foundUser, editedUser);

    await foundUser.save();

    res.json({
      success: true,
      editedUser: foundUser,
      message: "Edited User Successfully",
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Something went wrong editing",
    });
    console.log(err);
  }
};

module.exports.getStat = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, stat: users.length ? true : false });
  } catch (err) {
    res.json({
      message: "something went wrong",
    });
  }
};

module.exports.reuploadProfile = async (req, res) => {
  try {
    if (req.file) {
      console.log(req.file);

      const { id } = req.params;
      console.log("File uploaded to:", req.file.path, id);

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(user.imageURL);

      const fileUrl = user.imageURL;
      const normalizedPath = path.normalize(fileUrl);

      console.log(`Deleting file at path: ${normalizedPath}`);

      if (fs.existsSync(normalizedPath)) {
        fs.unlink(normalizedPath, async (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
            delete req.file;
            return res
              .status(500)
              .json({ message: "Error deleting file", error: err.message });
          }
          console.log("File deleted successfully");

          user.imageURL = req.file.path;

          await user.save();
          res.json({
            success: true,
            updatedUser: user,
            message: "Image updated successfully",
          });
        });
      } else {
        console.log("File not found");

        user.imageURL = req.file.path;

        await user.save();

        res.json({
          success: true,
          updatedUser: user,
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

module.exports.resetUsersPassword = async (req, res) => {
  try {
    console.log(req.body);

    if (req.body.password.trim() === "") {
      return res.json({
        success: false,
        message: "Please fill up the form",
      });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password Changed",
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "something went wrong",
    });
  }
};

module.exports.myProfile = async (req, res) => {
  try {
    console.log(req.headers.authData);
    const profile = await User.findById(req.headers.authData.id).select(
      "-password"
    );
    res.json({
      success: true,
      profile,
    });
  } catch (err) {
    console.log(err);
    res.json("something went wrong getting my profile");
  }
};
