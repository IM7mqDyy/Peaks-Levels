const mongoose = require("mongoose");

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, commands, oldState, newState) {
    if (oldState.channelId === null) {
      const dd =
        (await client.usersSchema.findOne({
          userId: newState.member.id,
          guildId: newState.guild.id,
        })) ||
        (await new client.usersSchema({
          _id: new mongoose.Types.ObjectId(),
          userId: newState.member.id,
          guildId: newState.guild.id,
          tasks: client.utils.levels.generateTasks(client),
        }).save());

      await dd.updateOne({ voiceJoined: Date.now() });
    }

    if (newState.channelId === null) {
      const dd =
        (await client.usersSchema.findOne({
          userId: newState.member.id,
          guildId: newState.guild.id,
        })) ||
        (await new client.usersSchema({
          _id: new mongoose.Types.ObjectId(),
          userId: newState.member.id,
          guildId: newState.guild.id,
          tasks: client.utils.levels.generateTasks(client),
        }).save());

      await dd.updateOne({
        voiceJoined: null,
        voiceTime: dd.boosts.filter((b) => b.type === "minutes")
          ? (Date.now() - dd.voiceJoined) * 2
          : Date.now() - dd.voiceJoined,
      });
    }
  },
};
