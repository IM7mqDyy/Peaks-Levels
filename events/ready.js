const { REST, Routes } = require("discord.js");

module.exports = {
  name: "clientReady",
  async execute(client, commands) {
    const rest = new REST({
      version: "10",
    }).setToken(process.env.BOT_TOKEN);
    (async () => {
      try {
        await rest.put(Routes.applicationCommands(client.user.id), {
          body: commands,
        });

        console.log("Successfully reloaded application (/) commands.");
      } catch (error) {
        console.error(error);
      }
    })();

    client.utils.levels.xpUp(30000, client);
    client.utils.levels.voiceXpUp(120000, client);

    const VOICE_RULES = {
      "اجلس ساعة في روم الصوت": 3600000,
      "اجلس ساعتين في روم الصوت": 7200000,
      "اجلس 4 ساعات في روم الصوت": 14400000,
    };

    setInterval(() => {
      client.guilds.cache.forEach(async (guild) => {
        guild.channels.cache
          .filter((channel) => channel.type === 2)
          .forEach((channel) => {
            channel.members.forEach(async (member) => {
              if (member.bot) return;

              let dbSchema = client.guildsSchema;
              const settings =
                (await dbSchema.findOne({ guildId: guild.id })) ||
                (await new dbSchema({
                  _id: new mongoose.Types.ObjectId(),
                  guildId: guild.id,
                }).save());

              client.utils.checkvoice(guild, member, channel, client);

              const dd =
                (await client.usersSchema.findOne({
                  userId: member.id,
                  guildId: guild.id,
                })) ||
                (await new client.usersSchema({
                  _id: new mongoose.Types.ObjectId(),
                  userId: member.id,
                  guildId: guild.id,
                  tasks: client.utils.levels.generateTasks(client),
                }).save());

              if (dd.voiceJoined) {
                for (let task of dd.tasks) {
                  if (task.done || task.type !== "voice") continue;

                  const requiredTime = VOICE_RULES[task.content];
                  if (
                    requiredTime &&
                    Date.now() > dd.voiceJoined + requiredTime
                  ) {
                    task.done = true;
                    const startX = 90;
                    const startZ = 485;
                    const spacing = 30;

                    dd.tasks
                      .filter((task) => task.done === true)
                      .forEach((task, index) => {
                        task.x = startX;
                        task.z = startZ + index * spacing;
                      });

                    dd.tasks
                      .filter((task) => task.done === false)
                      .forEach((task, index) => {
                        task.x = 380;
                        task.z = 485 + index * 50;
                      });

                    await dd.updateOne({ tasks: dd.tasks, voiceJoined: null });
                  }
                }
              }
            });
          });
      });
    }, 20000);
  },
};
