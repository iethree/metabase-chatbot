import fetch from 'node-fetch';

const headers = {
	'Content-Type': 'application/json',
	Cookie: `metabase.SESSION=${process.env.metabase_session}`,
};

export function post(url, body) {
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).then((res) => res.json());
}

export function get(url) {
  return fetch(url, {
    headers,
  }).then((res) => res.json());
}

export async function getImage(url) {
  return fetch(url, {
    headers,
  }).then((res) => res.arrayBuffer())
}