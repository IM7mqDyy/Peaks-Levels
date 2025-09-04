const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your profile")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Select a user to check their profile")
        .setRequired(false)
    ),
  async execute(client, interaction) {
    const user = interaction.options.getMember("user");
  },
};
