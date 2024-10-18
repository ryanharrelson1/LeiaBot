import Admin from "../../mongoDb/MongoModel/AdminModel.js";

import Jwt from "jsonwebtoken";

export const ProtectedRoute = async (req, res, next) => {
  try {
    const token = req.cookie.token;

    if (!token) {
      res.status(401).json({ error: "Unauthorized access denied" });
    }
    let decoded;
    try {
      decoded = Jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid Token Access denied" });
    }
    if (!decoded.DiscordID) {
      return res.status(401).json({ error: "Invalid Token Payload" });
    }

    const user = await Admin.findById(decoded.DiscordID).select("-Password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.DiscordID = user;

    next();
  } catch (error) {
    console.error("Error in ProtectedRoute middleware:", error);
    res.status(500).json({ error: "Server error in protected route" });
  }
};
