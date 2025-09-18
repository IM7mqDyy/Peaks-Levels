const { SlashCommandBuilder } = require("@discordjs/builders");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server leaderboard and see who’s on top."),
  async execute(client, interaction, token) {
    await interaction.deferReply();

    let dd = await client.guildsSchema.findOne({
      guildId: interaction.guild.id,
    });
    if (!dd)
      return interaction.editReply({
        embeds: [
          {
            color: "RED",
            title: "I can't find this guild please contact with support.",
          },
        ],
      });

    let arr = [];

    Object.keys(dd["data"]).forEach((user) => {
      arr.push({
        userId: user,
        lv: client.utils.getLevel(dd["data"][user]).level.i || 0,
        messages: dd.messagesLeaderboard[user] || 0,
        voice: dd.voice[user] || "0m",
      });
    });

    arr = arr.sort((a, b) => b.lv - a.lv);
    let sliced = arr.slice(0, 10);

    let str = ``;

    for (let dat of sliced) {
      if (dat.userId === interaction.user.id) {
        str =
          str +
          "\n" +
          `**#${client.utils.rankOfUser(dd["data"], dat.userId)} | <@!${
            dat.userId
          }> LV: \`${dat.lv}\`\ | Messages: \`${
            dat.messages
          }\`\ | Voice: \`${ms(dat.voice)}\`\ **`;
      } else {
        str =
          str +
          "\n" +
          `#${client.utils.rankOfUser(dd["data"], dat.userId)} | <@!${
            dat.userId
          }> LV: \`${dat.lv}\`\ | Messages: \`${
            dat.messages
          }\`\ | Voice: \`${ms(dat.voice)}\`\  `;
      }
    }

    if (!sliced.find((d) => d.userId === interaction.user.id)) {
      if (arr.find((d) => d.userId === interaction.user.id)) {
        str =
          str +
          "\n" +
          `**#${client.utils.rankOfUser(
            dd["data"],
            interaction.user.id
          )} | <@!${interaction.user.id}> LV: \`${
            arr.find((d) => d.userId === interaction.user.id).lv
          }\`\ | Messages: \`${
            arr.find((d) => d.userId === interaction.user.id).messages
          }\`\ | Voice: \`${ms(
            arr.find((d) => d.userId === interaction.user.id).voice
          )}\`\  **`;
      }
    }

    interaction.editReply({
      embeds: [
        {
          color: 0x57f287,
          author: {
            name: "📋 Guild Score Leaderboards",
            icon_url: interaction.channel.guild.iconURL,
          },
          fields: [
            {
              name: "TOP 10 MEMBERS :bookmark_tabs:",
              value: `${str}`,
            },
          ],
          timestamp: new Date(),
          footer: {
            text: interaction.user.username,
            icon_url: interaction.user.avatarURL(),
          },
        },
      ],
    });
  },
};
