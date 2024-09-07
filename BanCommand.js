module.exports = async (interaction, Mod_Role_ID) => {
  const modRole = interaction.guild.roles.cache;
  if (!modRole.has(Mod_Role_ID)) {
    return interaction.reply({
      content: "you dont have permisson to ban users",
      ephemeral: true,
    });
  }

  const user = options.getUser("user");
  const reason = options.getString("reason");

  try {
    const member = await interaction.guild.members.fetch(user.id);
    await member.ban({ reason });
    await interaction.reply({ content: `banned ${user.tag} for ${reason}` });
  } catch (error) {
    await interaction.reply({
      content: " could not ban the user ",
      ephemeral: true,
    });
  }
};
