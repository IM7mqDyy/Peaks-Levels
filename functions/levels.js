const mongoose = require("mongoose");

function shuffleArray(arr) {
  let array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const TASK_CONDITIONS = {
  text: [
    {
      match: (c, userId) => c.dataDay[userId] >= 1000,
      content: "احصل على 1000 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 1500,
      content: "احصل على 1500 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 2000,
      content: "احصل على 2000 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 2500,
      content: "احصل على 2500 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 3000,
      content: "احصل على 3000 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 3500,
      content: "احصل على 3500 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 4000,
      content: "احصل على 4000 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 4500,
      content: "احصل على 4500 اكس بي في التوب اليومي",
    },
    {
      match: (c, userId) => c.dataDay[userId] >= 5000,
      content: "احصل على 5000 اكس بي في التوب اليومي",
    },
  ],
  messages: [
    {
      match: (c, userId) => c.messages[userId] >= 500,
      content: "ارسل 500 رسالة اليوم",
    },
    {
      match: (c, userId) => c.messages[userId] >= 600,
      content: "ارسل 600 رسالة اليوم",
    },
    {
      match: (c, userId) => c.messages[userId] >= 700,
      content: "ارسل 700 رسالة اليوم",
    },
    {
      match: (c, userId) => c.messages[userId] >= 800,
      content: "ارسل 800 رسالة اليوم",
    },
  ],
};

function generateTasks(client) {
  const tasks = [
    client.textTasks[Math.floor(Math.random() * client.textTasks.length)],
    client.voiceTasks[Math.floor(Math.random() * client.voiceTasks.length)],
    client.messagesTasks[
      Math.floor(Math.random() * client.messagesTasks.length)
    ],
    ...client.randomTasks.sort(() => 0.5 - Math.random()).slice(0, 2),
  ];

  const startX = 380;
  const startZ = 485;
  const spacing = 50;

  tasks.forEach((task, index) => {
    task.x = startX;
    task.z = startZ + index * spacing;
  });

  return tasks;
}

async function assignRandomTasks(client) {
  const users = await client.usersSchema.find({}, "_id");

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
