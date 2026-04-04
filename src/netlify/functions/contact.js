async function verifyTurnstile(token) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token })
  });
  const data = await res.json();
  return data.success;
}

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
    const { fullName, email, phone, interest, message, website_url_confirm, turnstileToken } = JSON.parse(event.body);

    // Honeypot — bots fill this hidden field, real users don't
    if (website_url_confirm) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Cloudflare Turnstile verification
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }) };
    }

    if (!fullName || !email || !interest) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Full name, email, and interest are required.' }) };
    }

    const spaceIdx = fullName.trim().indexOf(' ');
    const first = spaceIdx > 0 ? fullName.trim().substring(0, spaceIdx) : fullName.trim();
    const last = spaceIdx > 0 ? fullName.trim().substring(spaceIdx + 1) : '';

    // Add person to Breeze
    const fields = [
      { field_id: process.env.BREEZE_EMAIL_FIELD_ID, field_type: 'email', response: true, details: { address: email } },
      ...(phone ? [{ field_id: process.env.BREEZE_PHONE_FIELD_ID, field_type: 'phone', response: true, details: { phone_mobile: phone } }] : [])
    ];
    const person = await breezeRequest('people/add', { first, last, fields_json: JSON.stringify(fields) });

    // Assign "Contact Form" tag
    await breezeRequest('tags/assign', { person_id: person.id, tag_id: process.env.BREEZE_TAG_CONTACT });

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
          to: ['admin@christchurchbluffton.org'],
          subject: `New Contact Form — ${fullName}`,
          text: `New contact form submission:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || '(none)'}\nInterest: ${interest}\nMessage: ${message || '(none)'}`
        })
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[Contact] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
