const mongoose = require("mongoose");

const visitorSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },
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
