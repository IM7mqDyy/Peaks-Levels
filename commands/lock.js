const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("lock an task for a member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member you want to lock the task for")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("task")
        .setDescription("The task number to lock (1-5).")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    ),
  async execute(client, interaction) {
    let user = interaction.options.getMember("user");
    if (user.user ? user.user.bot : user.bot) return;

    const taskNumber = interaction.options.getNumber("task");

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "**❌ You don’t have permission to use this command.**",
        ephemeral: true,
      });
    }

    const userSettings = await client.usersSchema.findOne({
      userId: user.user.id,
      guildId: interaction.guild.id,
    });
    if (!userSettings) {
      return interaction.reply({
        content: "User settings not found.",
        ephemeral: true,
      });
    }

    const index = taskNumber - 1;
    if (!userSettings.tasks[index]) {
      return interaction.reply({
        content: `**Task \`${taskNumber}\` does not exist.**`,
        ephemeral: true,
      });
    }

    if (!userSettings.tasks[index].done) {
      return interaction.reply({
        content: `**Task \`${taskNumber}\` isn't completed.**`,
        ephemeral: true,
      });
    }

    userSettings.tasks[index].done = false;

    const startX = 90;
    const startZ = 485;
    const spacing = 30;

    userSettings.tasks
      .filter((task) => task.done === true)
      .forEach((task, index) => {
        task.x = startX;
        task.z = startZ + index * spacing;
      });

    userSettings.tasks
      .filter((task) => task.done === false)
      .forEach((task, index) => {
        task.x = 380;
        task.z = 485 + index * 50;
      });

    await userSettings.save();

    interaction.reply({
      content: `**✅ Task \`${taskNumber}\` for ${user} has been unlocked!**`,
      ephemeral: false,
    });
  },
};
