const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },
  documentType: {
    type: String,
    default: "citizenship",
    enum: ["citizenhip", "drvliscence", "passport"],
  },
  document: { type: String, required: true },
  companion: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: (props) => `${props.path} exceeds the limit of 3`,
    },
  },
});

module.exports = mongoose.model("Visitor", visitorSchema);
