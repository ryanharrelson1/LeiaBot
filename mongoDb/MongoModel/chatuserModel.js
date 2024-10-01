const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  prestigeCount: { type: Number, default: 0 },
  FroggieBalance: { type: Number, default: 0 },
  isPrestigeMaster: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);
