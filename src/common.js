import { get, post, getImage } from './utils/api.js';

import { urls, RESULT_LIMIT } from './constants.js';

export async function search(query, limit = RESULT_LIMIT) {
	const results = await get(`${urls.search}${query}&limit=5`);

	return results.data
		.filter((result) => ['card', 'dataset'].includes(result.model))
		.map((result) => ({
      id: result.id,
      name: result.name,
      detail: result.description ?? result.collection.name ?? result.model,
    })).slice(0, limit);
}

export async function getQuestion(questionID) {
  return get(`${urls.card}/${questionID}`);
}

export async function fetchViz(questionID) {
  return Buffer.from(await getImage(`${urls.viz}${questionID}?include-title=0`));
}

export async function saveCard(card) {
	const savedCard = await post(urls.card, {
		...card,
		collection_id: 14,
	});

  return savedCard;
}

export async function askMetabot(question) {
  const result = await post(urls.metabot, { question });

  if (result.card) {
    const dataResults = await getData(
      result.card.dataset_query
    );

    const savedCard = await saveCard(result.card);
    const image = await fetchViz(savedCard.id);
    const imageName = `${savedCard.id}.png`;

    return {
      savedCard,
      image,
      imageName,
      dataResults,
    };
  }

  return result?.message;
}

export async function getData(dataset_query) {
  return post(urls.dataset, {
    parameters: [],
    ...dataset_query,
  });
}
