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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { name, prayer, website_url_confirm, turnstileToken } = JSON.parse(event.body);

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

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
          to: ['admin@christchurchbluffton.org', 'jonathan@christchurchbluffton.org'],
          subject: `New Prayer Request — ${name || 'Anonymous'}`,
          text: `New prayer request:\n\nName: ${name || 'Anonymous'}\nPrayer: ${prayer}`
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
