const mongoose = require("mongoose");

const birthdaySchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  birthday: { type: String, required: true },
});

const Bday = mongoose.model("Bday", birthdaySchema);

export default Bday;
