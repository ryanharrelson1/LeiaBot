import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import bcrypt from "bcrypt";

export const Login = async (req, res) => {
  const { Username, Password } = req.body;
  console.log(Password);
  try {
    const user = await Admin.findOne({ Username });
    console.log(user);

    const ismatch = await bcrypt.compare(Password, user.Password);

    if (!user || !ismatch) {
      return res.status(401).json({ message: "Invalid password or username" });
    }

    res.status(200).json({
      user: user.Username,
      DiscordID: user.UserDiscordId,
    });
  } catch (error) {
    console.error("server error in verifying data", error);
    res.status(500).json({ message: "server error" });
  }
};
