const mongoose = require("mongoose");

const projects = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  guildId: { type: String, required: true },

  dayDate: { type: Number, default: Date.now() },
  weekDate: { type: Number, default: Date.now() },
  monthDate: { type: Number, default: Date.now() },

  data: { type: Object, default: {} },
  dataDay: { type: Object, default: {} },
  dataWeek: { type: Object, default: {} },
  dataMonth: { type: Object, default: {} },
  messages: { type: Object, default: {} },
  voice: { type: Object, default: {} },

  tasksDay: { type: Number, default: Date.now() },
  difficulty: { type: Number, default: 1 },
});

module.exports = mongoose.model("guilds", projects);
