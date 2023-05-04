export const base_url = "http://localhost:3000";
export const api_url = `${base_url}/api`;
export const logo_link = 'https://imgur.com/CnIXvy6.png';
export const brand_color = '#1c6bb0';

export const RESULT_LIMIT = 5;

// 1 - sample
// 2 - auction house
// 3 - postgres_local
export const DB_ID = 3;

export const urls = {
	metabot: `${api_url}/metabot/database/${DB_ID}`,
	search: `${api_url}/search?q=`,
	viz: `${api_url}/pulse/preview_card_png/`,
	card: `${api_url}/card`,
  dataset: `${api_url}/dataset`,
};
