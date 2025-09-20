const { SlashCommandBuilder } = require("@discordjs/builders");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("View the server top list and see who’s on top.")
    .addStringOption((option) =>
      option
        .setName("range")
        .setDescription("Show the top list with a specific time range.")
        .setRequired(false)
        .addChoices(
          { name: "daily", value: "dataDay" },
          { name: "weekly", value: "dataWeek" },
          { name: "monthly", value: "dataMonth" }
        )
    ),
  async execute(client, interaction, token) {
    const range = interaction.options.getString("range")
      ? interaction.options.getString("range")
      : "data";

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

    Object.keys(dd[range]).forEach((user) => {
      arr.push({
        userId: user,
        xp: dd[range][user],
      });
    });

    arr = arr.sort((a, b) => b.xp - a.xp);
    let sliced = arr.slice(0, 10);

    let str = ``;

    for (let dat of sliced) {
      if (dat.userId === interaction.user.id) {
        str =
          str +
          "\n" +
          `**#${client.utils.rankOfUser(dd[range], dat.userId)} | <@!${
            dat.userId
          }> XP: \`${dat.xp}\`\ **`;
      } else {
        str =
          str +
          "\n" +
          `#${client.utils.rankOfUser(dd[range], dat.userId)} | <@!${
            dat.userId
          }> XP: \`${dat.xp}\`\ `;
      }
    }

    if (!sliced.find((d) => d.userId === interaction.user.id)) {
      if (arr.find((d) => d.userId === interaction.user.id)) {
        str =
          str +
          "\n" +
          `**#${client.utils.rankOfUser(dd[range], interaction.user.id)} | <@!${
            interaction.user.id
          }> XP: \`${dat.xp}\`\  **`;
      }
    }

    interaction.editReply({
      embeds: [
        {
          color: 0x57f287,
          author: {
            name: "📋 Guild Score Top List",
            icon_url: interaction.channel.guild.iconURL,
          },
          fields: [
            {
              name:
                range === "dataDay"
                  ? `TOP 10 DAY XP :bookmark_tabs:`
                  : range === "dataWeek"
                  ? `TOP 10 WEEK XP :bookmark_tabs:`
                  : range === "dataMonth"
                  ? `TOP 10 MONTH XP :bookmark_tabs:`
                  : `TOP 10 XP :bookmark_tabs:`,
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
