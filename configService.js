import ServerConfig from "./mongoDb/MongoModel/ServerConfigModel.js";

const getServerConfig = async (guildId) => {
  try {
    const config = await ServerConfig.findOne({ guildid: guildId });
    if (!config) {
      console.error("No configuration found for guild:", guildId);
      return null; // or return a default config
    }
    return config;
  } catch (error) {
    console.error("Error fetching server configuration:", error);
    throw new Error("Failed to fetch server configuration.");
  }
};

export default getServerConfig;
