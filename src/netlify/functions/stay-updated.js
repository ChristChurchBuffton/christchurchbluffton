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
    const { email, website_url_confirm } = JSON.parse(event.body);

    // Honeypot — bots fill this hidden field, real users don't
    if (website_url_confirm) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required.' }) };
    }

    const prefix = email.split('@')[0];
    const first = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const last = '(Stay Updated)';

    // Add person to Breeze
    const fields = [
      { field_id: process.env.BREEZE_EMAIL_FIELD_ID, field_type: 'email', response: true, details: { address: email } }
    ];
    const person = await breezeRequest('people/add', { first, last, fields_json: JSON.stringify(fields) });

    // Assign "Stay Updated" tag
    await breezeRequest('tags/assign', { person_id: person.id, tag_id: process.env.BREEZE_TAG_STAYUPDATED });

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
          to: ['admin@christchurchbluffton.org'],
          subject: `New Stay Updated Signup — ${email}`,
          text: `New stay updated signup:\n\nEmail: ${email}`
        })
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[Stay Updated] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
