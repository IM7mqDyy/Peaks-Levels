const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Canvas = require("canvas");
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your profile")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Select a user to check their profile")
        .setRequired(false)
    ),
  async execute(client, interaction) {
    let user = interaction.options.getMember("user");
    if (!user) user = interaction;

    if (user.user ? user.user.bot : user.bot) return;

    let dd = await client.guildsSchema.findOne({
      guildId: interaction.guild.id,
    });
    if (!dd) return;

    await interaction.deferReply();

    let userData =
      (await client.usersSchema.findOne({
        userId: user.user ? user.user.id : interaction.user.id,
        guildId: interaction.guild.id,
      })) ||
      (await new client.usersSchema({
        _id: new mongoose.Types.ObjectId(),
        userId: user.user ? user.user.id : interaction.user.id,
        guildId: interaction.guild.id,
        tasks: client.utils.levels.generateTasks(client),
      }).save());

    const xp = dd["data"][user.user.id] || 0;
    const data = client.utils.getLevel(xp);

    const tasks = userData.tasks;

    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "Montserrat-Arabic-Medium-500.ttf"),
      {
        family: "Montserrat-Arabic",
        weight: "500",
        style: "normal",
      }
    );

    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "Montserrat-Arabic-Bold-700.ttf"),
      {
        family: "Montserrat-Arabic",
        weight: "700",
        style: "normal",
      }
    );

    Canvas.registerFont(
      path.join(
        __dirname,
        "..",
        "assets",
        "Montserrat-Italic-VariableFont_wght.ttf"
      ),
      {
        family: "Montserrat",
        weight: "100",
        style: "italic",
      }
    );
    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "Montserrat-VariableFont_wght.ttf"),
      {
        family: "Montserrat",
        weight: "100",
        style: "normal",
      }
    );
    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "Montserrat-Medium.ttf"),
      {
        family: "Montserrat",
        weight: "600",
        style: "normal",
      }
    );
    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "Montserrat-Bold.ttf"),
      {
        family: "Montserrat",
        weight: "700",
        style: "normal",
      }
    );
    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "WorkSans-Medium.ttf"),
      {
        family: "WorkSans",
        weight: "500",
        style: "normal",
      }
    );
    Canvas.registerFont(
      path.join(__dirname, "..", "assets", "montserrat-900italic.ttf"),
      {
        family: "Montserrat",
        weight: "900",
        style: "italic",
      }
    );

    const canvas = Canvas.createCanvas(736, 736);
    const ctx = canvas.getContext("2d");

    const bgPath = path.join(__dirname, "..", "assets", "bg.png");
    let bck = await Canvas.loadImage(bgPath);
    ctx.drawImage(bck, 0, 0, 736, 736);

    const avatarURL = user.user.displayAvatarURL({
      extension: "png",
      size: 256,
    });
    const avatar = await Canvas.loadImage(avatarURL);

    ctx.font = "600 31px Montserrat";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(user.user.displayName, 195, 125);

    const barX = 198;
    const barY = 333;
    const barWidth = 448;
    const barHeight = 15;
    const radius = 7;

    const currentXp =
      data.level.i !== 100 ? data.counter.thislvlxp : data.total;
    const maxXp = data.nextlevel.xp || data.total;
    const progressWidth = Math.min((currentXp / maxXp) * barWidth, barWidth);

    ctx.fillStyle = "#80ddfc";
    client.utils.roundRect(
      ctx,
      barX,
      barY,
      currentXp === 0 ? 0 : progressWidth,
      currentXp === 0 ? 0 : barHeight,
      radius
    );
    ctx.fill();

    const textMetrics = ctx.measureText(
      `${data.nextlevel.xp == 0 ? "Max" : data.nextlevel.xp}` +
        `${data.level.i !== 100 ? ` / ${data.counter.thislvlxp}` : data.total}`
    );
    const textWidth = textMetrics.width;
    const textX = barX + barWidth / 2 - textWidth / 2;
    const textY = barY + barHeight / 2 + 7;

    client.utils.drawMixedTextWithShadow(
      ctx,
      textX,
      textY + 3,
      `${data.nextlevel.xp == 0 ? "Max / " : data.nextlevel.xp}`,
      `${data.level.i !== 100 ? ` / ${data.counter.thislvlxp}` : data.total}`,
      "700 30px 'Montserrat'",
      "400 30px 'Montserrat'",
      "#ffffff",
      { color: "rgba(0,0,0,0.4)", offsetX: 0, offsetY: 4, blur: 8 }
    );

    client.utils.drawCircleImage(ctx, avatar, 67, 55, 111, 111);

    ctx.font = "600 11px Montserrat";
    ctx.fillStyle = "#becfe0";
    ctx.fillText(`LVL ${data.level.i}`, 195, 165);

    const text = `@${user.user.username}`;

    const textUsrWidth = ctx.measureText(text).width;
    const padding = 15;

    const usrText = user.user.displayName;
    ctx.font = "600 31px Montserrat";

    const boxW = textUsrWidth + padding;
    const boxH = 22;
    const centerX = 240 + ctx.measureText(usrText).width;
    const centerY = 116;

    ctx.fillStyle = "rgba(27,39,51,0.5019607843137255)";
    client.utils.drawRoundedBox(
      ctx,
      centerX - boxW / 2,
      centerY - boxH / 2,
      boxW,
      boxH,
      5
    );

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#2b4054";
    ctx.stroke();

    ctx.font = "500 13px Montserrat";
    ctx.fillStyle = "#526a81";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY);

    client.utils.drawTasks(ctx, tasks, userData, dd);

    client.utils.drawCenteredText(
      ctx,
      userData.totalMessages,
      355,
      225,
      "700 46px Montserrat"
    );

    client.utils.drawCenteredText(
      ctx,
      `${(userData.voiceTime / 60000).toFixed(1)}`,
      155,
      225,
      "700 46px Montserrat"
    );

    interaction.editReply({
      files: [
        {
          attachment: canvas.toBuffer("image/png"),
          name: "profile.png",
        },
      ],
    });
  },
};
