const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  religion: { type: String },
  enteredBy: { type: mongoose.Types.ObjectId, ref: "User" },
  enteredAt: { type: Date, default: Date.now },
  address: { type: String, required: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  gender: { type: String, required: true },
  documentType: {
    type: String,
    // required: true,
  },
  documentLocation: {
    type: String,
    // required: function () {
    //   return !!this.documentType;
    // },
  },
  documentId: {
    type: String,
    required: function () {
      return !!this.documentType;
    },
  },
  entries: [
    {
      time: { type: Date, required: true },
      checkoutTime: { type: Date, default: null },
      checkoutBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
      by: { type: mongoose.Types.ObjectId, ref: "User" },
      room: { type: String, required: true },
      lastVisitedAddress: { type: String, required: true },
      nextDestination: { type: String, required: true },
      purposeOfVisit: { type: String, required: true },
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
