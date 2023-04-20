import {
	AttachmentBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} from 'discord.js';

import { get, post, getImage } from './api.js';
import { think } from './think.js';

const base_url = "http://localhost:3000";
const api_url = `${base_url}/api`;
const logo_link = 'https://imgur.com/CnIXvy6.png';
const brand_color = '#1c6bb0';

const BUTTON_LIMIT = 5;

const DB_ID = 3;
// 1 - sample
// 2 - auction house
// 3 - postgres_local

const urls = {
	metabot: `${api_url}/metabot/database/${DB_ID}`,
	search: `${api_url}/search?q=`,
	viz: `${api_url}/pulse/preview_card_png/`,
	card: `${api_url}/card`,
  dataset: `${api_url}/dataset`,
};


function makeLinkButton(item) {
	return new ButtonBuilder()
		.setURL(`${base_url}/question/${item.id}`)
		.setLabel(item.name)
		.setStyle(ButtonStyle.Link);
}

async function saveCard(item) {
	const savedCard = await post(urls.card, {
		...item.card,
		collection_id: 14,
	});

	const button = new ButtonBuilder()
		.setURL(`${base_url}/question/${savedCard.id}`)
		.setLabel(item.card.name)
		.setStyle(ButtonStyle.Link);

  return [ savedCard, button ];
}



async function search(query) {
	const results = await get(`${urls.search}${query}&limit=10`);

	return results.data
		.filter((result) => ['card', 'dataset'].includes(result.model))
		.map((result) => ({ name: result.name, id: result.id }));
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
  const results = await search(query);

  const buttons = results.slice(0,BUTTON_LIMIT).map(makeLinkButton);
  const row = new ActionRowBuilder().addComponents(...buttons);

  const embed = makeEmbed()
    .setDescription(`searching for ${query}`)
    .setFooter({ text: `Found ${results.length} results` });

  await interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}

export async function handleViz(interaction) {
  const id = interaction.options.getInteger('id');
  const search = interaction.options.getString('search');

  const embed = makeEmbed()
    .setDescription(`visualizing`);

  if (!id && !search) {
    embed.addFields({ name: 'Error', value: 'Please provide a search or id' });
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (id) {
    embed.setDescription(`visualizing question ${id}`);
    const vizImage = await getImage(`${urls.viz}${id}`);
    const imageName = `${id}.png`;
    const image = new AttachmentBuilder(Buffer.from(vizImage), { name: imageName });
    embed.setImage(`attachment://${imageName}`);
    await interaction.editReply({ embeds: [embed], files: [image] });
  }

}



export async function handleAsk(interaction) {
  const question = interaction.options.getString('question');

  let embed = makeEmbed()
    .setDescription(`wondering ${question}`)
    .setFooter({ text: 'metabot is thinking' });

  try {
    await interaction.editReply({ embeds: [embed] });

    const thinkingTimer = setInterval(async () =>{
      const thought = think();
      embed.setFooter({ text: thought });
      await interaction.editReply({ embeds: [embed] });
    }, 2000)

    const result = await post(urls.metabot , { question });

    clearInterval(thinkingTimer);

    embed.setFooter(null);

    let image = null; // eww

    if (result?.card) {
      const dataResults = await post(urls.dataset, {
        parameters: [],
        ...result.card.dataset_query,
      });
      const [savedCard, metabotButton ] = await saveCard(result);
      const metabotRow = new ActionRowBuilder().addComponents(metabotButton);

      const hasResults = dataResults?.data?.rows?.length > 0;
      const hasSingleResult = hasResults &&
        dataResults?.data?.rows?.length === 1 && dataResults?.data?.cols?.length === 1;


      if (hasSingleResult) {
        const { rows, cols } = dataResults.data;
        const label = String(cols[0].display_name ?? 'Result');
        const value = String(rows[0][0] ?? '??');

        embed.addFields({ name: label, value: value });
      } else if (savedCard?.id) {
        const vizImage = await getImage(`${urls.viz}${savedCard.id}`);
        image = new AttachmentBuilder(Buffer.from(vizImage), `${savedCard.id}.png`);
        console.log(vizImage, image)
        embed.setImage(image);
      }

      await interaction.editReply({
        embeds: [embed],
        components: [metabotRow],
      });
    } else if (result?.message) {
      embed.addFields({ name: 'Error', value: result.message});
    } else {
      embed.addFields({ name: 'Error', value: 'metabot is confused'});
    }
  } catch (error) {
    console.error(error);
    embed.addFields({ name: 'Error', value: 'metabot is confused'});
  }

  const responsePayload = { embeds: [embed] };
  if (image) {
    responsePayload.files = [image];
  }
  await interaction.editReply(responsePayload);
};
