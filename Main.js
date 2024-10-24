import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./SpamHandeler.js";
import { InviteMon } from "./ServerInviteMon.js";
import express from "express";
import { handleAnnounceCommand } from "./annoucmentHandeler.js";
import { handleInteraction } from "./ReportSystem.js";
import ConnectDb from "./mongoDb/mongoDb.js";
import { setBirthday, CheckBirhtday } from "./bdayHandeler.js";
import {
  XPandLevelingManager,
  Handelprestige,
  HandelRankCheck,
  HandelLeaderBoard,
} from "./LevelingManager.js";
import dotenv from "dotenv";

import Discord from "./Backend/routes/DiscordRoute.js";
import Admins from "./Backend/routes/AdminRoutes.js";
import cors from "cors";
import { OnBotJoin } from "./BotConfigHandler.js";
import cookieParser from "cookie-parser";
import getServerConfig from "./configService.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data (form data)
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000", // frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers)
};
app.use(cors(corsOptions));

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

const TIME_WINDOW = 3000; // 3 seconds
const Froggie_Role_ID = "782900478265524245";
const Mod_Role_ID = "1050627718389182555";

let serverConfig; // Variable to store the server configuration

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const guildId = "782864366763900948"; // Replace with the appropriate guild ID
  serverConfig = await getServerConfig(guildId); // Fetch server configuration

  if (serverConfig) {
    // Call any other startup functions you need, e.g. CheckBirthdays
    CheckBirhtday(
      client,
      serverConfig.guildid,
      serverConfig.bdayrole,
      serverConfig.generalChannelId
    );
  } else {
    console.error("Failed to load server configuration.");
  }
});

client.login(Token);

app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
app.use((req, res, next) => {
  req.DiscordClient = client;
  next();
});

app.use("/auth", Discord);
app.use("/admin", Admins);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "announce":
      await handleAnnounceCommand(
        interaction,
        Mod_Role_ID,
        serverConfig.annoucmentchannel
      );
      break;

    case "setbirthday":
      await setBirthday(interaction, serverConfig.annoucmentchannel);
      break;

    case "report":
      await handleInteraction(
        interaction,
        Mod_Role_ID,
        serverConfig.reportchannel
      );
      break;

    case "closereport":
      await handleInteraction(interaction, Mod_Role_ID);

    default:
      break;
  }
});
client.on("guildCreate", async (guild) => {
  console.log(`Joined a new guild: ${guild.name}`);
  await OnBotJoin(guild);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  await handleMessage(
    message,
    serverConfig.spamlog,
    serverConfig.maxspam,
    TIME_WINDOW,
    serverConfig.timedurt
  );

  if (message.content.startsWith("!rank")) {
    await HandelRankCheck(message);
  } else if (message.content.startsWith("!leaderboard")) {
    await HandelLeaderBoard(message, client);
  } else if (message.content.startsWith("!prestige")) {
    const MasterFroggies = serverConfig.masterprestigerole;
    const SUperFroggie = serverConfig.midprestigerole;
    const Froggie = Froggie_Role_ID;

    await Handelprestige(message, MasterFroggies, SUperFroggie, Froggie);
  } else {
    const xpGain = serverConfig.xppermessage;
    const Xp_CoolDown = 60000;

    await XPandLevelingManager(message, xpGain, Xp_CoolDown);
  }

  await InviteMon(message, serverConfig.monlog);
});

//CheckBirhtday(client, serverConfig.guildid, BirthDayRole, generalChannelId);
