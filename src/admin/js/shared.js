// Real Supabase-backed auth/session/team/activity-log. Requires the Supabase JS SDK
// (loaded via CDN script tag) to run BEFORE this file on every page.
//
// Only the PUBLISHABLE key ever lives here — it's safe in browser code by design;
// Postgres Row Level Security (see supabase/migrations/) is what actually enforces
// access, not this JS. Privileged operations (creating/deleting a team member's
// login, resetting their password) require the SECRET key instead, which must never
// reach the browser — those go through the local server/ backend instead. See
// server/server.js.
const SUPABASE_URL = 'https://fhktlrbadddmhrijhjwa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_d1822TZ_kOwccKkUvgIJfg_tQtekOI5';
const BACKEND_URL = 'http://localhost:8100';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Permissions a Staff account can be individually granted. Admin accounts implicitly have all of
// these plus Team management, which is admin-only and not togglable.
const PERMISSIONS = [
  { key: 'contentEditor', label: 'Content Editor' },
  { key: 'photos', label: 'Photos' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'congregants', label: 'Congregants' },
  { key: 'prayers', label: 'Prayer Requests' },
  { key: 'events', label: 'Events' },
  { key: 'signups', label: 'Volunteers' }
];

// ---- Session ----
// getSession() stays SYNCHRONOUS on purpose — nearly every page's existing code calls
// it that way. Supabase's own session check is async, so we resolve it once up front
// (see _sessionReady below) and cache the result; loadSidebar() awaits that cache
// being ready as its very first step, before any page's normal (synchronous) code runs.
let _cachedSession = null;
let _sessionReadyResolve;
const _sessionReady = new Promise(resolve => { _sessionReadyResolve = resolve; });

// Every page load re-verifies the session/profile fresh over the network (~170ms) — real
// and necessary, but it means the sidebar can't know who's logged in (or what they can
// see) until that finishes. sessionStorage lets the NEXT page load skip straight to a
// synchronous, zero-wait render using whatever was true a moment ago on the previous
// page, then quietly re-confirm in the background — eliminating the visible pop-in for
// every navigation except the very first one after signing in. Cleared on sign-out/tab
// close; never trusted for anything security-sensitive (RLS is what actually enforces
// access — this cache only decides what to *show*, a moment early).
const _SESSION_CACHE_KEY = 'ccb_session_cache';
function _readSessionCache() {
  try {
    const raw = sessionStorage.getItem(_SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function _writeSessionCache(session) {
  try {
    if (session) sessionStorage.setItem(_SESSION_CACHE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(_SESSION_CACHE_KEY);
  } catch { /* sessionStorage unavailable (private browsing etc.) — cache is optional */ }
}

async function _refreshCachedSession(authUser) {
  if (!authUser) { _cachedSession = null; _writeSessionCache(null); return null; }
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('id, email, name, role, permissions, status')
    .eq('id', authUser.id)
    .single();
  if (error || !profile) { _cachedSession = null; _writeSessionCache(null); return null; }
  _cachedSession = {
    id: profile.id, email: profile.email, name: profile.name,
    role: profile.role, permissions: profile.permissions || {}, status: profile.status
  };
  _writeSessionCache(_cachedSession);
  return _cachedSession;
}

// Supabase fires onAuthStateChange synchronously on subscribe (as both SIGNED_IN and
// INITIAL_SESSION, back to back) with the same session initSession() below already
// fetches via its own explicit getSession() call — without this guard, that's 2 extra
// redundant profiles queries on every single page load. Anything that fires while
// initSession()'s own fetch is still in flight is guaranteed to be about that same
// already-in-progress session, so it's safe to ignore; anything after is a real event
// (actual sign-in/out, token refresh) and still gets handled normally.
let _initialLoadInProgress = true;

(async function initSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  await _refreshCachedSession(session ? session.user : null);
  _initialLoadInProgress = false;
  _sessionReadyResolve();
})();

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (_initialLoadInProgress) return;
  _refreshCachedSession(session ? session.user : null);
});

function getSession() {
  return _cachedSession;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  await _refreshCachedSession(data.user);
  // Status stays 'invited' until they actually set their own password on
  // Account Settings (see loadSidebar's forced-reset redirect below) — first
  // login alone doesn't count as "activated."
  return { session: _cachedSession };
}

async function signOutSession() {
  await supabaseClient.auth.signOut();
  _cachedSession = null;
  _writeSessionCache(null);
}

// The real Supabase login token for the current session — sent to the local backend
// (server/server.js) so it can verify who's actually calling before doing anything
// privileged (create/reset-password/delete a team account). Not the same as
// getSession()'s cached profile object; this is the raw auth token itself.
async function getAccessToken() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session ? data.session.access_token : null;
}

