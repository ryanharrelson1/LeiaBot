const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");
const { handleMessage } = require("./SpamHandeler.js");
const { InviteMon } = require("./ServerInviteMon.js");
const express = require("express");

require("dotenv").config();

const app = express();

const port = process.env.Port || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // Ensure this intent is enabled for timeouts
  ],
});
const Token = process.env.Discord_Token;

const LOG_CHANNEL_ID = "1279637632653070427"; // Your log channel ID
const SPAM_LIMIT = 4;
const TIME_WINDOW = 3000; // 3 seconds
const TIMEOUT_DURATION = 60 * 1000; // 1 minute
const Client_ID = "1279621099193368699";
const Guild_ID = "782864366763900948";

const ANNounce_CHannel_ID = "1279677755922976890";

const Genral_CHannel_ID = "944716095531671552";

const commands = [
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("create an annoucement")
    .addStringOption((options) =>
      options
        .setName("message")
        .setDescription("announcment message")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(Token);

(async () => {
  try {
    console.log("start init app slash commands");

    await rest.put(Routes.applicationGuildCommands(Client_ID, Guild_ID), {
      body: commands,
    });

    console.log("success");
  } catch (error) {
    console.error(error);
  }
})();

const INVITE_REGEX =
  /https?:\/\/(www\.)?discord(?:app\.com\/invite|\.gg)\/\w+/i;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(Token);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "announce") {
    const announcementMessage = interaction.options.getString("message");
    const generalChannel =
      interaction.guild.channels.cache.get(Genral_CHannel_ID);

    if (generalChannel) {
      try {
        await generalChannel.send(`@everyone\n\n${announcementMessage}`);
        await interaction.reply({
          content: "Announcement sent!",
          ephemeral: true,
        });
      } catch (error) {
        console.error(`Failed to send announcement: ${error.message}`);
        await interaction.reply({
          content: "Failed to send announcement.",
          ephemeral: true,
        });
      }
    } else {
      console.error(`General channel with ID ${Genral_CHannel_ID} not found.`);
      await interaction.reply({
        content: "General channel not found.",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  await InviteMon(message, INVITE_REGEX, LOG_CHANNEL_ID); // Pass the constants to the function
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  await handleMessage(
    message,
    LOG_CHANNEL_ID,
    SPAM_LIMIT,
    TIME_WINDOW,
    TIMEOUT_DURATION
  );
});

app.get("/", (req, res) => {
  res.send("bot is running");
});

app.listen(port, () => {
  console.log(`fuck you htttp request on port ${port}`);
});
