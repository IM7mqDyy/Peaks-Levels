const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  type: { type: String, required: true },
  content: { type: String, required: true },
  target: { type: String, required: true },
  x: { type: Number, required: true },
  z: { type: Number, required: true },
  done: { type: Boolean, default: false },
});

const projects = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  guildId: { type: String, required: true },
  userId: { type: String, required: true },

  tasks: { type: [taskSchema], default: [] },
  achievements: { type: Array, default: [] },

  totalMessages: { type: Number, default: 0 },

  profileColor: { type: String, default: "#595F83" },
  voiceJoined: { type: Number, default: null },
  voiceTime: { type: Number, default: 0 },
});

module.exports = mongoose.model("users", projects);