// Convenience wrapper for calling the backend with that token attached.
async function backendFetch(path, options = {}) {
  const token = await getAccessToken();
  const headers = Object.assign({}, options.headers, {
    Authorization: token ? `Bearer ${token}` : ''
  });
  return fetch(`${BACKEND_URL}${path}`, Object.assign({}, options, { headers }));
}

function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// Site Admin sits above Admin — has every Admin capability plus team management
// (invite/edit/remove Admin accounts). Most of the app only needs "is this person
// an Admin or above," which isAdminTier() covers; isSiteAdmin() is only for the
// narrower team-management actions on team.html.
function isAdminTier(session) {
  return !!session && (session.role === 'admin' || session.role === 'site_admin');
}

function isSiteAdmin(session) {
  return !!session && session.role === 'site_admin';
}

// Only Site Admin gets blanket access to every data page regardless of the
// permissions object. Admin's page access is individually dial-able by a Site
// Admin (same checklist Staff already used) — it just defaults to everything
// checked when someone's promoted, so nobody's access silently changes.
function hasPermission(session, key) {
  if (!session) return false;
  if (isSiteAdmin(session)) return true;
  return !!(session.permissions && session.permissions[key]);
}

// ---- Team roster ----
async function getTeam() {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, email, name, role, permissions, status')
    .order('name');
  if (error) { console.error('getTeam failed:', error.message); return []; }
  return data;
}

async function findTeamMember(email) {
  const normalized = (email || '').trim().toLowerCase();
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, email, name, role, permissions, status')
    .ilike('email', normalized)
    .maybeSingle();
  if (error) return null;
  return data;
}

function emptyPermissions() {
  const perms = {};
  PERMISSIONS.forEach(p => { perms[p.key] = false; });
  return perms;
}

function fullPermissions() {
  const perms = {};
  PERMISSIONS.forEach(p => { perms[p.key] = true; });
  return perms;
}

// ---- Activity log (admin-only "Team" page audit trail) ----
// Records stay compact — short keys, no free-text descriptions — since this is meant to export as
// small raw CSV rather than a rendered dashboard. Human-readable labels are built at export time.
const ACTIVITY_LABELS = {
  login: 'Signed in',
  login_fail: 'Failed sign-in attempt',
  logout: 'Signed out',
  access_denied: 'Blocked from a page (no permission)',
  staff_add: 'Added staff member',
  staff_edit: 'Edited staff member',
  staff_remove: 'Removed staff member',
  photo_add: 'Uploaded photo',
  photo_remove: 'Deleted photo',
  subscriber_add: 'Added subscriber',
  subscriber_edit: 'Edited subscriber',
  subscriber_remove: 'Removed subscriber',
  congregant_add: 'Added congregant family',
  congregant_edit: 'Edited congregant family',
  congregant_remove: 'Removed congregant family',
  prayer_add: 'Added prayer request',
  prayer_edit: 'Edited prayer request',
  prayer_remove: 'Removed prayer request',
  event_add: 'Added event',
  event_edit: 'Edited event',
  event_remove: 'Removed event',
  volunteer_add: 'Added volunteer',
  volunteer_edit: 'Edited volunteer',
  volunteer_remove: 'Removed volunteer',
  draft_save: 'Saved newsletter draft',
  draft_delete: 'Deleted newsletter draft',
  content_save: 'Saved content edits',
  team_invite: 'Invited team member',
  team_edit: 'Edited team member',
  team_remove: 'Removed team member',
  team_reset_pw: 'Reset a team member\'s password'
};

