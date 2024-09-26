const Birthday = require("./mongoDb/MongoModel/bdayModel.js");

async function setBirthday(
  interaction,
  Guild_ID,
  generalChannel,
  birhtdayRole
) {
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

async function CheckBirhtday(client, Guild_ID) {
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

module.exports = { setBirthday, CheckBirhtday };
