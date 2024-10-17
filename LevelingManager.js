import User from "./mongoDb/MongoModel/chatuserModel.js";

const xpCooldowns = new Map();

function getNextLevelXP(level) {
  return 100 * level ** 2;
}

export async function XPandLevelingManager(message, xpGain, Xp_CoolDown) {
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

  // Apply the XP gain.
  let newXP = user.xp + xpGain;
  let newLevel = user.level;

  // Check if user leveled up
  if (newXP >= getNextLevelXP(newLevel)) {
    newLevel++;
    newXP -= getNextLevelXP(newLevel);
    user.FroggieBalance += 1;

    // Announce level up and Froggie rewards
    message.channel.send(
      `🎉 Congrats ${message.author.username}! You leveled up to level ${newLevel} And Earned one Frog you now Own ${user.FroggieBalance} Froggies. 🐸`
    );
  }

  // Update user XP and level
  user.xp = newXP;
  user.level = newLevel;
  await user.save();
}

export async function Handelprestige(
  message,
  Master_Froggie_Role_ID,
  Super_Froggies_Role_ID,
  Froggie_Role_ID
) {
  const userId = message.author.id;
  const guild = message.guild;
  const member = guild.members.cache.get(userId);

  const user = await User.findOne({ userID: userId });

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

export async function HandelRankCheck(message) {
  const userId = message.author.id;

  const user = await User.findOne({ userID: userId });

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

export async function HandelLeaderBoard(message, client) {
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
      leaderboard += `${i + 1}. ${discordUser.username} - Prestige Master 🏆\n`;
    } else {
      leaderboard += `${i + 1}. ${discordUser.username} - Level ${
        user.level
      }, ${user.xp} XP, Prestiges: ${user.prestigeCount}\n`;
    }
  }

  message.channel.send(leaderboard);
}
