const mongoose = require("mongoose");
const ms = require("ms");

async function checkAchievements(userId, userSettings, guildSettings, client) {
  for (const rule of client.achievements) {
    const alreadyUnlocked = userSettings.achievements.some(
      (a) => a.type === rule.type && a.content === rule.content
    );
    if (alreadyUnlocked) continue;

    const progressValue =
      rule.type === "text"
        ? userSettings.totalMessages
        : userSettings.voiceTime / 60000;

    if (progressValue >= rule.target) {
      userSettings.achievements.push({
        type: rule.type,
        content: rule.content,
        done: true,
      });

      client.socket.emit(
        "updateOne",
        { userId },
        { $inc: { balance: rule.reward } }
      );
    }
  }
}

const ACHIEVEMENTS_CONDITIONS = {
  text: [
    {
      content: "100 رسالة",
      type: "text",
      target: 100,
      reward: 10,
    },
    {
      content: "500 رسالة",
      type: "text",
      target: 500,
      reward: 100,
    },
    {
      content: "1000 رسالة",
      type: "text",
      target: 1000,
      reward: 150,
    },
    {
      content: "5000 رسالة",
      type: "text",
      target: 5000,
      reward: 550,
    },
    {
      content: "10000 رسالة",
      type: "text",
      target: 10000,
      reward: 1000,
    },
    {
      content: "50000 رسالة",
      type: "text",
      target: 50000,
      reward: 3500,
    },
    {
      content: "100000 رسالة",
      type: "text",
      target: 100000,
      reward: 5500,
    },
  ],
  voice: [
    {
      content: "100 دقيقة صوتية",
      type: "voice",
      target: 100,
      reward: 10,
    },
    {
      content: "500 دقيقة صوتية",
      type: "voice",
      target: 500,
      reward: 30,
    },
    {
      content: "1000 دقيقة صوتية",
      type: "voice",
      target: 1000,
      reward: 85,
    },
    {
      content: "5000 دقيقة صوتية",
      type: "voice",
      target: 5000,
      reward: 250,
    },
    {
      content: "10000 دقيقة صوتية",
      type: "voice",
      target: 10000,
      reward: 950,
    },
    {
      content: "50000 دقيقة صوتية",
      type: "voice",
      target: 50000,
      reward: 3000,
    },
    {
      content: "100000 دقيقة صوتية",
      type: "voice",
      target: 100000,
      reward: 4500,
    },
  ],
};

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

function pickRandomWeighted(list, count) {
  const picked = [];
  let pool = [...list];

  while (picked.length < count && pool.length > 0) {
    const totalPercent = pool.reduce((sum, item) => sum + item.priority, 0);
    let random = Math.random() * totalPercent;

    let chosenIndex = -1;
    for (let i = 0; i < pool.length; i++) {
      random -= pool[i].priority;
      if (random <= 0) {
        chosenIndex = i;
        break;
      }
    }

    if (chosenIndex !== -1) {
      picked.push(pool[chosenIndex]);
      pool.splice(chosenIndex, 1);
    }
  }
  return picked;
}

