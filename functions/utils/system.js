const getXpFor = (level) => {
  const base = 50;
  const growth = 1.12;
  const maxLevel = 100;

  if (level <= 0) return 0;
  if (level > maxLevel) level = maxLevel;

  return Math.floor(base * Math.pow(growth, level - 1));
};

const getTotalXpFor = (level) => {
  let xp = 0;
  for (let i = 1; i <= level; i++) {
    xp += getXpFor(i);
  }
  return xp;
};

let x = 0;
const arr = [];

for (var i = 1; i < 100; i++) {
  let d = getTotalXpFor(i);
  arr.push(d);
}

const getLevel = (xp) => {
  let level = 0;

  for (let x of arr) {
    let index = arr.findIndex((a) => a === x);
    if (arr[index] === xp) {
      level = index;
    }
    if (getTotalXpFor(1) > xp) {
      level = -1;
    }
    if (getTotalXpFor(100) < xp) {
      level = index;
    }
    if (arr[index] < xp && xp < arr[index + 1]) {
      level = index;
    }
  }

  const thislevel = {
    i: level + 1,
    xp: getTotalXpFor(level + 1),
  };

  const nextlevel = {
    i: level >= 100 ? 100 : level + 2,
    xp:
      level >= 100
        ? getTotalXpFor(100)
        : getTotalXpFor(thislevel.i + 1) - getTotalXpFor(level + 1),
  };

  return {
    total: xp,

    level: thislevel,
    nextlevel,

    counter: {
      thislvlxp: xp - thislevel.xp,
    },
  };
};

const getXpPerLevel = (xp) => {
  let x = 0;
  let l = 0;

  for (var i = 0; i < 100; i++) {
    x = x + getTotalXpFor(i);
    l = i;
    if (x == xp) return x - xp;
    if (x > xp) return x - xp;
  }
};

const getXpOfLevel = (xp) => {
  let x = getLevel(xp);
  let xx = xp;

  for (var i = 0; i < x; i++) {
    xx = xx - getTotalXpFor(i);
  }

  return xx;
};

const rankOfUser = (data, userID) => {
  let array = [];

  Object.keys(data).forEach((user) => {
    array.push({ userID: user, xp: data[user] });
  });

  array = array.sort((a, b) => b.xp - a.xp);

  return array.findIndex((d) => d.userID === userID) + 1 || "Not ranked";
};

const checkwords = (message, bot) => {
  if (!bot.utils.guildsXp[message.guild.id]) {
    bot.utils.guildsXp[message.guild.id] = {};
  }

  if (!bot.utils.guildsXp[message.guild.id][message.author.id]) {
    bot.utils.guildsXp[message.guild.id][message.author.id] = {
      xp: 0,
      lastWords: [],
      counter: 0,
      channelID: message.channel.id,
    };
  }

  bot.utils.guildsXp[message.guild.id][message.author.id].channelID =
    message.channel.id;

  let words = message.content.split(" ");
  let awords =
    bot.utils.guildsXp[message.guild.id][message.author.id].lastWords || [];
  let ext = awords.filter((word) => words.includes(word));

  bot.utils.guildsXp[message.guild.id][message.author.id].lastWords =
    words.concat(awords);
  if (ext.length > 0)
    return bot.utils.guildsXp[message.guild.id][message.author.id];
  if (bot.utils.guildsXp[message.guild.id][message.author.id].counter > 4) {
    bot.utils.guildsXp[message.guild.id][message.author.id].lastWords = [];
    bot.utils.guildsXp[message.guild.id][message.author.id].counter = 0;
    bot.utils.guildsXp[message.guild.id][message.author.id].xp++;
  }
  bot.utils.guildsXp[message.guild.id][message.author.id].counter++;

  return bot.utils.guildsXp[message.guild.id][message.author.id];
};