// Fire-and-forget, same as the old localStorage version — callers never awaited this
// before and don't need to now either.
function logActivity(action, target, actorOverride) {
  const session = getSession();
  const actor = actorOverride || (session ? session.email : 'unknown');
  supabaseClient.from('activity_log').insert({ actor, action, target: target || '' })
    .then(({ error }) => { if (error) console.error('logActivity failed:', error.message); });
}

async function getActivityLog() {
  const { data, error } = await supabaseClient
    .from('activity_log')
    .select('occurred_at, actor, action, target')
    .order('occurred_at', { ascending: true });
  if (error) { console.error('getActivityLog failed:', error.message); return []; }
  return data.map(e => ({ t: new Date(e.occurred_at).getTime(), actor: e.actor, action: e.action, target: e.target }));
}

// Raw CSV export, optionally bounded to a date range (inclusive). fromMs/toMs are epoch ms or null.
async function activityLogToCsv(fromMs, toMs) {
  const esc = s => `"${String(s).replace(/"/g, '""')}"`;
  const log = await getActivityLog();
  const rows = log
    .filter(e => (fromMs == null || e.t >= fromMs) && (toMs == null || e.t <= toMs))
    .map(e => [esc(new Date(e.t).toISOString()), esc(e.actor), esc(e.action), esc(ACTIVITY_LABELS[e.action] || e.action), esc(e.target)].join(','));
  return ['Timestamp,Actor,ActionCode,Action,Target'].concat(rows).join('\n');
}

// Refreshes the current session from its profile row (permissions/role/name may have changed
// since login — e.g. an admin just edited this person's access) without requiring a re-login.
async function syncSessionFromTeam() {
  const session = getSession();
  if (!session) return null;
  await _refreshCachedSession({ id: session.id });
  return getSession();
}

const PAGE_PERMISSION_MAP = {
  content: 'contentEditor',
  photos: 'photos',
  newsletter: 'newsletter',
  subscribers: 'subscribers',
  congregants: 'congregants',
  prayers: 'prayers',
  events: 'events',
  volunteers: 'signups'
};

// Paints the sidebar's account-specific bits (name/avatar/role, which nav links show,
// which one is active) from a given session object. Called twice per page load: once
// synchronously from a cached session (if one exists from the last page — instant, no
// network wait, this is what kills the pop-in flash on every navigation after the
// first), then again once the real session check resolves (corrects anything stale —
// a no-op in the common case since the values are almost always identical, so nothing
// visibly changes the second time).
const ROLE_LABELS = { site_admin: 'Site Admin', admin: 'Admin', staff: 'Staff' };

function _renderSidebarChrome(session) {
  const currentPage = document.body.dataset.page;
  document.getElementById('sidebar-name').textContent = session.name;
  document.getElementById('sidebar-role').textContent = ROLE_LABELS[session.role] || 'Staff';
  document.getElementById('sidebar-role').className = 'role ' + (isAdminTier(session) ? 'role-admin' : 'role-staff');
  document.getElementById('sidebar-avatar').textContent = session.name.charAt(0).toUpperCase();

  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === currentPage);
    if (link.dataset.siteAdminOnly === 'true') {
      link.style.display = isSiteAdmin(session) ? 'flex' : 'none';
      return;
    }
    const permKey = link.dataset.permission;
    if (permKey) {
      link.style.display = hasPermission(session, permKey) ? 'flex' : 'none';
    }
  });
}

