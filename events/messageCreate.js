const mongoose = require("mongoose");

module.exports = {
  name: "messageCreate",
  async execute(client, commands, message) {
    if (message.author.bot) return;

    let dd =
      (await client.guildsSchema.findOne({ guildId: message.guild.id })) ||
      (await new client.guildsSchema({
        _id: new mongoose.Types.ObjectId(),
        guildId: message.guild.id,
      }).save());

    try {
      client.utils.checkwords(message, client, message.member);
    } catch {}

    const userData =
      (await client.usersSchema.findOne({
        userId: message.author.id,
        guildId: message.guild.id,
      })) ||
      (await new client.usersSchema({
        _id: new mongoose.Types.ObjectId(),
        userId: message.author.id,
        guildId: message.guild.id,
        tasks: client.utils.levels.generateTasks(client),
      }).save());

    let obj = dd.messages;
    obj[message.author.id] = userData.boosts.filter(
      (b) => b.type === "messages"
    )
      ? 2 + dd.messages[message.author.id]
      : 1 + dd.messages[message.author.id] || 0;

    await dd.updateOne({ messages: obj });

    await userData.updateOne({
      totalMessages: userData.boosts.filter((b) => b.type === "messages")
        ? userData.totalMessages + 2
        : userData.totalMessages + 1 || 1,
    });

    if (message.content.toLowerCase() === "hi") {
      const shopOptions = client.utils.levels.getRandomItemsWithPercent(
        client.shop,
        5
      );

      message.channel.send({
        components: [
          {
            type: 1,
            components: [
              {
                type: 3,
                custom_id: "shop_menu",
                placeholder: "🛒 اختر عنصراً من المتجر...",
                min_values: 1,
                max_values: 1,
                options: shopOptions.map((item, idx) => ({
                  label: `${item.content} ( ${item.price}🪙)`,
                  description: `${item.description}${
                    item.time ? ` (${item.time})` : ``
                  }`,
                  value: `shop_${item.id}`,
                  emoji: item.emoji || "🛒",
                })),
              },
            ],
          },
        ],
      });
    }
  },
};
