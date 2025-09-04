const mongoose = require("mongoose");

const TASK_CONDITIONS = {
  text: [
    {
      match: (c, userId) => c.dataDay[userId] >= 1000,
      content: "Get 1000 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 1500,
      content: "Get 1500 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 2000,
      content: "Get 2000 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 2500,
      content: "Get 2500 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 3000,
      content: "Get 3000 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 3500,
      content: "Get 3500 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 4000,
      content: "Get 4000 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 4500,
      content: "Get 4500 xp in daily top",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 5000,
      content: "Get 5000 xp in daily top",
    },
  ],
  messages: [
    {
      match: (c, userId) => c.messages[userId] >= 500,
      content: "Deal 500 messages today",
    },
    {
      match: (c, userId) => c.messages[userId] >= 600,
      content: "Deal 600 messages today",
    },
    {
      match: (c, userId) => c.messages[userId] >= 700,
      content: "Deal 700 messages today",
    },
    {
      match: (c, userId) => c.messages[userId] >= 800,
      content: "Deal 800 messages today",
    },
  ],
};

function generateTasks(client) {
  return [
    client.textTasks[Math.floor(Math.random() * client.textTasks.length)],
    client.voiceTasks[Math.floor(Math.random() * client.voiceTasks.length)],
    client.messagesTasks[
      Math.floor(Math.random() * client.messagesTasks.length)
    ],
    ...client.randomTasks.sort(() => 0.5 - Math.random()).slice(0, 2),
  ];
}

async function assignRandomTasks(client) {
  const users = await client.usersSchema.find({}, "_id"); // only get IDs for speed

  const operations = users.map((user) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { $set: { tasks: generateTasks(client) } },
    },
  }));

  if (operations.length > 0) {
    await client.usersSchema.bulkWrite(operations);
    console.log("✅ All users updated with random tasks!");
  } else {
    console.log("⚠️ No users found to update.");
  }
}

const xpUp = async (ms, client) => {
  setInterval(async () => {
    const settings = await client.guildsSchema.find({});

    Object.keys(client.utils.guildsXp).forEach(async (guildId) => {
      let guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      let collection =
        settings.find((guild) => guild.guildId === guildId) ||
        (await new client.guildsSchema({
          _id: new mongoose.Types.ObjectId(),
          guildId,
        }).save());

      if (collection.dayDate + 86400000 < Date.now()) {
        await collection
          .updateOne({
            $set: {
              dayDate: Date.now(),
              dataDay: {},
              messages: {},
            },
          })
          .then((d) => {});
      }

      if (
        (collection.tasksDay || Number(new Date("2015"))) + 86400000 <
        Date.now()
      ) {
        await collection.updateOne({
          $set: {
            tasksDay: Date.now(),
          },
        });

        await assignRandomTasks(client);
      }

      if (
        (collection.weekDate || Number(new Date("2015"))) + 604800000 <
        Date.now()
      ) {
        await collection
          .updateOne({
            $set: {
              weekDate: Date.now(),
              dataWeek: {},
            },
          })
          .then((d) => {});
      }

      Object.keys(client.utils.guildsXp[guildId]).forEach(async (userId) => {
        let obj = {};

        let member = guild.members.cache.get(userId);
        if (!member) return;
        if (member.user.bot) return;

        let data = client.utils.guildsXp[guildId][userId];

        let userSettings =
          (await client.usersSchema.findOne({ userId: userId, guildId })) ||
          (await new client.usersSchema({
            _id: new mongoose.Types.ObjectId(),
            userId: userId,
            guildId,
            tasks: generateTasks(client),
          }).save());

        let randomXp = Math.floor(Math.random() * 10 * data.xp) + 1;

        obj[`data.${userId}`] = randomXp;
        obj[`dataDay.${userId}`] = randomXp;
        obj[`dataWeek.${userId}`] = randomXp;

        for (const task of userSettings.tasks) {
          if (task.done) continue;

          const rules = TASK_CONDITIONS[task.type];
          if (!rules) continue;

          const rule = rules.find((r) => r.content === task.content);
          if (!rule) continue;

          if (rule.match(collection, userId)) {
            task.done = true;
          }
        }

        await userSettings.save();

        await collection.updateOne({ $inc: obj });
      });

      client.utils.guildsXp[guildId] = {};
    });
  }, ms);
};

const voiceXpUp = (ms, client) => {
  setInterval(async () => {
    const settings = await client.guildsSchema.find({});

    Object.keys(client.utils.guildsVoiceXp).forEach(async (guildId) => {
      let guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      let collection =
        settings.find((guild) => guild.guildId === guildId) ||
        (await new client.guildsSchema({
          _id: new mongoose.Types.ObjectId(),
          guildId,
        }).save());

      Object.keys(client.utils.guildsVoiceXp[guildId]).forEach(
        async (userId) => {
          let obj = {};

          let member = guild.members.cache.get(userId);
          if (!member) return;
          if (member.user.bot) return;

          let data = client.utils.guildsVoiceXp[guildId][userId];

          let userSettings =
            (await client.usersSchema.findOne({ userId: userId, guildId })) ||
            (await new client.usersSchema({
              _id: new mongoose.Types.ObjectId(),
              userId: userId,
              guildId,
              tasks: generateTasks(client),
            }).save());

          let randomXp = Math.floor(Math.random() * 2 * data.xp) + 1;

          obj[`data.${userId}`] = randomXp;
          obj[`dataDay.${userId}`] = randomXp;
          obj[`dataWeek.${userId}`] = randomXp;

          for (const task of userSettings.tasks) {
            if (task.done) continue;

            const rules = TASK_CONDITIONS[task.type];
            if (!rules) continue;

            const rule = rules.find((r) => r.content === task.content);
            if (!rule) continue;

            if (rule.match(collection, userId)) {
              task.done = true;
            }
          }

          await userSettings.save();

          await collection.updateOne({ $inc: obj });
        }
      );

      client.utils.guildsVoiceXp[guildId] = {};
    });
  }, ms);
};

module.exports = { xpUp, voiceXpUp, generateTasks };
