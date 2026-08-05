async function verifyTurnstile(token) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
    signal: AbortSignal.timeout(10000)
  });
  const data = await res.json();
  return data.success;
}

function fieldRow(label, valueHtml) {
  return `
    <tr><td style="padding:0 0 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background-color:#F5F4EF; border-left:4px solid #c3a355; border-radius:6px; padding:12px 16px;">
          <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#7F6D34;">${label}</div>
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; margin-top:3px; line-height:1.5;">${valueHtml}</div>
        </td></tr>
      </table>
    </td></tr>`;
}

function emailShell(heading, fieldsHtml) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#F5F4EF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4EF; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <tr><td style="background-color:#303b6a; padding:28px 32px 22px;">
          <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#A9B3D6;">Christ Church Bluffton</div>
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#FFFFFF; margin-top:8px;">${heading}</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fieldsHtml}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function breezeRequest(endpoint, params) {
  const url = new URL(endpoint, process.env.BREEZE_URL + '/');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Api-Key': process.env.BREEZE_API_KEY },
    signal: AbortSignal.timeout(10000)
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'A valid email is required.' }) };
    }

    const spaceIdx = fullName.trim().indexOf(' ');
    const first = spaceIdx > 0 ? fullName.trim().substring(0, spaceIdx) : fullName.trim();
    const last = spaceIdx > 0 ? fullName.trim().substring(spaceIdx + 1) : '';

    // Add person to Breeze — failure here shouldn't stop the staff notification email below
    try {
      const fields = [
        { field_id: process.env.BREEZE_EMAIL_FIELD_ID, field_type: 'email', response: true, details: { address: email } },
        ...(phone ? [{ field_id: process.env.BREEZE_PHONE_FIELD_ID, field_type: 'phone', response: true, details: { phone_mobile: phone } }] : [])
      ];
      const person = await breezeRequest('people/add', { first, last, fields_json: JSON.stringify(fields) });

      // Assign "Contact Form" tag
      await breezeRequest('tags/assign', { person_id: person.id, tag_id: process.env.BREEZE_TAG_CONTACT });
    } catch (breezeErr) {
      console.error('[Contact] Breeze error:', breezeErr.message);
    }

    // Add to the admin panel's Subscribers list (Supabase) — best-effort like the Breeze
    // block above. Reuses the first/last split already done for Breeze; this form always
    // collects a real name, unlike the newsletter footer form.
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      try {
        const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/subscribers`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ first_name: first, last_name: last, email, source: 'contact' }),
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) console.error('[Contact] Supabase insert failed:', res.status, await res.text());
      } catch (supabaseErr) {
        console.error('[Contact] Supabase error:', supabaseErr.message);
      }
    }

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      const notifyTo = ['info@christchurchbluffton.org', 'admin@christchurchbluffton.org'];

      const interestLabels = {
        updates: 'Receiving Updates',
        visiting: 'Planning to Visit',
        volunteering: 'Volunteering',
        prayer: 'Prayer Request',
        other: 'Other'
      };

      const fieldsHtml = [
        fieldRow('Name', fullName),
        fieldRow('Email', `<a href="mailto:${email}" style="color:#303b6a;">${email}</a>`),
        fieldRow('Phone', phone || '(none)'),
        fieldRow('Interested In', interestLabels[interest] || interest),
        fieldRow('Message', (message || '(none)').replace(/\n/g, '<br>'))
      ].join('');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Contact Form Submission <notifications@christchurchbluffton.org>',
          to: notifyTo,
          subject: `New Contact Form — ${fullName}`,
          text: `New contact form submission:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || '(none)'}\nInterest: ${interest}\nMessage: ${message || '(none)'}`,
          html: emailShell('Contact Form Submission', fieldsHtml)
        }),
        signal: AbortSignal.timeout(10000)
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[Contact] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
