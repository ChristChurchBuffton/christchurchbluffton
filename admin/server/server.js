// Local backend for the admin panel's privileged Supabase operations.
// The secret key lives ONLY here, server-side — it must never reach browser code.
// Creating/deleting/resetting another person's login is an admin-only operation in
// Supabase Auth and requires this key; there's no safe way to do it from the client.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Only this admin panel's own dev origin(s) may call this backend — set
// ALLOWED_ORIGINS in server/.env (comma-separated) once this moves beyond localhost.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8098,http://localhost:5500')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Every request must prove who's calling by sending their real Supabase login token
// (Authorization: Bearer <access_token>, the same token the browser already has from
// signing in). No separate password/secret for this server — it just checks that
// token is real and looks up that person's role, exactly like every other page's
// permission check already does via Postgres RLS.
async function requireCaller(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in.' });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: 'Session expired — please sign in again.' });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles').select('id, role').eq('id', userData.user.id).single();
  if (profileError || !profile) return res.status(401).json({ error: 'Account not found.' });

  req.callerId = profile.id;
  req.callerRole = profile.role;
  next();
}

function requireAdmin(req, res, next) {
  if (req.callerRole !== 'admin' && req.callerRole !== 'site_admin') return res.status(403).json({ error: 'Admins only.' });
  next();
}

function randomThrowawayPassword() {
  // Only ever used as a placeholder immediately overwritten by a real reset-password
  // call in the same UI flow (Invite -> Reset Password), matching the existing
  // Team page's two-step pattern. Never shown to anyone, never emailed anywhere.
  return 'placeholder-' + Math.random().toString(36).slice(2) + Date.now();
}

// Create a new team member: a real Supabase Auth user (no confirmation email sent —
// email_confirm:true skips that) plus their profiles row. Mirrors "Invite Team
// Member" on team.html; a follow-up /reset-password call sets their real temp password.
// Admin only — matches Team page being admin-only.
app.post('/api/team', requireCaller, requireAdmin, async (req, res) => {
  const { email, name, role, permissions } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: 'email, name, and role are required.' });
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: randomThrowawayPassword(),
    email_confirm: true // marks the email verified without sending any email
  });
  if (createError) return res.status(400).json({ error: createError.message });

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: created.user.id,
    email,
    name,
    role,
    permissions: permissions || {},
    status: 'invited'
  });
  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileError.message });
  }

  res.json({ id: created.user.id });
});

// Set/replace a team member's password. Admin only — a person changing their OWN
// password uses Supabase's client-side auth.updateUser() instead (see account.html),
// which needs no elevated privilege since Supabase already lets you change your own.
app.post('/api/team/:id/reset-password', requireCaller, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Remove a team member entirely (auth user + profiles row via FK cascade).
// Admins can remove anyone; anyone can remove their OWN account (Account Settings'
// "Delete My Account").
app.delete('/api/team/:id', requireCaller, async (req, res) => {
  if (req.callerRole !== 'admin' && req.callerId !== req.params.id) {
    return res.status(403).json({ error: "You can only remove your own account." });
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

const port = process.env.PORT || 8099;
app.listen(port, () => console.log(`CCB admin backend listening on http://localhost:${port}`));
