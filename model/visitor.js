const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },
  enteredBy: { type: mongoose.Types.ObjectId, ref: "User" },
  enteredAt: { type: Date, default: Date.now },
  address: { type: String, reequired: true },
  age: { type: Number, required: true },
  occupation: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Rather Not Say"] },
  documentType: {
    type: String,
    enum: ["citizenship", "liscence", "passport"],
  },
  document: { type: String },
  entries: [
    {
      time: { type: Date, default: Date.now },
      checkoutTime: { type: Date, default: null },
      by: { type: mongoose.Types.ObjectId, ref: "User" },
      room: { type: Number, required: true },
      lastVisitedAddress: { type: String },
      nextDestination: { type: String },
      purposeOfVisit: { type: String },
      vechileNumber: { type: Number },
      companion: [
        {
          fullname: { type: String, required: true },
          relation: { type: String, required: true },
          age: { type: Number, required: true },
        },
      ],
      remarks: { type: String },
    },
  ],
});

module.exports = mongoose.model("Visitor", visitorSchema);
