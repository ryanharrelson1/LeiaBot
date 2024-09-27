const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  prestigeCount: { type: Number, default: 0 },
  FroggieBalance: { type: Number, default: 0 },
  isPrestigeMaster: { type: Boolean, default: false },

  activeXPBoost: {
    multiplier: { type: Number, default: 1 }, // XP multiplier (e.g., 2 for double XP)
    expiry: { type: Date, default: null }, // Expiry date for the boost
  },
});

module.exports = mongoose.model("User", UserSchema);
