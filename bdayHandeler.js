const Birthday = require("./mongoDb/MongoModel/bdayModel.js");

async function setBirthday(interaction) {
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

async function CheckBirhtday(
  client,
  Guild_ID,
  birthdayRole,
  General_Channel_ID
) {
  const today = new Date().toLocaleString("en-CA", {
    month: "2-digit",
    day: "2-digit",
  });

  try {
    const usersWithBirthdayToday = await Birthday.find({ birthday: today });

    const guild = await client.guilds.cache.get(Guild_ID); // Retrieve the guild

    if (!guild) {
      console.error(`Guild with ID ${Guild_ID} not found.`);
      return; // Exit if the guild is not found
    }

    usersWithBirthdayToday.forEach(async (user) => {
      try {
        const member = await guild.members.fetch(user.userId); // Fetch member

        if (member) {
          if (birthdayRole) {
            await member.roles.add(birthdayRole); // Add birthday role
            const generalChannel = guild.channels.cache.get(General_Channel_ID); // Get channel

            if (generalChannel) {
              generalChannel.send(
                `Happy Birthday <@${user.userId}>! Enjoy Your special Birthday role!`
              );
            } else {
              console.error(`Channel with ID ${General_Channel_ID} not found.`);
            }

            // Remove the role after 24 hours
            setTimeout(() => {
              member.roles
                .remove(birthdayRole)
                .catch((err) => console.error(`Failed to remove role: ${err}`));
            }, 86400000);
          }
        } else {
          console.error(`Member with ID ${user.userId} not found.`);
        }
      } catch (err) {
        console.error(`Error fetching member: ${err.message}`);
      }
    });
  } catch (error) {
    console.error("Error in checking birthdays", error);
  }

  // Schedule the next check for the next day (24 hours)
  setTimeout(
    () => CheckBirhtday(client, Guild_ID, birthdayRole, General_Channel_ID),
    86400000
  );
}

module.exports = { setBirthday, CheckBirhtday };
