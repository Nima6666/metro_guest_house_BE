const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: "staff", enum: ["staff", "admin"] },
  imageURL: { type: String },
  createdUserTimestamp: { type: Date, default: Date.now, required: true },
});

module.exports = mongoose.model("User", userSchema);
