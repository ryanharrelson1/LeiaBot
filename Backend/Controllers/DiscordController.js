import axios from "axios";
import crypto from "crypto";
import Admin from "../../mongoDb/MongoModel/AdminModel.js";
import bcrypt from "bcrypt";
import { ChannelType } from "discord.js"; // Discord v14
import ServerConfig from "../../mongoDb/MongoModel/ServerConfigModel.js";

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
    const guildId = process.env.Guild_ID;
    const guild = await client.guilds.fetch(guildId);

    const textChannel = guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildText) // For v14+
      .map((channel) => ({ id: channel.id, name: channel.name }));

    const roles = guild.roles.cache.map((role) => ({
      id: role.id,
      name: role.name,
    }));

    res.status(200).json({
      textChannel,
      roles,
    });
  } catch (error) {
    console.error("error fetching Discord data", error);
    res.status(500).json({
      error: "there was a server error in fetching the roles and channels.",
    });
  }
};

export const UpdateConfigFile = async (req, res) => {
  const GUILD_ID = "782864366763900948"; // Set your guild ID

  try {
    const { updates } = req.body; // Destructure updates from the request body
    console.log("Received updates:", updates);

    // Validate updates
    if (!updates || typeof updates !== "object") {
      return res
        .status(400)
        .json({ message: "Updates must be a non-null object." });
    }

    const config = await ServerConfig.findOne({ guildid: GUILD_ID });

    if (!config) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    // Update only the provided fields
    Object.keys(updates).forEach((key) => {
      if (config[key] !== undefined) {
        // Only update if the key exists
        config[key] = updates[key];
      }
    });

    await config.save(); // Save the updated configuration
    return res
      .status(200)
      .json({ message: "Configuration updated successfully" });
  } catch (error) {
    console.error("Error updating server configuration:", error);
    return res
      .status(500)
      .json({ message: "Error updating configuration", error: error.message });
  }
};