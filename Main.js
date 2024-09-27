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
  // role expire check
  if (user.purchasedRole && now >= user.purchasedRole.expiry) {
    const role = message.guild.roles.cache.get(user.purchasedRole.roleID);
    const guildMember = message.guild.members.cache.get(userId);

    if (role && guildMember) {
      await guildMember.roles.remove(role);
    }

    user.purchasedRole = null;
    await user.save();
  }

  // Default XP per message
  let xpGain = Xp_Per_Message;

  // Apply the XP gain (use xpGain with multiplier)
  let newXP = xpGain;
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

const shopRoles = [
  {
    name: "Pink-Color", // Role name
    roleID: "1289272630050033704",
    price: 300, // Froggie price
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  },
  {
    name: "Gold_color",
    roleID: "1289272493571444756",
    price: 500,
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
  {
    name: "Purple-Color",
    roleID: "1289272348910026803",
    price: 1000,
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
];
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Split message content by spaces to extract command and arguments
  const args = message.content.split(" ");
  const command = args[0].toLowerCase();

  if (command === "!buy") {
    const roleName = args.slice(1).join(" ");
    const roleToBuy = shopRoles.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );

    if (!roleToBuy) {
      return message.channel.send(
        `${message.author.username}, the role "${roleName}" does not exist in the shop.`
      );
    }

    const userId = message.author.id;
    let user = await Users.findOne({ userID: userId });

    // Check if user exists and has enough Froggie balance to purchase the role
    if (!user || user.FroggieBalance < roleToBuy.price) {
      return message.channel.send(
        `You do not have enough Froggies to buy the role "${roleToBuy.name}".`
      );
    }

    // Deduct Froggie balance from the user's account
    user.FroggieBalance -= roleToBuy.price;

    // Calculate role expiration time (duration is in milliseconds)
    const roleExpire = Date.now() + roleToBuy.duration;

    // Store the purchased role and its expiration
    user.purchasedRole = {
      roleID: roleToBuy.roleID, // Store the role's ID
      expiry: roleExpire,
    };

    // Find the Discord role by ID and assign it to the user
    const guildMember = message.guild.members.cache.get(message.author.id);
    const role = message.guild.roles.cache.get(roleToBuy.roleID); // Find role by ID

    if (!role) {
      return message.channel.send(
        `The role "${roleToBuy.name}" was not found in the server. Please contact an admin.`
      );
    }

    await guildMember.roles.add(role); // Assign the purchased role to the user
    await user.save(); // Save the user with the updated Froggie balance and purchased role

    // Notify the user of the successful purchase
    message.channel.send(
      `${message.author.username}, you've successfully purchased the ${roleToBuy.name} role for one week!`
    );
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(port, () => {
  ConnectDb();
  console.log(`fuck you htttp request on port ${port}`);
});
