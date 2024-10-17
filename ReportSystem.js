const reports = {};

const Report_Channel_ID = "1281039175411433515";

export const handleInteraction = async (interaction, Mod_Role_ID) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "report") {
    const member = options.getUser("user");
    const reason = options.getString("reason");
    const reportChannel =
      interaction.guild.channels.cache.get(Report_Channel_ID);

    if (!reportChannel) return;

    const reportID = Date.now();
    reports[reportID] = {
      reportedUser: member,
      reportedBy: interaction.user,
      reason: reason,
    };

    const reportmessage = `
      ** Report ID:** ${reportID}
      ** Reported User:** ${member.tag} (ID: ${member.id})
      ** Reported By:** ${interaction.user.tag} (ID: ${interaction.user.id})
      ** Reason:** ${reason}`;

    const sentMessage = await reportChannel.send(reportmessage);

    reports[reportID] = {
      reportedUser: member,
      reportedBy: interaction.user,
      reason: reason,
      messageID: sentMessage.id, // Save the message ID
    };

    await interaction.reply({
      content: `Thank you! Your report (ID: ${reportID}) has been submitted.`,
      ephemeral: true,
    });
  }

  if (commandName === "closereport") {
    const memberRole = interaction.member.roles.cache;

    if (!memberRole.has(Mod_Role_ID)) {
      return interaction.reply({
        content: "You do not have permission to close reports.",
        ephemeral: true,
      });
    }

    const reportID = options.getInteger("report_id");

    // Check if the report exists
    if (!reports[reportID]) {
      return interaction.reply({
        content: "Report not found.",
        ephemeral: true,
      });
    }

    // Get the message ID from the report
    const messageID = reports[reportID].messageID;

    // Try to fetch the report message from the report channel and delete it
    const reportChannel =
      interaction.guild.channels.cache.get(Report_Channel_ID);
    const reportMessage = await reportChannel.messages.fetch(messageID);

    if (reportMessage) {
      await reportMessage.delete(); // Delete the report message
    }

    // Delete the report from the reports object
    delete reports[reportID];

    await interaction.reply({
      content: `Report ${reportID} has been closed and the message has been deleted.`,
      ephemeral: true,
    });
  }
};
