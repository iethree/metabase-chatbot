import 'dotenv/config';
import {
	Client,
	GatewayIntentBits,
} from 'discord.js';

import {
  handleSearch,
  handleAsk,
  handleViz,
	handleOmni,
} from './discordCommandHandler.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

	try {
		switch(interaction.commandName) {
			case 'search':
				await handleSearch(interaction);
				break;
			case 'ask':
				await handleAsk(interaction);
				break;
			case 'viz':
				await handleViz(interaction);
				break;
			case 'metabase':
				await handleOmni(interaction);
				break;
			default:
				await interaction.editReply('Unknown command');
				break;
		}
	} catch (error) {
		console.error(error);
		await interaction.editReply({
			content: 'There was an error while executing this command!',
			ephemeral: true
		});
	}
});

await client.login(process.env.discord_bot_token);
