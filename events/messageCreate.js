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
        tasks: client.utils.levels.generateTasks(client, dd),
      }).save());

    let obj = dd.messages;
    obj[message.author.id] = userData.boosts.find((b) => b.type === "messages")
      ? 2 + (dd.messages[message.author.id] || 0)
      : 1 + (dd.messages[message.author.id] || 0);

    let obj2 = dd.messagesLeaderboard;
    obj2[message.author.id] = userData.boosts.find((b) => b.type === "messages")
      ? 2 + (dd.messagesLeaderboard[message.author.id] || 0)
      : 1 + (dd.messagesLeaderboard[message.author.id] || 0);

    await dd.updateOne({ messages: obj, messagesLeaderboard: obj2 });

    await userData.updateOne({
      totalMessages: userData.boosts.find((b) => b.type === "messages")
        ? userData.totalMessages + 2
        : userData.totalMessages + 1 || 1,
    });
  },
};
