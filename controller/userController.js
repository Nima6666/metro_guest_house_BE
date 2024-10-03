const expressAsyncHandler = require("express-async-handler");
const User = require("../model/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const visitor = require("../model/visitor");
const path = require("path");
const fs = require("fs");

const containsWhitespace = (str) => /\s/.test(str);

const checkIfRegistered = async (field, value) => {
  const alreadyRegistered = await User.findOne({ [field]: value });
  if (alreadyRegistered) {
    return true;
  }
  return false;
};

const deleteFile = (filePath) => {
  try {
    const normalizedPath = path.normalize(filePath);

    fs.unlinkSync(normalizedPath);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.adminRegister = async (req, res) => {
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
      res.status(400).send("Error uploading file");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone, username } = req.body;

    if (!firstname || !lastname || !phone || !username) {
      deleteFile(req.file.path);
      return res.json({
        message: "form feilds missing",
      });
    }

    if (containsWhitespace(username)) {
      deleteFile(req.file.path);
      return res.json({
        message: "username should not contain whitespace",
      });
    }

    const UsernameAlreadyReistered = await checkIfRegistered(
      "username",
      username
    );

    if (UsernameAlreadyReistered) {
      deleteFile(req.file.path);
      return res.json({
        message: "username already taken",
      });
    }

    const phoneAlreadyReistered = await checkIfRegistered("phone", phone);

    if (phoneAlreadyReistered) {
      deleteFile(req.file.path);
      return res.json({
        message: "phone number in use",
      });
    }

    if (email) {
      const EmailAlreadyReistered = await checkIfRegistered("email", email);

      if (email && email.trim() !== "" && EmailAlreadyReistered) {
        deleteFile(req.file.path);
        return res.json({
          success: false,
          message: "email in use",
        });
      }
    }

    if (req.file) {
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

      await user.save();
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
      });
    } else {
      res.json({ success: false, message: "no image selected" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
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
      message: err.message,
    });
  }
});

module.exports.getCurrentUser = expressAsyncHandler(async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.headers.authData.id).select(
      "-password"
    );

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
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports.getUsers = async (req, res) => {
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
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (deletedUser) {
      const fileUrl = deletedUser.imageURL;
      const normalizedPath = path.normalize(fileUrl);

      if (fs.existsSync(normalizedPath)) {
        fs.unlink(normalizedPath, async (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
            return res
              .status(500)
              .json({ message: "Error deleting file", error: err.message });
          }
          res.json({ success: true, message: "User deleted successfully." });
        });
      } else {
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
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getUser = async (req, res) => {
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
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const foundUser = await User.findById(id);

    if (!foundUser) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    if (req.body.email) {
      if (req.body.email !== foundUser.email) {
        const EmailAlreadyReistered = await User.findOne({
          email: req.body.email,
        });

        if (EmailAlreadyReistered) {
          return res.json({
            success: false,
            message: "email in use",
          });
        }
      }
    }

    if (foundUser.phone !== req.body.phone) {
      const phoneInUse = await User.findOne({
        phone: req.body.phone,
      });
      if (phoneInUse) {
        return res.json({
          success: false,
          message: "phone number in use",
        });
      }
    }

    if (
      req.body.firstname.trim() === "" ||
      req.body.lastname.trim() === "" ||
      req.body.phone === ""
    ) {
      return res.json({ message: "all fields are required" });
    }

    const editedUser = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email ? req.body.email : null,
      phone: req.body.phone,
    };

    Object.assign(foundUser, editedUser);

    await foundUser.save();

    res.json({
      success: true,
      editedUser: foundUser,
      message: "Edited User Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.getStat = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, stat: users.length ? true : false });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.reuploadProfile = async (req, res) => {
  try {
    if (req.file) {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const fileUrl = user.imageURL;
      const normalizedPath = path.normalize(fileUrl);

      if (fs.existsSync(normalizedPath)) {
        fs.unlink(normalizedPath, async (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
            delete req.file;
            return res
              .status(500)
              .json({ message: "Error deleting file", error: err.message });
          }

          user.imageURL = req.file.path;

          await user.save();
          res.json({
            success: true,
            updatedUser: user,
            message: "Image updated successfully",
          });
        });
      } else {
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
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.resetUsersPassword = async (req, res) => {
  try {
    if (req.body.password.trim() === "") {
      return res.json({
        success: false,
        message: "Please fill up the form",
      });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (user.role === "admin") {
      return res.status(400).json({
        message: "bad request",
      });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password Changed",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.myProfile = async (req, res) => {
  try {
    const profile = await User.findById(req.headers.authData.id).select(
      "-password"
    );
    res.json({
      success: true,
      profile,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports.resetAdminPassword = async (req, res) => {
  try {
    const { currentPassword, password } = req.body;
    const profile = await User.findById(req.headers.authData.id);
    const match = await bcrypt.compare(currentPassword, profile.password);
    if (match) {
      const hashedPassword = await bcrypt.hash(password, 10);
      profile.password = hashedPassword;
      await profile.save();
      res.json({
        success: true,
        message: "password changed",
      });
    } else {
      res.status(401).json({
        message: "incorrect password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};
