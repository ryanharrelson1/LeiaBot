import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import bcrypt from "bcrypt";
import GenToken from "../utils/GenToken.js";

export const Login = async (req, res) => {
  const { Username, Password } = req.body;

  try {
    const user = await Admin.findOne({ Username });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const ismatch = await bcrypt.compare(Password, user.Password || "");

    if (!user || !ismatch) {
      return res.status(401).json({ message: "Invalid password or username" });
    }

    if (user.isTempPassword) {
      return res.status(200).json({
        userId: user._id, // Send the userId for password change
      });
    }

    GenToken(user.UserDiscordId, res);

    res.status(200).json({
      username: user.Username,
      DiscordID: user.UserDiscordId,
    });
  } catch (error) {
    console.error("server error in verifying data", error);
    res.status(500).json({ message: "server error" });
  }
};

export const Logout = async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 });

    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ error: "error in loging out user" });
  }
};

export const SessionValid = async (req, res) => {
  res.status(200).json({ message: "." });
};

export const ChangePassword = async (req, res) => {
  const { id, newPassword } = req.body;
  console.log(id);
  try {
    const user = await Admin.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and set isTempPassword to false
    user.Password = hashedPassword;
    user.isTempPassword = false;
    await user.save();

    // Now that the password is changed, generate the token
    GenToken(user.UserDiscordId, res);

    return res.status(200).json({
      message: "Password changed successfully",
      username: user.Username,
      DiscordID: user.UserDiscordId,
    });
  } catch (error) {
    console.error("Server error during password change", error);
    return res.status(500).json({ message: "Server error" });
  }
};
