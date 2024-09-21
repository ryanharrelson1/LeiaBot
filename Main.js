const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
} = require("discord.js");
const { handleMessage } = require("./SpamHandeler.js");
const { InviteMon } = require("./ServerInviteMon.js");
const express = require("express");

const { handleAnnounceCommand } = require("./annoucmentHandeler.js");
const { handleInteraction } = require("./ReportSystem.js");
const BanCommand = require("./BanCommand.js");
const ConnectDb = require("./mongoDb/mongoDb.js");
const Birthday = require("./mongoDb/MongoModel/bdayModel.js");

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
const BirthDayRole = "1286431218614796359";
const generalChannelId = "944716095531671552";

const commands = [
  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user for inappropiate behavior")
    .addUserOption((options) =>
      options
        .setName("user")
        .setDescription("the user you want to report")
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName("reason")
        .setDescription("the reason for reporting this user")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("closereport")
    .setDescription("close a report by ID")
    .addIntegerOption((option) =>
      option
        .setName("report_id")
        .setDescription("the id of the report to close")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("create an annoucement")
    .addStringOption((options) =>
      options
        .setName("message")
        .setDescription("announcment message")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("ban a user")
    .addUserOption((banop) =>
      banop.setName("user").setDescription("user to ban").setRequired(true)
    )
    .addStringOption((banop) =>
      banop
        .setName("reason")
        .setDescription("reason for the ban ")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("setbirthday")
    .setDescription("set your birthday (MM-DD format")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("enter your birhtday in MM-DD format")
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

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  CheckBirhtday();
});

client.login(Token);

const Mod_Role_ID = "1050627718389182555";

const INVITE_REGEX =
  /https?:\/\/(www\.)?discord(?:app\.com\/invite|\.gg)\/\w+/i;

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ban") {
    await BanCommand(interaction, Mod_Role_ID, LOG_CHANNEL_ID);
  }
});
client.on(Events.InteractionCreate, handleInteraction, Mod_Role_ID);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "announce") {
    await handleAnnounceCommand(interaction);
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "setbirthday") {
    const birthday = interaction.options.getString("date");
    const userId = interaction.user.id;

    if (!/^\d{2}-\d{2}$/.test(birthday)) {
      return interaction.reply({
        content: "Invalid date format, please try again (MM-DD format).",
        ephemeral: true,
      });
    }

    try {
      await Birthday.findOneAndUpdate(
        { userId: userId },
        { birthday: birthday },
        { upsert: true }
      );
      interaction.reply({
        content: `Your birthday has been set to ${birthday}`,
        ephemeral: true,
      });
    } catch (error) {
      console.log("Error in saving your birthday", error);
      interaction.reply({
        content: "There was an error saving your birthday.",
        ephemeral: true,
      });
    }
  }
});

// Move the CheckBirhtday function outside the event handler
async function CheckBirhtday() {
  const today = new Date().toLocaleString("en-CA", {
    month: "2-digit",
    day: "2-digit",
  });

  try {
    const usersWithBirthdayToday = await Birthday.find({ birthday: today });

    const guild = client.guilds.cache.get(Guild_ID);

    usersWithBirthdayToday.forEach(async (user) => {
      member = await guild.members.fetch(user.userId);

      if (member) {
        const birhtdayRole = guild.roles.cache.get(BirthDayRole);
        if (birhtdayRole) {
          await member.roles.add(BirthDayRole);
          const generalChannel = guild.channels.cache.get(generalChannelId);
          generalChannel.send(
            `Happy Birthday <@${user.userId}>! Enjoy Your special Birthday role!`
          );
          setTimeout(() => {
            member.roles.remove(birhtdayRole);
          }, 86400000); // Remove the role after 24 hours
        }
      }
    });
  } catch (error) {
    console.error("Error in checking birthdays", error);
  }
  setTimeout(CheckBirhtday, 86400000); // Schedule the next check for the next day
}

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
