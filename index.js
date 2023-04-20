import 'dotenv/config';
import {
	Client,
	GatewayIntentBits,
} from 'discord.js';

import { handleSearch, handleAsk, handleViz } from './commandHandler.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

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
		default:
			await interaction.editReply('Unknown command');
			break;
	}
});

await client.login(process.env.bot_token);
