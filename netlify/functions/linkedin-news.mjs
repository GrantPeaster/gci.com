/* Serves the cached LinkedIn posts to the site front-end.
   Reads whatever the scheduled refresh-linkedin function last wrote to the
   "linkedin" blob store. Returns [] on any problem so the site quietly falls
   back to assets/data/news.json. Reached at /.netlify/functions/linkedin-news */

import { getStore } from '@netlify/blobs';

export default async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // 5-minute edge cache
  };
  try {
    const store = getStore('linkedin');
    const raw = await store.get('posts'); // stored as a JSON string
    const posts = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify(posts), { headers });
  } catch (err) {
    console.error('linkedin-news: could not read cache —', err);
    return new Response('[]', { headers });
  }
};
