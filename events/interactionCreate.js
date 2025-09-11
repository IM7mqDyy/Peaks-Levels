const ms = require("ms");

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
      if (interaction.customId !== "shop_menu") return;

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

      const now = Date.now();
      const endTime = now + ms(selectedItem.time);

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
  },
};
