export const handleAnnounceCommand = async (
  interaction,
  Mod_Role_ID,
  Genral_CHannel_ID
) => {
  const announcementMessage = interaction.options.getString("message");
  const generalChannel =
    interaction.guild.channels.cache.get(Genral_CHannel_ID);
  const modRole = interaction.member.roles.cache;

  if (!modRole.has(Mod_Role_ID)) {
    return interaction.reply({
      content: "you dont have access to use this command.",
      ephemeral: true,
    });
  }

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