function getRandomItemsWithPercent(items, count = 5) {
  const categories = {
    text: items.filter((item) => item.category === "text"),
    voice: items.filter((item) => item.category === "voice"),
    messages: items.filter((item) => item.category === "messages"),
    minutes: items.filter((item) => item.category === "minutes"),
    general: items.filter((item) => item.category === "general"),
    special: items.filter((item) => item.category === "special"),
  };

  const result = [];

  const distributions = [
    { text: 2, voice: 0, messages: 0, minutes: 0 },
    { text: 0, voice: 2, messages: 0, minutes: 0 },
    { text: 0, voice: 0, messages: 2, minutes: 0 },
    { text: 0, voice: 0, messages: 0, minutes: 2 },

    { text: 1, voice: 1, messages: 0, minutes: 0 },
    { text: 1, voice: 0, messages: 1, minutes: 0 },
    { text: 1, voice: 0, messages: 0, minutes: 1 },
    { text: 0, voice: 1, messages: 1, minutes: 0 },
    { text: 0, voice: 1, messages: 0, minutes: 1 },
    { text: 0, voice: 0, messages: 1, minutes: 1 },
  ];

  const chosen =
    distributions[Math.floor(Math.random() * distributions.length)];

  if (chosen.text > 0 && categories.text.length > 0) {
    result.push(...pickRandomWeighted(categories.text, chosen.text));
  }
  if (chosen.voice > 0 && categories.voice.length > 0) {
    result.push(...pickRandomWeighted(categories.voice, chosen.voice));
  }

  if (chosen.messages > 0 && categories.messages.length > 0) {
    result.push(...pickRandomWeighted(categories.messages, chosen.messages));
  }

  if (chosen.minutes > 0 && categories.minutes.length > 0) {
    result.push(...pickRandomWeighted(categories.minutes, chosen.minutes));
  }

  const remaining = count - result.length;
  if (remaining > 0) {
    const pool = [...categories.general, ...categories.special];
    result.push(...pickRandomWeighted(pool, remaining));
  }

  return result;
}

function generateTasks(client, guildData) {
  const difficulty = guildData.difficulty || 1;

  const textTasks = client.textTasks.filter(
    (t) => Number(t.difficulty) === Number(difficulty)
  );
  const voiceTasks = client.voiceTasks.filter(
    (t) => Number(t.difficulty) === Number(difficulty)
  );
  const messagesTasks = client.messagesTasks.filter(
    (t) => Number(t.difficulty) === Number(difficulty)
  );
  const randomTasks = client.randomTasks.filter(
    (t) => Number(t.difficulty) === Number(difficulty)
  );

  const tasks = [
    textTasks[Math.floor(Math.random() * textTasks.length)],
    voiceTasks[Math.floor(Math.random() * voiceTasks.length)],
    messagesTasks[Math.floor(Math.random() * messagesTasks.length)],
    ...randomTasks.sort(() => 0.5 - Math.random()).slice(0, 2),
  ].filter(Boolean);

  const startX = 380;
  const startZ = 485;
  const spacing = 50;

  tasks.forEach((task, index) => {
    task.x = startX;
    task.z = startZ + index * spacing;
  });

  return tasks;
}

async function assignRandomTasks(client, guildData) {
  const users = await client.usersSchema.find({}, "_id");

  const operations = users.map((user) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { $set: { tasks: generateTasks(client, guildData) } },
    },
  }));

  if (operations.length > 0) {
    await client.usersSchema.bulkWrite(operations);
    console.log("✅ All users updated with random tasks!");
  } else {
    console.log("⚠️ No users found to update.");
  }
}

