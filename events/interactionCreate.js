const ms = require("ms");
const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(client, commands, interaction) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(client, interaction);
      } catch (error) {
        console.error(error);
        return interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "special_task_select") {
        const index = parseInt(interaction.values[0], 10);

        const userSettings = await client.usersSchema.findOne({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
        });

        const undoneTasks = userSettings.tasks.filter((t) => !t.done);
        if (index < 0 || index >= undoneTasks.length) {
          return interaction.reply({
            content: "❌ Invalid choice.",
            ephemeral: true,
          });
        }

        undoneTasks[index].done = true;

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

        return interaction.reply({
          content: `✅ Task **${undoneTasks[index].content}** has been marked as done!`,
          ephemeral: true,
        });
      }

      if (interaction.customId === "shop_menu") {
        const shopMap = Object.fromEntries(
          client.shop.map((item) => [`shop_${item.id}`, item])
        );

        const selectedValue = interaction.values[0];
        const selectedItem = shopMap[selectedValue];

        if (!selectedItem) {
          return interaction.reply({
            content: "❌ Item not found.",
            ephemeral: true,
          });
        }

        const userStats = await client.utils.socketEmitAsync(
          "findOne",
          {
            userId: interaction.user.id,
          },
          client
        );

        const userSettings = await client.usersSchema.findOne({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
        });

        if (!userStats || !userSettings)
          return interaction.reply({
            content: `**❌ Start using the bot first.**`,
            ephemeral: true,
          });

        if (userStats.balance < selectedItem.price) {
          return interaction.reply({
            content: "**❌ You don't have enough coins to buy this item.**",
            ephemeral: true,
          });
        }

        client.socket.emit(
          "updateOne",
          { userId: interaction.user.id },
          { $inc: { balance: -selectedItem.price } }
        );

        if (selectedItem.category === "special") {
          const undoneTasks = userSettings.tasks.filter((t) => !t.done);

          if (undoneTasks.length === 0) {
            return interaction.reply({
              content: "✅ You have no undone tasks to complete.",
              ephemeral: true,
            });
          }

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("special_task_select")
            .setPlaceholder("Choose a task to complete")
            .addOptions(
              undoneTasks.map((task, i) => ({
                label: task.content.slice(0, 100), // must be <= 100 chars
                description: `Task #${i + 1}`,
                value: String(i),
              }))
            );

          const row = new ActionRowBuilder().addComponents(selectMenu);

          return interaction.reply({
            content: "🎉 Choose one task to mark as done:",
            components: [row],
            ephemeral: true,
          });
        } else {
          const now = Date.now();
          const endTime = selectedItem.time
            ? now + ms(selectedItem.time)
            : null;

          const existingBoost = userSettings.boosts.find(
            (boost) => boost.type === selectedItem.category
          );

          if (existingBoost)
            return interaction.reply({
              content: `**❌ You already have an active boost of ${existingBoost.type}.**`,
              ephemeral: true,
            });

          userSettings.boosts.push({
            type: selectedItem.category,
            expiresAt: endTime,
            activatedAt: now,
            multiplier: 2.0,
          });

          await userSettings.save();

          await interaction.reply({
            content: `✅ You had been activated **${selectedItem.content}** for \`(${selectedItem.time})\` with **${selectedItem.price} coins** ${selectedItem.emoji}`,
            ephemeral: true,
          });
        }
      }
    }
  },
};
