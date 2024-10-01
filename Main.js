const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  Collection,
} = require("discord.js");
const { handleMessage } = require("./SpamHandeler.js");
const { InviteMon } = require("./ServerInviteMon.js");
const express = require("express");
const { handleAnnounceCommand } = require("./annoucmentHandeler.js");
const { handleInteraction } = require("./ReportSystem.js");
const ConnectDb = require("./mongoDb/mongoDb.js");
const { setBirthday, CheckBirhtday } = require("./bdayHandeler.js");
const {
  XPandLevelingManager,
  Handelprestige,
  HandelRankCheck,
  HandelLeaderBoard,
} = require("./LevelingManager.js");
require("dotenv").config();
const registerCommands = require("./RegisterCommands.js");

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

const LOG_CHANNEL_ID = "1279637632653070427";
const SPAM_LIMIT = 4;
const TIME_WINDOW = 3000; // 3 seconds
const TIMEOUT_DURATION = 60 * 1000; // 1 minute
const Client_ID = "1279621099193368699";
const Guild_ID = "782864366763900948";
const BirthDayRole = "1286431218614796359";
const generalChannelId = "944716095531671552";
const Xp_Per_Message = 10;
const Super_Froggies_Role_ID = "1288632533717880832";
const Master_Froggie_Role_ID = "1288633108312096890";
const Froggie_Role_ID = "782900478265524245";
const Mod_Role_ID = "1050627718389182555";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  CheckBirhtday(client, Guild_ID, BirthDayRole, generalChannelId);
});

registerCommands(Client_ID, Guild_ID);

client.login(Token);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "announce":
      await handleAnnounceCommand(interaction, Mod_Role_ID, generalChannelId);
      break;

    case "setbirthday":
      await setBirthday(interaction, generalChannelId);
      break;

    case "report":
      await handleInteraction(interaction, Mod_Role_ID);
      break;

    case "closereport":
      await handleInteraction(interaction, Mod_Role_ID);

    default:
      break;
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  await handleMessage(
    message,
    LOG_CHANNEL_ID,
    SPAM_LIMIT,
    TIME_WINDOW,
    TIMEOUT_DURATION
  );

  if (message.content.startsWith("!rank")) {
    await HandelRankCheck(message);
  } else if (message.content.startsWith("!leaderboard")) {
    await HandelLeaderBoard(message, client);
  } else if (message.content.startsWith("!prestige")) {
    const MasterFroggies = Master_Froggie_Role_ID;
    const SUperFroggie = Super_Froggies_Role_ID;
    const Froggie = Froggie_Role_ID;

    await Handelprestige(message, MasterFroggies, SUperFroggie, Froggie);
  } else {
    const xpGain = Xp_Per_Message;
    const Xp_CoolDown = 60000;

    await XPandLevelingManager(message, xpGain, Xp_CoolDown);
  }

  await InviteMon(message, LOG_CHANNEL_ID);
});

CheckBirhtday(client, Guild_ID, BirthDayRole, generalChannelId);

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
