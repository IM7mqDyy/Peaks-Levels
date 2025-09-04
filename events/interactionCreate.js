module.exports = {
    name: "interactionCreate",
    async execute(client, commands, interaction) {
      if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
  
        if (!command) return;
  
        try {
          await command.execute(client, interaction);
        } catch (error) {
          console.error(error);
          return interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    },
  };
  