// ---- Reading Mode (accessibility) ----
// Built for one specific person; gated by exact login email so the toggle never even
// appears for anyone else. The on/off + tint choice live in localStorage, but the
// reading-mode CSS class is only ever applied from inside setupReadingModeControls()
// below, which itself only runs after the email check passes — so even on a shared
// computer, someone else logging in afterward never inherits it.
const READING_MODE_EMAILS = ['jonathan@christchurchbluffton.org'];
const READING_MODE_KEY = 'ccb_reading_mode';
const READING_TINT_KEY = 'ccb_reading_tint';

function _applyReadingModeFromStorage() {
  const on = localStorage.getItem(READING_MODE_KEY) === 'true';
  const tint = localStorage.getItem(READING_TINT_KEY) || 'cream';
  document.body.classList.toggle('reading-mode', on);
  document.body.classList.remove('tint-cream', 'tint-blue', 'tint-green');
  if (on) document.body.classList.add('tint-' + tint);
  return { on, tint };
}

// Safe to call repeatedly (unlike the click-handler wiring below) — this is what lets
// the button show up instantly from a cached session instead of popping in a beat
// later, same fix as _renderSidebarChrome above and for the same reason.
function _syncReadingModeUI(isAllowed) {
  const row = document.getElementById('reading-mode-row');
  const btn = document.getElementById('reading-mode-btn');
  const swatchesWrap = document.getElementById('reading-tint-swatches');
  if (!row || !btn || !swatchesWrap) return;
  row.style.display = isAllowed ? '' : 'none';
  if (!isAllowed) return;
  const state = _applyReadingModeFromStorage();
  btn.classList.toggle('active', state.on);
  swatchesWrap.style.display = state.on ? 'flex' : 'none';
  swatchesWrap.querySelectorAll('.tint-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.tint === state.tint);
  });
}

let _readingModeWired = false;
function setupReadingModeControls(session) {
  const allowed = READING_MODE_EMAILS.includes((session.email || '').toLowerCase());
  _syncReadingModeUI(allowed);
  if (!allowed || _readingModeWired) return;
  _readingModeWired = true;

  const btn = document.getElementById('reading-mode-btn');
  const swatchesWrap = document.getElementById('reading-tint-swatches');

  btn.addEventListener('click', () => {
    const nowOn = !document.body.classList.contains('reading-mode');
    localStorage.setItem(READING_MODE_KEY, String(nowOn));
    _syncReadingModeUI(true);
  });

  swatchesWrap.querySelectorAll('.tint-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      localStorage.setItem(READING_TINT_KEY, sw.dataset.tint);
      localStorage.setItem(READING_MODE_KEY, 'true');
      _syncReadingModeUI(true);
    });
  });
}

