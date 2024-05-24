const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },
  enteredBy: { type: mongoose.Types.ObjectId, ref: "User" },
  enteredAt: { type: Date, default: Date.now },
  documentType: {
    type: String,
    default: "citizenship",
    enum: ["citizenship", "liscence", "passport"],
  },
  document: { type: String },
  entries: [
    {
      time: { type: Date, default: Date.now },
      by: { type: mongoose.Types.ObjectId, ref: "User" },
      companion: {
        type: [String],
        validate: {
          validator: function (v) {
            return v.length <= 3;
          },
          message: (props) => `${props.path} exceeds the limit of 3`,
        },
      },
    },
  ],
});

module.exports = mongoose.model("Visitor", visitorSchema);
