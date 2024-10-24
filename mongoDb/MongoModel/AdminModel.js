import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  Username: {
    type: String,
    required: true,
  },

  Password: {
    type: String,
    required: true,
  },

  UserDiscordId: {
    type: String,
    required: true,
  },

  isTempPassword: {
    type: Boolean,
    default: true,
  },
});

const Admin = new mongoose.model("Admin", AdminSchema);

export default Admin;
