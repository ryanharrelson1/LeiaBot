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
const BanCommand = require("./BanCommand.js");
const ConnectDb = require("./mongoDb/mongoDb.js");
const Birthday = require("./mongoDb/MongoModel/bdayModel.js");
const { setBirthday, CheckBirhtday } = require("./bdayHandeler.js");

const Users = require("./mongoDb/MongoModel/chatuserModel.js");

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
const Xp_Per_Message = 10;
const Xp_CoolDown = 60 * 1000;
const xpCooldowns = new Collection();
const Super_Froggies_Role_ID = "1288632533717880832";
const Master_Froggie_Role_ID = "1288633108312096890";
const Froggie_Role_ID = "782900478265524245";

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
  CheckBirhtday(client, Guild_ID);
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
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  await handleMessage(
    message,
    LOG_CHANNEL_ID, // This should be first (logChannelId)
    SPAM_LIMIT, // spamLimit
    TIME_WINDOW, // timeWindow
    TIMEOUT_DURATION // timeoutDuration
  );
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "setbirthday") {
    await setBirthday(interaction, Guild_ID, generalChannelId, BirthDayRole);
  }
});

CheckBirhtday(client, Guild_ID);

function getNextLevelXP(level) {
  return 100 * level ** 2;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;

  const now = Date.now();
  if (xpCooldowns.has(userId) && now - xpCooldowns.get(userId) < Xp_CoolDown) {
    return;
  }

  xpCooldowns.set(userId, now);

  // Find or create user
  let user = await Users.findOneAndUpdate(
    { userID: userId },
    { $setOnInsert: { xp: 0, level: 1 } },
    { new: true, upsert: true }
  );

  // Default XP per message
  let xpGain = Xp_Per_Message;

  // Apply XP boost if active
  if (user.activeXPBoost && now < user.activeXPBoost.expiry) {
    xpGain *= user.activeXPBoost.multiplier; // Apply XP multiplier boost
  } else if (user.activeXPBoost && now >= user.activeXPBoost.expiry) {
    user.activeXPBoost = null; // Remove boost if expired
    await user.save();
  }

  // Apply the XP gain (use xpGain with multiplier)
  let newXP = user.xp + xpGain;
  let newLevel = user.level;

  // Check if user leveled up
  if (newXP >= getNextLevelXP(newLevel)) {
    newLevel++;
    newXP = 0;

    // Calculate Froggie reward
    const FroggieRewards = Math.floor(0.1 * getNextLevelXP(newLevel - 1));
    user.FroggieBalance = (user.FroggieBalance || 0) + FroggieRewards;

    // Announce level up and Froggie rewards
    message.channel.send(
      `🎉 Congrats ${message.author.username}! You leveled up to level ${newLevel} and earned ${FroggieRewards} Froggies! 🐸`
    );
  }

  // Update user XP and level
  user.xp = newXP;
  user.level = newLevel;
  await user.save();
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!rank")) {
    const userId = message.author.id;

    const user = await Users.findOne({ userID: userId });

    if (!user) {
      return message.channel.send("you have not earned any XP yet");
    }

    if (user.isPrestigeMaster) {
      message.channel.send(
        `${message.author.username}, you are a **Prestige Master**! 🏆 and have ${user.FroggieBalance} Froggies`
      );
    } else {
      message.channel.send(
        `${message.author.username}, you are level ${user.level} with ${user.xp} XP. Total Prestiges: ${user.prestigeCount} with ${user.FroggieBalance} Froggies.`
      );
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!leaderboard")) {
    // Fetch all users and sort them
    const allUsers = await Users.find();

    // Sort by isPrestigeMaster first, then prestigeCount, then level, and finally XP
    const sortedUsers = allUsers.sort((a, b) => {
      if (a.isPrestigeMaster && !b.isPrestigeMaster) return -1; // Prestige Masters first
      if (!a.isPrestigeMaster && b.isPrestigeMaster) return 1;
      if (a.prestigeCount !== b.prestigeCount)
        return b.prestigeCount - a.prestigeCount; // Then by prestige count
      if (a.level !== b.level) return b.level - a.level; // Then by level
      return b.xp - a.xp; // Finally by XP
    });

    // Generate leaderboard string
    let leaderboard = "🏆 **Leaderboard** 🏆\n";
    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];
      const discordUser = await client.users.fetch(user.userID);

      if (user.isPrestigeMaster) {
        leaderboard += `${i + 1}. ${
          discordUser.username
        } - Prestige Master 🏆\n`;
      } else {
        leaderboard += `${i + 1}. ${discordUser.username} - Level ${
          user.level
        }, ${user.xp} XP, Prestiges: ${user.prestigeCount}\n`;
      }
    }

    message.channel.send(leaderboard);
  }
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!prestige")) {
    const userId = message.author.id;
    const guild = message.guild;
    const member = guild.members.cache.get(userId);

    const user = await Users.findOne({ userID: userId });

    if (!user) {
      return message.channel.send("You haven't earned any XP yet.");
    }
    if (user.level < 10) {
      return message.channel.send("you have to reach level 10 to prestige.");
    }

    user.level = 1;
    user.xp = 0;
    user.prestigeCount++;

    if (user.prestigeCount >= 10) {
      user.isPrestigeMaster = true;
      if (!member.roles.cache.has(Master_Froggie_Role_ID)) {
        await member.roles.add(Master_Froggie_Role_ID);
        await message.channel.send(
          `${message.author.username}, has became a Master Froggie  🐸`
        );
      }
      if (member.roles.cache.has(Super_Froggies_Role_ID)) {
        await member.roles.remove(Super_Froggies_Role_ID);
      }
    } else if (user.prestigeCount >= 5) {
      if (!member.roles.cache.has(Super_Froggies_Role_ID)) {
        await member.roles.add(Super_Froggies_Role_ID);
        await message.channel.send(
          `${message.author.username}, has became a **Super Froggie**! 🐸`
        );
      }
      if (member.roles.cache.has(Froggie_Role_ID)) {
        await member.roles.remove(Froggie_Role_ID);
      }
    }
    await user.save();
    if (user.isPrestigeMaster) {
      message.channel.send(
        `${message.author.username} has reached Prestige Master! 🏆`
      );
    } else {
      message.channel.send(
        `${message.author.username} has prestiged! You are now level ${user.level} with ${user.xp} XP. Total Prestiges: ${user.prestigeCount}.`
      );
    }
  }
});

