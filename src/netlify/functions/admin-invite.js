// Creates a new admin-panel team member: a real Supabase Auth user (no confirmation
// email — email_confirm:true skips that) plus their profiles row. Mirrors what the old
// local-only admin/server/server.js did for Kevin's own dev testing, but this is the
// version that actually runs on the deployed site — team.html's "Invite Team Member"
// button was calling http://localhost:8100 before, which only ever worked on Kevin's
// own machine with the dev server running.
//
// The secret key lives ONLY here, server-side, via raw REST calls (same pattern as
// contact.js/prayer.js) — no @supabase/supabase-js dependency needed for this.
//
// Gated to Site Admins only (role = 'site_admin' in profiles) — currently Kevin,
// admin@christchurchbluffton.org, and Jonathan. Regular Admins can do everything else
// in the panel but cannot invite new accounts or touch other Admin/Site Admin rows;
// see admin/supabase/migrations/0008_site_admin_role.sql for the DB-level enforcement
// this mirrors.

function randomTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < 14; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
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

    const tempPassword = randomTempPassword();
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: tempPassword, email_confirm: true }),
      signal: AbortSignal.timeout(10000)
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: created.msg || created.error_description || 'Could not create that account.' }) };
    }

    const profileInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id: created.id, email, name, role, permissions: permissions || {}, status: 'invited' }),
      signal: AbortSignal.timeout(10000)
    });
    if (!profileInsertRes.ok) {
      // Roll back the auth user so we don't leave an orphaned login with no profile.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${created.id}`, {
        method: 'DELETE',
        headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}` },
        signal: AbortSignal.timeout(10000)
      });
      const errText = await profileInsertRes.text();
      return { statusCode: 400, body: JSON.stringify({ error: errText || 'Could not create that account.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ id: created.id, tempPassword }) };
  } catch (err) {
    console.error('[AdminInvite] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong.' }) };
  }
};
