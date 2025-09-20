const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock (force complete) an task for a member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member you want to unlock the task for")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("task")
        .setDescription("The task number to unlock (1-5).")
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

    const guildSettings = await client.guildsSchema.findOne({
      guildId: interaction.guild.id,
    });
    if (!guildSettings) {
      return interaction.reply({
        content: "Guild settings not found.",
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

    let obj = {};

    const index = taskNumber - 1;
    if (!userSettings.tasks[index]) {
      return interaction.reply({
        content: `**Task \`${taskNumber}\` does not exist.**`,
        ephemeral: true,
      });
    }

    if (userSettings.tasks[index].done) {
      return interaction.reply({
        content: `**Task \`${taskNumber}\` is already completed.**`,
        ephemeral: true,
      });
    }

    userSettings.tasks[index].done = true;

    client.socket.emit(
      "updateOne",
      { userId: user.user.id },
      { $inc: { balance: userSettings.tasks[index].reward.coins } }
    );

    obj[`data.${user.user.id}`] = userSettings.tasks[index].reward.xp;
    obj[`dataDay.${user.user.id}`] = userSettings.tasks[index].reward.xp;
    obj[`dataWeek.${user.user.id}`] = userSettings.tasks[index].reward.xp;
    obj[`dataMonth.${user.user.id}`] = userSettings.tasks[index].reward.xp;

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
    await guildSettings.updateOne({ $inc: obj });

    interaction.reply({
      content: `**✅ Task \`${taskNumber}\` for ${user} has been unlocked!**`,
      ephemeral: false,
    });
  },
};
