import jwt from "jsonwebtoken";

export const GenToken = (discordid, res) => {
  const token = jwt.sign({ discordid }, process.env.JWT_SECRET, {
    expiresIn: "3h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 3 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "development",
  });
};

export default GenToken;