const xpUp = async (timeWithMs, client) => {
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
        const channelForShop = await client.channels.fetch(
          "1418350238963470449"
        );
        const messageForShop = await channelForShop.messages.fetch(
          "1418350670955942103"
        );

        const shopOptions = client.utils.levels.getRandomItemsWithPercent(
          client.shop,
          5
        );

        await messageForShop.edit({
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

        const channelForLeaderBoard = await client.channels.fetch(
          "1418273816467210321"
        );
        const messageForLeaderBoard =
          await channelForLeaderBoard.messages.fetch("1418353534742822932");

        let arr = [];

        Object.keys(collection["data"]).forEach((user) => {
          arr.push({
            userId: user,
            lv: client.utils.getLevel(collection["data"][user]).level.i || 0,
            messages: collection.messagesLeaderboard[user] || 0,
            voice: collection.voice[user] || "0m",
          });
        });

        arr = arr.sort((a, b) => b.lv - a.lv);
        let sliced = arr.slice(0, 10);

        let str = ``;

        for (let dat of sliced) {
          str =
            str +
            "\n" +
            `#${client.utils.rankOfUser(collection["data"], dat.userId)} | <@!${
              dat.userId
            }> LV: \`${dat.lv}\`\ | Messages: \`${
              dat.messages
            }\`\ | Voice: \`${ms(dat.voice)}\`\  `;
        }

        await messageForLeaderBoard.edit({
          embeds: [
            {
              color: 0x57f287,
              author: {
                name: "📋 Guild Score Leaderboards",
                icon_url: channelForLeaderBoard.guild.iconURL,
              },
              fields: [
                {
                  name: "TOP 10 MEMBERS :bookmark_tabs:",
                  value: `${str}`,
                },
              ],
              timestamp: new Date(),
              footer: {
                text: channelForLeaderBoard.guild.name,
                icon_url: channelForLeaderBoard.guild.iconURL,
              },
            },
          ],
        });

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

        await assignRandomTasks(client, collection);
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

      if (
        (collection.monthDate || Number(new Date("2015"))) + 2592000000 <
        Date.now()
      ) {
        await collection
          .updateOne({
            $set: {
              monthDate: Date.now(),
              dataMonth: {},
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
            tasks: generateTasks(client, collection),
          }).save());

        userSettings.boosts = userSettings.boosts.filter(
          (b) => b.expiresAt > Date.now()
        );

        let randomXp = userSettings.boosts.find((b) => b.type === "text")
          ? (Math.floor(Math.random() * 10 * data.xp) + 1) * 2
          : Math.floor(Math.random() * 10 * data.xp) + 1;

        obj[`data.${userId}`] = randomXp;
        obj[`dataDay.${userId}`] = randomXp;
        obj[`dataWeek.${userId}`] = randomXp;
        obj[`dataMonth.${userId}`] = randomXp;

        checkAchievements(userId, userSettings, collection, client);

        for (const task of userSettings.tasks) {
          if (task.done) continue;

          const rules = TASK_CONDITIONS[task.type];
          if (!rules) continue;

          const rule = rules.find((r) => r.content === task.content);
          if (!rule) continue;

          if (rule.match(collection, userId)) {
            task.done = true;

            client.socket.emit(
              "updateOne",
              { userId },
              { $inc: { balance: task.reward.coins } }
            );

            obj[`data.${userId}`] = randomXp + task.reward.xp;
            obj[`dataDay.${userId}`] = randomXp + task.reward.xp;
            obj[`dataWeek.${userId}`] = randomXp + task.reward.xp;
            obj[`dataMonth.${userId}`] = randomXp + task.reward.xp;

            const startX = 80;
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
  }, timeWithMs);
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
              tasks: generateTasks(client, collection),
            }).save());

          userSettings.boosts = userSettings.boosts.filter(
            (b) => b.expiresAt > Date.now()
          );

          let randomXp = userSettings.boosts.find((b) => b.type === "text")
            ? (Math.floor(Math.random() * 2 * data.xp) + 1) * 2
            : Math.floor(Math.random() * 2 * data.xp) + 1;

          obj[`data.${userId}`] = randomXp;
          obj[`dataDay.${userId}`] = randomXp;
          obj[`dataWeek.${userId}`] = randomXp;
          obj[`dataMonth.${userId}`] = randomXp;

          for (const task of userSettings.tasks) {
            if (task.done) continue;

            const rules = TASK_CONDITIONS[task.type];
            if (!rules) continue;

            const rule = rules.find((r) => r.content === task.content);
            if (!rule) continue;

            if (rule.match(collection, userId)) {
              task.done = true;

              client.socket.emit(
                "updateOne",
                { userId },
                { $inc: { balance: task.reward.coins } }
              );

              obj[`data.${userId}`] = randomXp + task.reward.xp;
              obj[`dataDay.${userId}`] = randomXp + task.reward.xp;
              obj[`dataWeek.${userId}`] = randomXp + task.reward.xp;
              obj[`dataMonth.${userId}`] = randomXp + task.reward.xp;

              const startX = 80;
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

module.exports = { xpUp, voiceXpUp, generateTasks, getRandomItemsWithPercent };
