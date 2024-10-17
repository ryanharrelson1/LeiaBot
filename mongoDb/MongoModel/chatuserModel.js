import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  prestigeCount: { type: Number, default: 0 },
  FroggieBalance: { type: Number, default: 0 },
  isPrestigeMaster: { type: Boolean, default: false },
});

const User = new mongoose.model("User", UserSchema);

export default User;
