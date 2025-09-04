const dotenv = require("dotenv");
dotenv.config();

const io = require("socket.io-client");
const socket = io(process.env.WS_HTTP, {
  auth: {
    token: process.env.WS_AUTH_TOKEN,
  },
});

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const client = new Client({ intents: Object.values(GatewayIntentBits) });

client.socket = socket;

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

client.login(process.env.BOT_TOKEN);
