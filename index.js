const dotenv = require("dotenv");
dotenv.config();

const io = require("socket.io-client");
const socket = io(process.env.WS_HTTP, {
  auth: {
    token: process.env.WS_AUTH_TOKEN,
  },
});

const fs = require("fs");

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const client = new Client({ intents: Object.values(GatewayIntentBits) });

client.socket = socket;
client.commands = new Collection();
client.mongoose = require("./database/connect");
client.guildsSchema = require("./database/schema/guilds");
client.usersSchema = require("./database/schema/users");
client.config = require("./settings/config");
client.textTasks = client.config.TEXT_TASKS ? client.config.TEXT_TASKS : [];
client.voiceTasks = client.config.VOICE_TASKS ? client.config.VOICE_TASKS : [];
client.messagesTasks = client.config.MESSAGES_TASKS
  ? client.config.MESSAGES_TASKS
  : [];
client.randomTasks = client.config.RANDOM_TASKS
  ? client.config.RANDOM_TASKS
  : [];
client.achievements = client.config.ACHIEVEMENTS
  ? client.config.ACHIEVEMENTS
  : [];
client.utils = require("./functions/utils/system");
client.utils.levels = require("./functions/levels");
client.utils.guildsXp = {};
client.utils.guildsVoiceXp = {};

socket.on("connect", () => {
  console.log("Connected to server");

  socket.once("ready", (data) => {
    socket.emit("ready", { message: "Leveling Bot is connected to ws!" });
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("connect_error", (err) => {
  console.log("err connecting to server", err.message);
});

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) =>
      event.execute(client, commands, ...args)
    );
  } else {
    client.on(event.name, (...args) =>
      event.execute(client, commands, ...args)
    );
  }
}

client.login(process.env.BOT_TOKEN);
client.mongoose(process.env.MONGO_DB, {});
