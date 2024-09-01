const spamMap = new Map();

async function handleMessage(
  message,
  logChannelId,
  spamLimit,
  timeWindow,
  timeoutDuration
) {
  const authorId = message.author.id;

  // Initialize the spamMap entry for the user if it does not exist
  if (!spamMap.has(authorId)) {
    spamMap.set(authorId, []);
  }

  const userMessages = spamMap.get(authorId);
  const currentTime = Date.now();
  userMessages.push(currentTime);

  // Filter out messages that are outside the time window
  const recentMessages = userMessages.filter(
    (timestamp) => currentTime - timestamp < timeWindow
  );

  spamMap.set(authorId, recentMessages);

  if (recentMessages.length >= spamLimit) {
    await timeoutUser(message, logChannelId, timeoutDuration);
    spamMap.set(authorId, []); // Reset the spam counter
  }
}

async function timeoutUser(message, logChannelId, timeoutDuration) {
  const member = message.guild.members.cache.get(message.author.id);

  if (!member || !member.moderatable) {
    return message.channel.send(
      `Could not timeout user ${message.author.tag}.`
    );
  }

  try {
    await member.timeout(timeoutDuration, "Please refrain from spamming.");
    await message.channel.send(
      `${message.author.tag} has been timed out for spamming.`
    );

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      logChannel.send(
        `User ${message.author.tag} (ID: ${message.author.id}) was timed out by ${message.author.tag} for spamming. Timeout duration: 1 minute.`
      );
    } else {
      console.error(`Log channel with ID ${logChannelId} not found.`);
    }
  } catch (error) {
    console.error(`Failed to timeout user ${message.author.tag}:`, error);
    message.channel.send(`Failed to timeout user ${message.author.tag}.`);
  }
}

module.exports = { handleMessage };
