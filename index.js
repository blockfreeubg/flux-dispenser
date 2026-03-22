const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const fs = require('fs');
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const app = express();
app.get('/', (req, res) => res.send('Bot is alive'));
app.listen(3000, () => console.log('Web server running'));

function getLinks() {
  if (!fs.existsSync('./links.json')) {
    fs.writeFileSync('./links.json', JSON.stringify({ links: [] }, null, 2));
  }
  const data = fs.readFileSync('./links.json');
  return JSON.parse(data).links;
}

function saveLinks(links) {
  fs.writeFileSync('./links.json', JSON.stringify({ links }, null, 2));
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Send the link panel')
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash command registered');
  } catch (err) {
    console.error(err);
  }
});


client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'panel') {

      const button = new ButtonBuilder()
        .setCustomId('get_link')
        .setLabel('🎁 Get Link')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        content: '**Click the button below to receive a link in your DMs!**',
        components: [row]
      });
    }
  }


  if (interaction.isButton()) {
    if (interaction.customId === 'get_link') {

      let links = getLinks();

      if (links.length === 0) {
        return interaction.reply({
          content: '❌ No links left!',
          ephemeral: true
        });
      }

      const link = links.shift();
      saveLinks(links);

      try {
        await interaction.user.send(`🎉 Here is your link:\n${link}`);

        await interaction.reply({
          content: '📩 Check your DMs!',
          ephemeral: true
        });

      } catch (err) {
        console.log(err);

        links.unshift(link);
        saveLinks(links);

        await interaction.reply({
          content: '❌ I couldn’t DM you. Turn on DMs and try again.',
          ephemeral: true
        });
      }
    }
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
