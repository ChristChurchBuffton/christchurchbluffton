// Reset Password and Remove for the Accounts page — these were still calling
// http://localhost:8100 (the old dev-only admin/server/server.js), which only ever
// worked on Kevin's own machine with that local backend running. Same fix pattern as
// admin-invite.js: verify the caller's real token, check their role server-side, use
// the Supabase Auth Admin API via raw REST (no @supabase/supabase-js dependency).
//
// Reset Password: Site Admins only, on anyone.
// Remove: Site Admins can remove anyone; anyone can remove their OWN account (matches
// the "Delete My Account" button on account.html).

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
    const callerIsSiteAdmin = callerRole === 'site_admin';

    const { action, id, password } = JSON.parse(event.body || '{}');
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required.' }) };

    if (action === 'reset-password') {
      if (!callerIsSiteAdmin) return { statusCode: 403, body: JSON.stringify({ error: 'Only Site Admins can reset another account\'s password.' }) };
      if (!password || password.length < 6) return { statusCode: 400, body: JSON.stringify({ error: 'Password must be at least 6 characters.' }) };
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
        method: 'PUT',
        headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return { statusCode: 400, body: JSON.stringify({ error: errBody.msg || 'Could not set password.' }) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (action === 'remove') {
      if (!callerIsSiteAdmin && me.id !== id) {
        return { statusCode: 403, body: JSON.stringify({ error: 'You can only remove your own account.' }) };
      }
      const delProfileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}` },
        signal: AbortSignal.timeout(10000)
      });
      if (!delProfileRes.ok) {
        const errText = await delProfileRes.text();
        return { statusCode: 400, body: JSON.stringify({ error: errText || 'Could not remove that account.' }) };
      }
      const delAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}` },
        signal: AbortSignal.timeout(10000)
      });
      if (!delAuthRes.ok) {
        const errBody = await delAuthRes.json().catch(() => ({}));
        return { statusCode: 400, body: JSON.stringify({ error: errBody.msg || 'Removed the profile but could not remove the login — contact support.' }) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action.' }) };
  } catch (err) {
    console.error('[AdminTeam] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong.' }) };
  }
};
