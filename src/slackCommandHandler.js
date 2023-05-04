import { search, fetchViz, getQuestion, askMetabot } from "./common.js";
import { base_url, brand_color } from "./constants.js";

const makeSearchResult = (item, imageUrl) => {
  return ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*<${base_url}/question/${item.id}|${item.display_name ?? item.name}>*`,
    },
    accessory: {
      type: "image",
      image_url: imageUrl ?? 'https://media.tenor.com/yheo1GGu3FwAAAAd/rick-roll-rick-ashley.gif',
      alt_text: "Question thumbnail"
    }
  });
};

const makeTextBlock = (text) => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text,
  },
});

export async function handleSearch({ command, respond, say, client }) {
  const query = command.text;
  respond('Searching...');
  const searchResults = await search(query);

  const searchResultBlocks = await Promise.all(
    searchResults.map(async (result) => {
      const url = await uploadImage(result.id, client);
      return makeSearchResult(result, url);
    })
  );

  await say({
    blocks: [makeTextBlock(`Search results for *${query}*`)],
    attachments: [{ color: brand_color, blocks: searchResultBlocks }],
  });
}

async function uploadImage(questionId, client) {
  const imageBlob = await fetchViz(questionId);

  const uploadResult = await client.files.uploadV2({
    channel_id: 'C0JPMM6RF', // slack_files channel
    file: imageBlob,
    filename: `${questionId}.png`,
  });

  // const publicResult = await client.files.sharedPublicURL({ file: id });
  // console.log('public result', publicResult.file)

  const url = uploadResult.files[0].file.url_private;
  console.log('image url', url);

  return url;
}

export async function handleViz({ command, respond, say, client }) {
  await respond('Finding visualization...');

  const query = command.text.trim();
  const isNumber = /^\d+$/.test(query);

  if (isNumber) {
    const question = await getQuestion(query);
    const url = await uploadImage(query, client);

    const name = `${question.name}`;

    await say({
      text: `*${name}*\n`,
      attachments: [
        {
          color: brand_color,
          blocks: [makeSearchResult({
            id: query,
            display_name: name,
          }, url)]
        }
      ]
    });
    return
  }

  const result = await search(query, 1);

  if (result.length === 0) {
    await respond(`No results found for ${query}`);
    return;
  }

  const url = await uploadImage(result[0].id, client);

  const name = `${result[0].name}`;
  const id = result[0].id;

  await say({
    text: `Top result for ${query}`,
    attachments: [
      {
        color: brand_color,
        blocks: [makeSearchResult({
          id: id,
          display_name: name,
        }, url)]
      }
    ]
  });

}

export async function handleAsk({ command, respond, say, client }) {
  const question = command.text;

  await respond(`Metabot is thinking about ${question.replaceAll('?', '')} ...`);

  const result = await askMetabot(question);

  if (!result.savedCard) {
    await respond(result ?? 'Metabot is confused 😞');
    return;
  }

  const {
    savedCard,
    dataResults,
    image: imageBlob,
    imageName,
  } = result;

  const url = await uploadImage(savedCard.id, client);

  const name = savedCard.display_name ?? savedCard.name;

  await say({
    text: `You asked: ${question}`,
    attachments: [
      {
        color: brand_color,
        blocks: [makeSearchResult({
          id: savedCard.id,
          display_name: name,
        }, url)]
      }
    ]
  });

}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}