const shopItem = [
  {
    name: "Double XP (10 mins)",
    type: "XpBoost",
    multiplier: 2,
    duration: 10 * 60 * 1000,
    price: 100,
  },
  {
    name: "Double XP (30 mins)",
    type: "XpBoost",
    multiplier: 2,
    duration: 30 * 60 * 1000,
    price: 300,
  },
  {
    name: "Triple XP (30 mins)",
    type: "XpBoost",
    multiplier: 3,
    duration: 30 * 60 * 1000,
    price: 500,
  },
];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Split message content by spaces, not empty string
  const args = message.content.split(" ");
  const command = args[0].toLowerCase();

  if (command === "!buy") {
    const itemName = args.slice(1).join(" ");
    const item = shopItem.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!item) {
      return message.channel.send(
        `${message.author.username}, the item "${itemName}" does not exist in the shop.`
      );
    }

    const userId = message.author.id;
    let user = await Users.findOne({ userID: userId });

    // Check if user exists and has enough balance
    if (!user || user.FroggieBalance < item.price) {
      return message.channel.send(
        `You do not have enough Froggies to buy the item "${item.name}".`
      );
    }

    // Deduct item price from the user's balance
    user.FroggieBalance -= item.price;

    // If it's an XP boost, activate the boost with duration and multiplier
    if (item.type === "XpBoost") {
      const boostExpire = Date.now() + item.duration;
      user.activeXPBoost = {
        multiplier: item.multiplier,
        expiry: boostExpire,
      };

      await user.save(); // Save user with updated XP boost info

      message.channel.send(
        `${message.author.username}, your ${
          item.name
        } has been activated and will expire in ${
          item.duration / 1000 / 60
        } minutes.`
      );
    } else {
      await user.save(); // Just save user if it's not an XP boost
    }
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
