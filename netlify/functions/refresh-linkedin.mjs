/* Scheduled daily. Pulls the Georgia Civil company page's recent posts from the
   LinkedIn Posts API, normalizes them, and caches them in the "linkedin" blob
   store for linkedin-news.mjs to serve.

   Required environment variables (set in Netlify → Site settings → Environment):
     LINKEDIN_ACCESS_TOKEN  OAuth 2.0 access token with r_organization_social
     LINKEDIN_ORG_ID        numeric organization id (from urn:li:organization:<id>)
     LINKEDIN_API_VERSION   optional, e.g. "202506" (defaults below)

   If credentials are absent the function no-ops, so deploying before LinkedIn
   approval comes through does no harm — the site keeps using the seed file. */

import { getStore } from '@netlify/blobs';

const PAGE = 'https://www.linkedin.com/company/georgia-civil-inc-/';

const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export default async () => {
  const TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
  const ORG = process.env.LINKEDIN_ORG_ID;
  const VER = process.env.LINKEDIN_API_VERSION || '202506';

  if (!TOKEN || !ORG) {
    console.log('refresh-linkedin: credentials missing — skipping (seed file stays in use).');
    return new Response('skipped: missing credentials', { status: 200 });
  }

  const author = encodeURIComponent(`urn:li:organization:${ORG}`);
  const url = `https://api.linkedin.com/rest/posts?author=${author}&q=author&count=25&sortBy=LAST_MODIFIED`;

  let data;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'LinkedIn-Version': VER,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    if (!res.ok) {
      console.error('refresh-linkedin: LinkedIn API', res.status, await res.text());
      // Return 200 so a transient API/token issue doesn't spam schedule failures;
      // the last good cache stays in place.
      return new Response(`linkedin error ${res.status}`, { status: 200 });
    }
    data = await res.json();
  } catch (err) {
    console.error('refresh-linkedin: fetch failed —', err);
    return new Response('fetch failed', { status: 200 });
  }

  const elements = Array.isArray(data.elements) ? data.elements : [];
  const posts = elements
    .filter((el) => (el.commentary || '').trim())
    .map((el) => {
      const text = el.commentary.trim();
      const firstLine = (text.split('\n').find((l) => l.trim()) || text).trim();
      const rest = text.slice(firstLine.length).trim();
      return {
        date: new Date(el.createdAt || el.publishedAt || Date.now()).toISOString(),
        title: trunc(firstLine, 80),
        blurb: trunc(rest || text, 160),
        // Company page is the reliable link target. To deep-link individual
        // posts instead, swap in: `https://www.linkedin.com/feed/update/${el.id}`
        // (verify the URN resolves publicly before relying on it).
        url: PAGE,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  try {
    const store = getStore('linkedin');
    await store.set('posts', JSON.stringify(posts));
  } catch (err) {
    console.error('refresh-linkedin: blob write failed —', err);
    return new Response('blob write failed', { status: 500 });
  }

  console.log(`refresh-linkedin: cached ${posts.length} posts.`);
  return new Response(`ok: ${posts.length} posts`, { status: 200 });
};

// Runs once a day. Adjust with standard cron, e.g. '0 12 * * *' for noon UTC.
export const config = { schedule: '@daily' };
