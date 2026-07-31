/* Georgia Civil — Contact form handler
   Receives a JSON POST from contact.html, validates it, routes to the
   correct recipients based on discipline, and sends via Resend.

   Environment variables required (set in Netlify UI → Site → Environment):
     RESEND_API_KEY   — from resend.com/api-keys
     FROM_EMAIL       — verified sender address, e.g. hello@georgiacivil.com
                        (must be from a domain verified in your Resend account)

   Reached at /.netlify/functions/contact
   ─────────────────────────────────────────────────────────────────────────── */

const ROUTING = {
  'Land Planning':     ['todd@georgiacivil.com', 'chelsea@georgiacivil.com'],
  'Civil Engineering': ['jason@georgiacivil.com', 'chelsea@georgiacivil.com'],
  'Land Surveying':    ['brandon@georgiacivil.com', 'stephanie@georgiacivil.com'],
};

const FALLBACK = ['chelsea@georgiacivil.com'];

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default async (req) => {
  /* Preflight */
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')    return json({ success: false, message: 'Method not allowed' }, 405);

  /* Parse body */
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  const { name, email, phone, location, message, discipline } = body;

  /* Basic server-side validation */
  if (!name?.trim())    return json({ success: false, message: 'Name is required' }, 400);
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                        return json({ success: false, message: 'Valid email is required' }, 400);
  if (!message?.trim()) return json({ success: false, message: 'Message is required' }, 400);

  /* Route to the right recipients */
  const to = ROUTING[discipline] ?? FALLBACK;

  /* Build email */
  const subject = `New inquiry — ${discipline || 'General'} — Georgia Civil`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;color:#020534">
      <div style="background:#CA2131;padding:24px 32px">
        <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#fff">
          Georgia Civil — New Inquiry
        </span>
      </div>
      <div style="padding:32px;border:1px solid #e2e0db;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
          <tr><td style="padding:8px 0;width:140px;color:#787878;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Discipline</td>
              <td style="padding:8px 0"><strong>${esc(discipline || 'Not specified')}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#787878;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Name</td>
              <td style="padding:8px 0">${esc(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#787878;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Email</td>
              <td style="padding:8px 0"><a href="mailto:${esc(email)}" style="color:#CA2131">${esc(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#787878;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Phone</td>
              <td style="padding:8px 0"><a href="tel:${esc(phone)}" style="color:#CA2131">${esc(phone)}</a></td></tr>` : ''}
          ${location ? `<tr><td style="padding:8px 0;color:#787878;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Project Location</td>
              <td style="padding:8px 0">${esc(location)}</td></tr>` : ''}
        </table>
        <hr style="border:none;border-top:1px solid #e2e0db;margin:24px 0">
        <div style="font-size:15px;line-height:1.7;white-space:pre-wrap">${esc(message)}</div>
        <hr style="border:none;border-top:1px solid #e2e0db;margin:24px 0">
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#787878;margin:0">
          Sent via georgiacivil.com contact form · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET
        </p>
      </div>
    </div>`;

  /* Resend API call */
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.FROM_EMAIL ?? 'hello@georgiacivil.com';

  if (!apiKey) {
    console.error('contact: RESEND_API_KEY not set');
    return json({ success: false, message: 'Server configuration error' }, 500);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject,
        html,
      }),
    });

    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('contact: Resend error', res.status, out);
      return json({ success: false, message: 'Failed to send — please call us directly.' }, 502);
    }

    return json({ success: true });
  } catch (err) {
    console.error('contact: fetch error', err);
    return json({ success: false, message: 'Network error — please call us directly.' }, 500);
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const config = { path: '/contact' };
