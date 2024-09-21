const mongoose = require("mongoose");

const birthdaySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  birthday: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Birthday", birthdaySchema);
