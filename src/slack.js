import 'dotenv/config';

import bolt from '@slack/bolt';

import {
  handleSearch,
  handleAsk,
  handleViz,
} from './slackCommandHandler.js'

const app = new bolt.App({
  token: process.env.slack_bot_token,
  appToken: process.env.slack_bot_app_token,
  socketMode: true,
});

/* Add functionality here */

(async () => {
  // Start the app
  await app.start();
  console.log('⚡️ Slack Bolt app is running!');
})();

app.command('/ask', async ({ command, ack, respond, say, client }) => {
  await ack();

  await handleAsk({ command, respond, say, client });
});

app.command('/viz', async ({ command, ack, respond, say, client }) => {
  await ack();

  await handleViz({ command, respond, say, client });
});

app.command('/find', async ({ command, ack, respond, say, client }) => {
  await ack();

  await handleSearch({ command, respond, say, client });
});

app.command('/metabase', async ({ command, ack, respond, say, client }) => {
  await ack();

  const query = command.text.trim();
  const isNumber = /^\d+$/.test(query);

  if (isNumber) {
    await handleViz({ command, respond, say, client });
    return;
  }

  if (query.includes('?')) {
    await handleAsk({ command, respond, say, client });
    return;
  }

  await handleSearch({ command, respond, say, client });
});
