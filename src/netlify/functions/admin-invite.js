// Creates a new admin-panel team member using Supabase's real invite-link flow —
// the polished, industry-standard pattern (Slack/Notion-style): the person clicks
// one link in their email and lands already signed in, straight into "set your
// password." No temp password to type, no separate manual login step first.
//
// Mirrors what the old local-only admin/server/server.js did for Kevin's own dev
// testing, but this is the version that actually runs on the deployed site —
// team.html's "Invite Team Member" button was calling http://localhost:8100 before,
// which only ever worked on Kevin's own machine with the dev server running.
//
// The secret key lives ONLY here, server-side, via raw REST calls (same pattern as
// contact.js/prayer.js) — no @supabase/supabase-js dependency needed for this.
//
// Gated to Site Admins only (role = 'site_admin' in profiles) — currently Kevin,
// admin@christchurchbluffton.org, and Jonathan. Regular Admins can do everything else
// in the panel but cannot invite new accounts or touch other Admin/Site Admin rows;
// see admin/supabase/migrations/0008_site_admin_role.sql for the DB-level enforcement
// this mirrors.

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

// Same navy/gold shell as team.html's buildInviteEmailHtml() and the site's other
// transactional emails (contact.js etc.) — kept as a literal copy since this is a
// separate serverless function with no shared module system. No temp password field
// anymore — the button IS the login, a real single-use Supabase invite link.
function buildInviteEmailHtml(name, email, actionLink, inviterEmail) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#F5F4EF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4EF; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
        <tr><td style="background-color:#303b6a; padding:28px 32px 22px;">
          <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#A9B3D6;">Christ Church Bluffton</div>
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#FFFFFF; margin-top:8px;">You're Invited to the Admin Panel</div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:0 0 20px;">Hi ${name},</p>
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#333333; line-height:1.6; margin:0 0 20px;">You've been given access to the Christ Church Bluffton admin panel — the tool used to manage prayer requests, newsletter signups, events, and photos for the website. Click below to accept your invite and set your own password — you'll be signed in automatically.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fieldRow('Email', email)}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 8px;">
            <tr><td style="background-color:#303b6a; border-radius:8px;">
              <a href="${actionLink}" style="display:inline-block; padding:14px 32px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:#FFFFFF; text-decoration:none;">Accept Invite &amp; Set Password</a>
            </td></tr>
          </table>
          <p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#999999; text-align:center; margin:10px 0 0;">This link is single-use and expires after a while — if it's stopped working, ask for a new invite.</p>
          <p style="font-family:Georgia,'Times New Roman',serif; font-size:14px; color:#666666; line-height:1.6; margin:28px 0 0; padding-top:20px; border-top:1px solid #EEEEEE;">If you have any trouble, please contact me at <a href="mailto:${inviterEmail}" style="color:#303b6a;">${inviterEmail}</a>.</p>
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
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured.' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
  const SITE_URL = event.headers.origin || event.headers.Origin || 'https://christchurchbluffton.org';

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Not signed in.' }) };

    // Verify the caller's own login token is real, then look up their role by their
    // own id — never trust a role/email the client claims about itself.
    const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!meRes.ok) return { statusCode: 401, body: JSON.stringify({ error: 'Session expired — please sign in again.' }) };
    const me = await meRes.json();

    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${me.id}&select=role`, {
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}` },
      signal: AbortSignal.timeout(10000)
    });
    const profileRows = await profileRes.json();
    const callerRole = profileRows[0] && profileRows[0].role;
    if (callerRole !== 'site_admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Only Site Admins can invite new accounts.' }) };
    }

    const { name, email, role, permissions } = JSON.parse(event.body || '{}');
    if (!name || !email || !['admin', 'staff', 'site_admin'].includes(role)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name, email, and a role of site_admin, admin, or staff are required.' }) };
    }

    // Creates the auth user AND returns a real, single-use sign-in link — no
    // password to generate or type. Clicking it authenticates automatically and
    // lands on accept-invite.html with a live session already established.
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'invite', email, redirect_to: `${SITE_URL}/admin/accept-invite.html` }),
      signal: AbortSignal.timeout(10000)
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: linkData.msg || linkData.error_description || 'Could not create that account.' }) };
    }
    const newUserId = (linkData.user && linkData.user.id) || linkData.id;
    const actionLink = linkData.action_link;

    const profileInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id: newUserId, email, name, role, permissions: permissions || {}, status: 'invited' }),
      signal: AbortSignal.timeout(10000)
    });
    if (!profileInsertRes.ok) {
      // Roll back the auth user so we don't leave an orphaned login with no profile.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUserId}`, {
        method: 'DELETE',
        headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}` },
        signal: AbortSignal.timeout(10000)
      });
      const errText = await profileInsertRes.text();
      return { statusCode: 400, body: JSON.stringify({ error: errText || 'Could not create that account.' }) };
    }

    // Actually send the invite — best-effort. The account is already real at this
    // point regardless of whether this succeeds, so a Resend hiccup never blocks
    // account creation; the client just gets told whether the email went out.
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Christ Church Bluffton <notifications@christchurchbluffton.org>',
            to: [email],
            subject: "You're Invited to the Christ Church Bluffton Admin Panel",
            html: buildInviteEmailHtml(name, email, actionLink, me.email)
          }),
          signal: AbortSignal.timeout(10000)
        });
        emailSent = emailRes.ok;
        if (!emailRes.ok) console.error('[AdminInvite] Resend failed:', emailRes.status, await emailRes.text());
      } catch (emailErr) {
        console.error('[AdminInvite] Resend error:', emailErr.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ id: newUserId, actionLink, emailSent }) };
  } catch (err) {
    console.error('[AdminInvite] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong.' }) };
  }
};
