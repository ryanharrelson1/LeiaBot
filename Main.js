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
import registerCommands from "./RegisterCommands.js";
import Discord from "./Backend/routes/DiscordRoute.js";
import Admins from "./Backend/routes/AdminRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
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

// to be deleted hardcoded Data not final Production code{--------------------
const LOG_CHANNEL_ID = "1279637632653070427";
const SPAM_LIMIT = 4;
const TIME_WINDOW = 3000; // 3 seconds
const TIMEOUT_DURATION = 60 * 1000; // 1 minute
const Guild_ID = "782864366763900948";
const BirthDayRole = "1286431218614796359";
const generalChannelId = "944716095531671552";
const Xp_Per_Message = 10;
const Super_Froggies_Role_ID = "1288632533717880832";
const Master_Froggie_Role_ID = "1288633108312096890";
const Froggie_Role_ID = "782900478265524245";
const Mod_Role_ID = "1050627718389182555";
//-------------------------------------------------------}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  CheckBirhtday(client, Guild_ID, BirthDayRole, generalChannelId);
});

registerCommands(Guild_ID);

client.login(Token);


app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
app.use((req, res, next) => {
  req.DiscordClient = client;
  next();
})

app.use("/auth", Discord);
app.use("/admin", Admins);

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