const checkvoice = (guild, member, channel, bot) => {
  if (!bot.utils.guildsVoiceXp[guild.id]) {
    bot.utils.guildsVoiceXp[guild.id] = {};
  }

  if (!bot.utils.guildsVoiceXp[guild.id][member.id]) {
    bot.utils.guildsVoiceXp[guild.id][member.id] = {
      xp: 0,
      channelID: channel.id,
    };
  }

  bot.utils.guildsVoiceXp[guild.id][member.id].channelID = channel.id;
  bot.utils.guildsVoiceXp[guild.id][member.id].xp++;

  return bot.utils.guildsVoiceXp[guild.id][member.id];
};

async function drawTasks(ctx, tasks, userData, dd) {
  let i = 0;
  for (const taskId in tasks) {
    const task = tasks[taskId];

    ctx.textAlign = "start";
    ctx.fillStyle = "white";
    ctx.font = `500 14px "Montserrat-Arabic"`;
    ctx.fillText(
      `${++i}. ${task.content}`,
      task.x,
      !task.done &&
        tasks.length !== 1 &&
        tasks.length === tasks.indexOf(task) + 1
        ? task.z - 15
        : task.z
    );

    if (!task.done) {
      let progress = 0;
      if (task.type === "voice") {
        if (!userData.voiceJoined) {
          progress = 0;
        } else {
          const targetMs = task.target * 60 * 60 * 1000;
          const spentMs = Date.now() - userData.voiceJoined;

          const progressRatio = Math.min(spentMs / targetMs, 1);
          progress = progressRatio * 250;
        }
      } else if (task.type === "messages") {
        progress =
          Math.min(dd.messages[userData.userId] / task.target, 1) * 250;
      } else if (task.type === "text") {
        progress = Math.min(dd.dataDay[userData.userId] / task.target, 1) * 250;
      }

      if (task.type !== "random") {
        ctx.fillStyle = "rgba(128,221,255,0.5019607843137255)";
        roundRect(ctx, task.x, task.z + 15, 250, 10, 7);
        ctx.fill();

        if (progress !== 0) {
          ctx.fillStyle = "#80ddfc";
          roundRect(ctx, task.x, task.z + 15, progress, 10, 7);
          ctx.fill();
        }
      }
    }
  }
}

function drawRoundedBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  if (height === 0) return;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawMixedTextWithShadow(
  ctx,
  x,
  y,
  part1,
  part2,
  font1,
  font2,
  color = "#fff",
  shadow = {}
) {
  const {
    color: sc = "rgba(0,0,0,0.2)",
    offsetX = 0,
    offsetY = 4,
    blur = 4,
  } = shadow;

  ctx.save();

  ctx.shadowColor = sc;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
  ctx.shadowBlur = blur;

  ctx.font = font1;
  ctx.fillStyle = color;
  ctx.fillText(part1, x, y);

  const width1 = ctx.measureText(part1).width;
  ctx.font = font2;
  ctx.fillText(part2, x + width1, y);

  ctx.restore();
}

function drawCircleImage(ctx, img, x, y, width, height) {
  ctx.save();

  ctx.beginPath();
  ctx.ellipse(
    x + width / 2,
    y + height / 2,
    width / 2,
    height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, x, y, width, height);

  ctx.restore();
}

function drawCenteredText(
  ctx,
  text,
  centerX,
  centerY,
  font = "700 46px Montserrat"
) {
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight =
    textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

  const x = centerX - textWidth / 2;
  const y = centerY - textHeight / 2;

  ctx.fillText(text, x, y);
}

function socketEmitAsync(event, data, client) {
  return new Promise((resolve, reject) => {
    client.socket.emit(event, data, (response) => {
      if (response === null) return reject(new Error("No data returned"));
      resolve(response);
    });
  });
}

module.exports = {
  drawTasks,
  drawCenteredText,
  drawRoundedBox,
  roundRect,
  drawMixedTextWithShadow,
  drawCircleImage,
  getLevel,
  getXpFor,
  checkwords,
  rankOfUser,
  checkvoice,
  socketEmitAsync,
};
