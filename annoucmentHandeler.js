const Genral_CHannel_ID = "1279629109231747125";

const ANNounce_CHannel_ID = "1279677755922976890";

const handleAnnounceCommand = async (interaction) => {
  const announcementMessage = interaction.options.getString("message");
  const generalChannel =
    interaction.guild.channels.cache.get(Genral_CHannel_ID);

  if (generalChannel) {
    try {
      await generalChannel.send(`@everyone\n\n${announcementMessage}`);
      await interaction.reply({
        content: "Announcement sent!",
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Failed to send announcement: ${error.message}`);
      await interaction.reply({
        content: "Failed to send announcement.",
        ephemeral: true,
      });
    }
  } else {
    console.error(`General channel with ID ${Genral_CHannel_ID} not found.`);
    await interaction.reply({
      content: "General channel not found.",
      ephemeral: true,
    });
  }
};

module.exports = { handleAnnounceCommand };
