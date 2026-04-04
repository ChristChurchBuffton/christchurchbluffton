async function breezeRequest(endpoint, params) {
  const url = new URL(endpoint, process.env.BREEZE_URL + '/');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Api-Key': process.env.BREEZE_API_KEY }
  });
  if (!res.ok) throw new Error(`Breeze API ${res.status}: ${await res.text()}`);
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { name, prayer, website_url_confirm } = JSON.parse(event.body);

    // Honeypot — bots fill this hidden field, real users don't
    if (website_url_confirm) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (!prayer) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prayer text is required.' }) };
    }

    const displayName = (name && name.trim()) ? name.trim() : 'Anonymous';
    const spaceIdx = displayName.indexOf(' ');
    const first = spaceIdx > 0 ? displayName.substring(0, spaceIdx) : displayName;
    const last = spaceIdx > 0 ? displayName.substring(spaceIdx + 1) : '(Prayer Request)';

    // Add person to Breeze
    const person = await breezeRequest('people/add', { first, last });

    // Assign "Prayer Request" tag
    await breezeRequest('tags/assign', { person_id: person.id, tag_id: process.env.BREEZE_TAG_PRAYER });

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
          to: ['jonathan@christchurchbluffton.org', 'admin@christchurchbluffton.org'],
          subject: `New Prayer Request — ${name || 'Anonymous'}`,
          text: `New prayer request:\n\nName: ${name || 'Anonymous'}\nPrayer: ${prayer}`
        })
      });
    }

    // Always return success (pastoral UX)
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[Prayer] Error:', err.message);
    // Still return success — pastoral UX
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
};
