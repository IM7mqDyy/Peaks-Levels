const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("difficulty")
    .setDescription(
      "Set the default task difficulty for the server (easy, medium, or hard)."
    )
    .addNumberOption((option) =>
      option
        .setName("level")
        .setDescription("Choose the difficulty level of the tasks.")
        .setRequired(true)
        .addChoices(
          { name: "Easy", value: 1 },
          { name: "Medium", value: 2 },
          { name: "Hard", value: 3 }
        )
    ),
  async execute(client, interaction) {
    const level = interaction.options.getNumber("level");

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "**❌ You don’t have permission to use this command.**",
        ephemeral: true,
      });
    }

    await client.guildsSchema.findOneAndUpdate(
      {
        guildId: interaction.guild.id,
      },
      { difficulty: level }
    );

    return interaction.reply({
      content: `**✅ Successfully set the default task difficulty to \`${level}\`.**`,
      ephemeral: true,
    });
  },
};
