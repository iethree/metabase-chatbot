## Metabase Chatbot

A plugin to hook into Metabase's API that allows users to
1) ask questions of Metabot's AI
2) search for existing questions
3) view visualizations of existing questions

all without ever leaving their chat client.

## Commands

`npm run dev:discord` run the discord bot app
`npm run dev:slack` run the slack bot app

## Setup

you need a .env file with these values populated

```
client_id=
client_secret=
discord_bot_token=
slack_bot_token=
metabase_session=
slack_bot_app_token=
```