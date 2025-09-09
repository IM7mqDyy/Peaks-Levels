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

    let obj = dd.messages;
    obj[message.author.id] = 1 + dd.messages[message.author.id] || 0;

    await dd.updateOne({ messages: obj });

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

    await userData.updateOne({
      totalMessages: userData.totalMessages + 1 || 1,
    });
  },
};
