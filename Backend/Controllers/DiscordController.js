import axios from "axios";
import crypto from "crypto";
import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import bcrypt from "bcrypt";

export const DiscordAuth = async (req, res) => {
  const DiscordAuthUrl =
    "https://discord.com/oauth2/authorize?client_id=1279621099193368699&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds+messages.read";
  res.status(200).json({ DiscordAuthUrl });
};

export const DiscordCallback = async (req, res) => {
  try {
    const code = req.query.code;
    console.log(code);

    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.Client_ID,
        client_secret: process.env.Client_Secret,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.Redirect_URI,
      })
    );

    const accessToken = tokenResponse.data.access_token;
    const botToken = process.env.Discord_Token;
    res.redirect("http://localhost:3000/sign-in");
    // Fetch the user's information
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const salt = await bcrypt.genSalt(10);

    const userId = userResponse.data.id;
    const username = userResponse.data.username;

    const tempPassword = crypto.randomBytes(8).toString("hex");

    const hashpassword = await bcrypt.hash(tempPassword, salt);

    await Admin.create({
      Username: username,
      Password: hashpassword,
      UserDiscordId: userId,
    });

    // Create a DM channel with the user
    const dmChannel = await axios.post(
      `https://discord.com/api/v10/users/@me/channels`, // Correct endpoint
      {
        recipient_id: userId, // Include recipient_id in the body directly
      },
      {
        headers: {
          Authorization: `Bot ${botToken}`, // Use the access token correctly
          "Content-Type": "application/json", // Ensure the content type is set
        },
      }
    );
    const channelID = dmChannel.data.id; // Access the id correctly

    // Send a message to the DM channel
    await axios.post(
      `https://discord.com/api/v10/channels/${channelID}/messages`,
      {
        content: `Your temporary Username is **${username}** and your temporary password is **${tempPassword}**.`,
      },
      {
        headers: {
          Authorization: `Bot ${botToken}`, // Include the access token
        },
      }
    );

    res.send("Temporary credentials sent to your DM!");
  } catch (error) {
    console.error("Error in Discord callback:", {
      message: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : "No status",
      config: error.config,
    });
    res.status(500).send("An error occurred while processing your request.");
  }
};

export const GetServerChannelsAndRoles = async (req, res) => {
  try {

    const client = req.DiscordClient;
    
  } catch (error) {
    
  }


}
