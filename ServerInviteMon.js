const WARNING_MAP = new Map();
const INVITE_REGEX =
  /https?:\/\/(www\.)?discord(?:app\.com\/invite|\.gg)\/\w+/i;

export async function InviteMon(message, logChannelId) {
  if (!message.guild || message.author.bot) return;

  // Check for server invite links
  if (INVITE_REGEX.test(message.content)) {
    let warnings = WARNING_MAP.get(message.author.id) || 0;
    warnings++;

    // Delete the invite message
    try {
      await message.delete();
    } catch (error) {
      console.error(
        `Failed to delete message from ${message.author.tag}: ${error.message}`
      );
    }

    if (warnings === 1) {
      await message.channel.send(
        `${message.author.tag}, sending server invites is not allowed in the server. Please refrain from doing so and read our rules. If you continue, you will be banned. Thank you, Mod team.`
      );

      const logChannel = message.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        await logChannel.send(
          `User ${message.author.tag} (ID: ${message.author.id}) sent a server invite link. Warning issued.`
        );
      } else {
        console.error(`Log channel with ID ${logChannelId} not found.`);
      }
    } else if (warnings === 2) {
      const member = message.guild.members.cache.get(message.author.id);

      if (member && member.bannable) {
        await member.ban({
          reason: "Sent a server invite after receiving a warning",
        });

        await message.channel.send(
          `${message.author.tag} has been banned from the server for sending server invites.`
        );

        const logChannel = message.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          await logChannel.send(
            `User ${message.author.tag} (ID: ${message.author.id}) was banned for sending a server invite link after a warning.`
          );
        } else {
          console.error(`Log channel with ID ${logChannelId} not found.`);
        }
      } else {
        await message.channel.send(`The bot cannot ban ${message.author.tag}.`);
      }
    }

    // Update the warning count in the map
    WARNING_MAP.set(message.author.id, warnings);
  }
}