// ---- Forced first-login password reset ----
// A blocking modal (not a page redirect) so there's no way to end up "on" the
// panel without having actually set a real password — it's injected on top of
// whatever page just loaded, with no close button and no click-outside-to-dismiss.
// Status only flips to 'active' once the form is actually submitted successfully,
// so closing the tab or logging out and back in just shows this same modal again.
function showForcedPasswordResetModal(session) {
  if (document.getElementById('forced-reset-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'forced-reset-overlay';
  overlay.id = 'forced-reset-overlay';
  overlay.innerHTML = `
    <div class="forced-reset-box">
      <h2>Set Your Password</h2>
      <p>This is your first sign-in — set your own password before continuing. You won't be able to use the admin panel until this is done.</p>
      <div class="forced-reset-error" id="forced-reset-error"></div>
      <div class="field">
        <label for="forced-reset-pw">New Password</label>
        <input type="password" id="forced-reset-pw" placeholder="At least 6 characters">
      </div>
      <div class="field">
        <label for="forced-reset-pw-confirm">Confirm New Password</label>
        <input type="password" id="forced-reset-pw-confirm" placeholder="Repeat password">
      </div>
      <div class="forced-reset-actions">
        <button type="button" class="forced-reset-logout" id="forced-reset-logout">Log out instead</button>
        <button type="button" class="btn btn-gold" id="forced-reset-submit">Set Password</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('forced-reset-logout').addEventListener('click', async () => {
    await signOutSession();
    window.location.href = 'index.html';
  });

  document.getElementById('forced-reset-submit').addEventListener('click', async () => {
    const pw = document.getElementById('forced-reset-pw').value;
    const confirmPw = document.getElementById('forced-reset-pw-confirm').value;
    const errorBox = document.getElementById('forced-reset-error');
    errorBox.classList.remove('visible');

    if (pw.length < 6) {
      errorBox.textContent = 'Password must be at least 6 characters.';
      errorBox.classList.add('visible');
      return;
    }
    if (pw !== confirmPw) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.classList.add('visible');
      return;
    }
    const { error: pwError } = await supabaseClient.auth.updateUser({ password: pw });
    if (pwError) {
      errorBox.textContent = pwError.message;
      errorBox.classList.add('visible');
      return;
    }
    const { error: statusError } = await supabaseClient.from('profiles').update({ status: 'active' }).eq('id', session.id);
    if (statusError) {
      errorBox.textContent = statusError.message;
      errorBox.classList.add('visible');
      return;
    }
    window.location.reload();
  });
}

async function loadSidebar() {
  const cached = _readSessionCache();
  if (cached && cached.status !== 'invited') {
    _renderSidebarChrome(cached);
    setupReadingModeControls(cached);
  }

  await _sessionReady;
  // _sessionReady already just fetched this person's profile fresh (every page load is a
  // full reload here, so that fetch reruns from scratch each time) — re-fetching it again
  // right away bought nothing but an extra network round-trip (syncSessionFromTeam() still
  // exists for the one real case that needs a THIRD fetch: after Team edits someone's own
  // permissions mid-session, see team.html).
  let session = requireSession();
  if (!session) return;

  if (session.status === 'invited') {
    showForcedPasswordResetModal(session);
  }

  // The sidebar markup is baked directly into every page (see #sidebar-mount in the HTML),
  // not fetched at runtime — it's part of the very first paint. This repaints it with the
  // now-confirmed-real session; see _renderSidebarChrome's comment for why this runs twice.
  _renderSidebarChrome(session);
  setupReadingModeControls(session);

  document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    logActivity('logout', session.email);
    await signOutSession();
    window.location.href = 'index.html';
  });

  // Tablet/mobile only — nav collapses behind this toggle instead of stacking above content.
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const collapsible = document.getElementById('sidebar-collapsible');
  hamburgerBtn.addEventListener('click', () => {
    const isOpen = collapsible.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  // Tapping anywhere outside the open menu closes it, without affecting clicks inside it.
  document.addEventListener('click', (e) => {
    if (!collapsible.classList.contains('open')) return;
    if (collapsible.contains(e.target) || hamburgerBtn.contains(e.target)) return;
    collapsible.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  });

  // Bounce anyone who lands directly on a page they don't have permission for. Always
  // checked against the real (not cached) session — this is the actual security gate;
  // the cache above only ever affects what's shown a moment early, never what's allowed.
  const currentPage = document.body.dataset.page;
  const requiredPerm = PAGE_PERMISSION_MAP[currentPage];
  const isSiteAdminOnlyPage = document.body.dataset.siteAdminOnly === 'true';
  const blocked = (isSiteAdminOnlyPage && !isSiteAdmin(session)) || (requiredPerm && !hasPermission(session, requiredPerm));
  if (blocked) {
    logActivity('access_denied', currentPage);
    document.getElementById('page-body').innerHTML = `
      <div class="restricted-panel">
        <div class="icon">🔒</div>
        <h2>Access required</h2>
        <p>You don't have access to this page. Contact an admin if you need it turned on for your account.</p>
      </div>`;
  }
}
