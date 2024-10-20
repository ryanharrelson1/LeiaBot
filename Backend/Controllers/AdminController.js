import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import bcrypt from "bcrypt";
import GenToken from "../utils/GenToken.js";


export const Login = async (req, res) => {
  const { Username, Password } = req.body;
  
  try {
   const user = await Admin.findOne({Username});
    console.log(user);
    if(!user)
      {
       return res.status(404).json({error:"user not found"})
      }
    

    const ismatch = await bcrypt.compare(Password, user.Password || "");

    if (!user || !ismatch) {
      return res.status(401).json({ message: "Invalid password or username" });
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
