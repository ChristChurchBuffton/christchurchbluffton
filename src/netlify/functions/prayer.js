async function verifyTurnstile(token) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY_INVISIBLE, response: token }),
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

function replyShell(heading, bodyHtml) {
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
        <tr><td style="padding:28px 32px;">${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { name, email, phone, prayer, website_url_confirm, turnstileToken } = JSON.parse(event.body);

    // Honeypot — bots fill this hidden field, real users don't
    if (website_url_confirm) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (!prayer) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prayer text is required.' }) };
    }

    // Cloudflare Turnstile verification — fail silently (pastoral UX) rather
    // than showing an error, same as the honeypot above
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken))) {
      console.error('[Prayer] Turnstile verification failed');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Add to the admin panel's Prayer Requests log (Supabase) — best-effort, mirrors the
    // Breeze block pattern elsewhere: a failure here shouldn't block the email below or the
    // pastoral "always succeed" response. Name, email, and phone are all optional on this form.
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      try {
        const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/prayer_requests`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            is_anonymous: !name,
            requester_name: name || null,
            email: email || null,
            phone: phone || null,
            request_text: prayer,
            status: 'active',
            submitted_at: new Date().toISOString().slice(0, 10)
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) console.error('[Prayer] Supabase insert failed:', res.status, await res.text());
      } catch (supabaseErr) {
        console.error('[Prayer] Supabase error:', supabaseErr.message);
      }
    }

    // TEMP: staff notification disabled for staging test 2026-08-11 — RESTORE before final push to production
    /*
    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Prayer Request <notifications@christchurchbluffton.org>',
          to: ['admin@christchurchbluffton.org', 'jonathan@christchurchbluffton.org', 'bradley@christchurchbluffton.org'],
          subject: `New Prayer Request — ${name || 'Anonymous'}`,
          text: `New prayer request:\n\nName: ${name || 'Anonymous'}${email ? `\nEmail: ${email}` : ''}${phone ? `\nPhone: ${phone}` : ''}\nPrayer: ${prayer}`,
          html: emailShell('Prayer Request', [
            fieldRow('Name', name || 'Anonymous'),
            email ? fieldRow('Email', `<a href="mailto:${email}" style="color:#303b6a;">${email}</a>`) : '',
            phone ? fieldRow('Phone', phone) : '',
            fieldRow('Prayer', prayer.replace(/\n/g, '<br>'))
          ].join(''))
        }),
        signal: AbortSignal.timeout(10000)
      });
    }
    */

    // Send a confirmation reply to the submitter, if they gave an email — this form allows
    // fully anonymous submissions (no email), so there's nothing to send to otherwise
    if (process.env.RESEND_API_KEY && email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
          reply_to: 'admin@christchurchbluffton.org',
          to: [email],
          subject: "We've Received Your Prayer Request",
          text: `Thank you for trusting us with this.\n\nYour prayer request has been received, and our pastoral team will be lifting you up.\n\nPrayer: ${prayer}\n\nIf you'd like to talk with someone directly, you're always welcome to reach out at admin@christchurchbluffton.org.\n\nWith you in prayer,\nChrist Church Bluffton`,
          html: replyShell('Prayer Received', `
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:0 0 20px;">
            Thank you for trusting us with this.
          </p>
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:0 0 20px;">
            Your prayer request has been received, and our pastoral team will be lifting you up.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fieldRow('Prayer', prayer.replace(/\n/g, '<br>'))}
          </table>
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:6px 0 20px;">
            If you'd like to talk with someone directly, you're always welcome to reach out at <a href="mailto:admin@christchurchbluffton.org" style="color:#303b6a;">admin@christchurchbluffton.org</a>.
          </p>
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:28px 0 0; padding-top:20px; border-top:1px solid #EEEEEE;">
            With you in prayer,<br>Christ Church Bluffton
          </p>`)
        }),
        signal: AbortSignal.timeout(10000)
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
