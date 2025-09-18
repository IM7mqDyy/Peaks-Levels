const mongoose = require("mongoose");

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, commands, oldState, newState) {
    if (oldState.channelId === null) {
      const settings =
        (await client.guildsSchema.findOne({ guildId: newState.guild.id })) ||
        (await new client.guildsSchema({
          _id: new mongoose.Types.ObjectId(),
          guildId: newState.guild.id,
        }).save());

      const dd =
        (await client.usersSchema.findOne({
          userId: newState.member.id,
          guildId: newState.guild.id,
        })) ||
        (await new client.usersSchema({
          _id: new mongoose.Types.ObjectId(),
          userId: newState.member.id,
          guildId: newState.guild.id,
          tasks: client.utils.levels.generateTasks(client, settings),
        }).save());

      await dd.updateOne({ voiceJoined: Date.now() });
    }

    if (newState.channelId === null) {
      const settings =
        (await client.guildsSchema.findOne({ guildId: newState.guild.id })) ||
        (await new client.guildsSchema({
          _id: new mongoose.Types.ObjectId(),
          guildId: newState.guild.id,
        }).save());

      const dd =
        (await client.usersSchema.findOne({
          userId: newState.member.id,
          guildId: newState.guild.id,
        })) ||
        (await new client.usersSchema({
          _id: new mongoose.Types.ObjectId(),
          userId: newState.member.id,
          guildId: newState.guild.id,
          tasks: client.utils.levels.generateTasks(client, settings),
        }).save());

      const updated = await client.usersSchema.findOneAndUpdate(
        { _id: dd._id },
        {
          voiceJoined: null,
          $inc: {
            voiceTime: dd.boosts.find((b) => b.type === "minutes")
              ? (Date.now() - dd.voiceJoined) * 2
              : Date.now() - dd.voiceJoined,
          },
        },
        { new: true }
      );

      let obj = settings.voice ? settings.voice : {};
      obj[newState.member.id] = updated.voiceTime;

      await settings.updateOne({ voice: obj });
    }
  },
};
