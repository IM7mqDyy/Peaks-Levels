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
  },
};
