import {
	AttachmentBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} from 'discord.js';

import { think } from './utils/think.js';

import { base_url, brand_color, logo_link } from './constants.js';
import {
  search,
  fetchViz,
  askMetabot,
  getQuestion,
} from './common.js';

function makeLinkButton(item) {
	return new ButtonBuilder()
		.setURL(`${base_url}/question/${item.id}`)
		.setLabel(item.display_name ?? item.name)
		.setStyle(ButtonStyle.Link);
}

function makeSearchButton(query) {
  return new ButtonBuilder()
    .setURL(`${base_url}/search?q=${query.replace(' ', '+')}`)
    .setLabel(`more results for ${query}`)
    .setStyle(ButtonStyle.Link);
}

export function handleOmni(interaction) {
  const query = interaction.options.getString('query');

  if (query.match(/^[0-9]+$/)) {
    return handleViz(interaction, Number(query));
  }

  if(query.includes('?')) {
    return handleAsk(interaction);
  }

  return handleSearch(interaction);
}

async function makeSearchResult(item) {
  const imageBlob = await fetchViz(item.id);
  const imageName = `${item.id}.png`;
  const image = new AttachmentBuilder(imageBlob, { name: imageName });

  const embed = new EmbedBuilder()
    .setTitle(item.name)
    .setURL(`${base_url}/question/${item.id}`)
    .setColor(brand_color)
    .setDescription(item.detail)
    .setThumbnail(`attachment://${imageName}`);

  return { embed, image };
}

async function makeVizResult(item) {
  const imageBlob = await fetchViz(item.id);
  const imageName = `${item.id}.png`;
  const image = new AttachmentBuilder(imageBlob, { name: imageName });

  const embed = new EmbedBuilder()
    .setTitle(item.name)
    .setURL(`${base_url}/question/${item.id}`)
    .setColor(brand_color)
    .setDescription(item.detail ?? 'Result')
    .setImage(`attachment://${imageName}`);

  return { embed, image };
}

const makeEmbed = () => new EmbedBuilder()
  .setColor(brand_color)
  .setAuthor({
    name: 'MetaBot',
    iconURL: logo_link,
    url: base_url,
  });

export async function handleSearch(interaction) {
  const query = interaction.options.getString('query');
  const searchResults = await search(query);

  const resultData = await Promise.all(
    searchResults.map(makeSearchResult)
  );

  const embeds = resultData.map((result) => result.embed);
  const images = resultData.map((result) => result.image);

  const btn = makeSearchButton(query);
  const metabotRow = new ActionRowBuilder()
    .addComponents(btn);

  await interaction.editReply({
    content: `Found ${searchResults.length} results for **${query}**`,
    components: [metabotRow],
    embeds: embeds,
    files: images,
  });
}

export async function handleViz(interaction, questionId = null) {
  const id = questionId ?? interaction.options.getInteger('id');
  const query = interaction.options.getString('search');

  const embed = makeEmbed()
    .setDescription(`visualizing`);

  if (!id && !query) {
    embed.addFields({ name: 'Error', value: 'Please provide a search or id' });
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (id) {
    const imageBlob = await fetchViz(id);
    const question = await getQuestion(id);
    const imageName = `${id}.png`;
    embed.setImage(`attachment://${imageName}`);
    embed.setTitle(question.name);
    embed.setURL(`${base_url}/question/${id}`);
    embed.setDescription(question.description ?? question?.collection?.name ?? 'Result');
    await interaction.editReply({ embeds: [embed], files: [new AttachmentBuilder(imageBlob, { name: imageName })] });
    return;
  }

  if (query) {
    const result = await search(query, 1);
    if (result.length === 0) {
      embed.addFields({ name: 'Not found', value: `No results found for ${query}` });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const { embed, image } = await makeVizResult(result[0]);
    embed.setDescription(`Top result for *${query}*`);
    await interaction.editReply({ embeds: [embed], files: [image] });
  }

}

export async function handleAsk(interaction) {
  const question =
    interaction.options.getString('question')
     ?? interaction.options.getString('query');

  let embed = makeEmbed()
    .setDescription(`wondering ${question}`)
    .setFooter({ text: `metabot is thinking` });

  let image = null; // eww

  try {
    await interaction.editReply({ embeds: [embed] });

    const thinkingTimer = setInterval(async () =>{
      const thought = think();
      embed.setFooter({ text: thought });
      await interaction.editReply({ embeds: [embed] });
    }, 2000)

    const result = await askMetabot(question);

    clearInterval(thinkingTimer);
    embed.setFooter(null);

    if (!result?.savedCard) {
      embed.addFields({
        name: 'Error',
        value: result ?? 'Metabot is confused 😞'
      });
    } else {

      const {
        savedCard,
        dataResults,
        image: imageBlob,
        imageName,
      } = result;

      const metabotButton = makeLinkButton(savedCard);
      const metabotRow = new ActionRowBuilder()
        .addComponents(metabotButton);

      const hasSingleResult =
        dataResults?.data?.rows?.length === 1 &&
        dataResults?.data?.cols?.length === 1;

      if (hasSingleResult) {
        const { rows, cols } = dataResults.data;
        const label = String(cols[0].display_name ?? 'Result');
        const value = String(rows[0][0] ?? '??');

        embed.addFields({ name: label, value: value });
      } else if (savedCard?.id && imageBlob) {
        image = new AttachmentBuilder(imageBlob, { name: imageName }); // :barf:
        embed.addFields({ name: 'Results', value: savedCard.name });
        embed.setImage(`attachment://${imageName}`);
      }

      await interaction.editReply({
        embeds: [embed],
        components: [metabotRow],
      });
    }
  } catch (error) {
    console.error(error);
    embed.addFields({ name: 'Error', value: 'metabot is confused'});
  }

  const responsePayload = { embeds: [embed] };
  if (image) {
    responsePayload.files = [ image ];
  }
  await interaction.editReply(responsePayload);
};
