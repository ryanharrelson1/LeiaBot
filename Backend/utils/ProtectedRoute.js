import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import Jwt from "jsonwebtoken";

export const ProtectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.key;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access denied" }); // Correctly use return
    }

    let decoded;
    try {
      decoded = Jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid Token Access denied" }); // Correctly use return
    }

    // Make sure to use the correct field name
    const user = await Admin.findOne({ DiscordID: decoded.DiscordID }).select(
      "-Password"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" }); // Correctly use return
    }

    req.DiscordID = user; // Attach user information to the request object
    return next(); // Correctly use return here to prevent further execution
  } catch (error) {
    console.error("Error in ProtectedRoute middleware:", error);
    return res.status(500).json({ error: "Server error in protected route" }); // Correctly use return
  }
};
