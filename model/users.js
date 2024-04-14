const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: "staff", enum: ["staff", "admin"] },
  image: { type: String },
});

module.exports = mongoose.model("User", userSchema);
