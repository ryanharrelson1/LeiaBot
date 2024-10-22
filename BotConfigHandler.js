import ServerConfig from "./mongoDb/MongoModel/ServerConfigModel.js";
import { ChannelType } from "discord.js"; // Import ChannelType

export const OnBotJoin = async (guild) => {
  try {
    const owner = await guild.fetchOwner();
    const ownerIds = owner.id; // Get the owner ID
    const config = await ServerConfig.findOne({ guildid: guild.id });

    if (!config) {
      const newconfig = new ServerConfig({
        guildid: guild.id,
        ownerid: ownerIds,
      });

      await newconfig.save();
      console.log(`Default configuration created for guild: ${guild.name}`);

      const channels = await guild.channels.fetch();
      const textChannel = channels.find(
        (channel) => channel.type === ChannelType.GuildText
      );

      if (textChannel) {
        await textChannel.send(
          `Thank you for inviting me to **${guild.name}**! a configeration file was created on my database Head over to the leiabot dashboard to set up my configeration im so happy to be here:)`
        );
      }
    }
  } catch (error) {
    console.error("Error initializing guild config:", error);
  }
};
