import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import dotenv from "dotenv";
import ServerConfig from "./mongoDb/MongoModel/ServerConfigModel.js";

dotenv.config();

const Token = process.env.Discord_Token;

const commands = [
  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user for inappropiate behavior")
    .addUserOption((options) =>
      options
        .setName("user")
        .setDescription("the user you want to report")
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName("reason")
        .setDescription("the reason for reporting this user")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("closereport")
    .setDescription("close a report by ID")
    .addIntegerOption((option) =>
      option
        .setName("report_id")
        .setDescription("the id of the report to close")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("create an annoucement")
    .addStringOption((options) =>
      options
        .setName("message")
        .setDescription("announcment message")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setbirthday")
    .setDescription("set your birthday (MM-DD format")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("enter your birhtday in MM-DD format")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(Token);
const Client_ID = process.env.Client_ID;
const registerCommands = async () => {
  try {
    const guildConfigs = await ServerConfig.find(); // Fetches all guilds from the database

    for (const config of guildConfigs) {
      const Guild_ID = config.guildid; // Get the guild ID from the database

      if (Guild_ID) {
        console.log(`Registering commands for guild: ${Guild_ID}`);

        // Register the commands for the specific guild
        await rest.put(Routes.applicationGuildCommands(Client_ID, Guild_ID), {
          body: commands,
        });

        console.log(`Successfully registered commands for guild: ${Guild_ID}`);
      } else {
        console.error("Guild ID not found in the database for config:", config);
      }
    }
    console.log("success");
  } catch (error) {
    console.error(error);
  }
};

export default registerCommands;
