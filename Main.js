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
});

client.login(Token);

const Mod_Role_ID = "1050627718389182555";

const INVITE_REGEX =
  /https?:\/\/(www\.)?discord(?:app\.com\/invite|\.gg)\/\w+/i;

const Appeals_Channel = "1281075552320487505";
const Banned_Role_ID = "1281074822113263647";
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "ban") {
    const modrole = interaction.member.roles.cache;

    if (!modrole.has(Mod_Role_ID)) {
      return interaction.reply({
        content: "You do not have permission to ban users.",
        ephemeral: true,
      });
    }

    const user = options.getUser("user");
    const reason = options.getString("reason");

    // Acknowledge the interaction
    await interaction.deferReply();

    try {
      const member = await interaction.guild.members.fetch(user.id);

      // Remove all roles and assign the banned role
      await member.roles.set([]);
      await member.roles.add(Banned_Role_ID);

      const voiceChannel = member.voice.channel;
      if (voiceChannel) {
        try {
          await voiceChannel.members.forEach(async (voiceMember) => {
            if (voiceMember.id === user.id) {
              await voiceMember.voice.setChannel(null); // Kicks the user from the voice channel
            }
          });
        } catch (error) {
          console.error(
            `Failed to kick ${user.tag} from voice channel:`,
            error
          );
        }
      }

      try {
        await user.send({
          content: `You have been banned from ${interaction.guild.name} for the following reason: ${reason}. If you believe this ban is a mistake, please send a message in the appeals channel to appeal your ban: <#${Appeals_Channel}>.`,
        });
      } catch (error) {
        console.error(`Failed to send DM to ${user.tag}:`, error);
      }

      await interaction.editReply({
        content: `Successfully banned ${user.tag}. They have been notified via DM and can appeal their ban in the appeals channel.`,
        ephemeral: true,
      });

      // Log the ban action to the mod log channel
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        const logMessage = `
        **Action:** Ban
        **User:** ${user.tag} (ID: ${user.id})
        **Banned By:** ${interaction.user.tag} (ID: ${interaction.user.id})
        **Reason:** ${reason}
        **Appeals Channel:** <#${Appeals_Channel}>
        `;
        await logChannel.send(logMessage);
      } else {
        console.error("Log channel not found.");
      }
    } catch (error) {
      console.error(`Failed to ban ${user.tag}:`, error);
      await interaction.editReply({
        content: `Failed to ban ${user.tag}.`,
      });
    }
  }
});

client.on(Events.InteractionCreate, handleInteraction);

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

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  console.log(`fuck you htttp request on port ${port}`);
});
