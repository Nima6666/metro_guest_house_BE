const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, default: "some1@earth.com" },
  phone: { type: String, required: true },
  enteredBy: { type: mongoose.Types.ObjectId, ref: "User" },
  enteredAt: { type: Date, default: Date.now },
  address: { type: String, reequired: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  gender: { type: String, required: true },
  documentType: {
    type: String,
    enum: ["citizenship", "liscence", "passport"],
  },
  documentLocation: { type: String },
  documentId: { type: String, required: true },
  entries: [
    {
      time: { type: Date, required: true },
      checkoutTime: { type: Date, default: null },
      checkoutBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
      by: { type: mongoose.Types.ObjectId, ref: "User", required: true },
      room: { type: String, required: true },
      lastVisitedAddress: { type: String },
      nextDestination: { type: String },
      purposeOfVisit: { type: String },
      vechileNumber: { type: String },
      companion: [
        {
          fullname: { type: String, required: true },
          relation: { type: String, required: true },
          phone: { type: Number, required: true },
          age: { type: Number, required: true },
        },
      ],
      remarks: { type: String },
      edited: { type: Boolean, default: false },
      editedTimeStamp: { type: Date },
    },
  ],
});

module.exports = mongoose.model("Visitor", visitorSchema);
