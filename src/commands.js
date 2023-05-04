import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'ask',
    description: 'Replies with an answer',
    options: [{
      name: 'question',
      description: 'The question to ask',
      type: 3, // STRING
      required: true,
    }]
  },
  {
    name: 'viz',
    description: 'Replies with a visualization',
    options: [{
      name: 'search',
      description: 'search for a question',
      type: 3, // STRING
      required: false,
    }, {
      name: 'id',
      description: 'The ID of the question to visualize',
      type: 4, // INTEGER
      required: false,
    }]
  },
  {
    name: 'search',
    description: 'Finds an existing question',
    options: [{
      name: 'query',
      description: 'What do you want to find?',
      type: 3, // STRING
      required: true,
    }]
  },
  {
    name: 'metabase',
    description: 'Ask a question, search for stuff, find a viz, it\'s up to you!',
    options: [{
      name: 'query',
      description: 'What do you want?',
      type: 3, // STRING
      required: true,
    }]
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.discord_bot_token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.client_id), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();