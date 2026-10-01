'use strict';
// Shared plumbing for the Content Editor's Publish and Preview functions: reading the saved editor
// records from Supabase, working out what has to change in the site's files, and (for Publish)
// writing the "this is now live" notes back. The text/HTML rules live in content-engine.js.

const crypto = require('crypto');
const engine = require('./content-engine');

const PAGE_FILES = {
  'Home': 'index.html', 'About': 'about.html', 'Join Us': 'join-us.html', 'Groups': 'groups.html',
  'Serve': 'serve.html', 'Give': 'give.html', 'Contact': 'contact.html', 'Privacy': 'privacy.html', 'Terms': 'terms.html'
};
const PAGE_PATHS = {
  'Home': '/', 'About': '/about', 'Join Us': '/join-us', 'Groups': '/groups', 'Serve': '/serve',
  'Give': '/give', 'Contact': '/contact', 'Privacy': '/privacy', 'Terms': '/terms'
};
const INCLUDE_FILES = ['includes/header.html', 'includes/footer.html', 'includes/prayer-fab.html'];
const BUCKET = 'content-images';

// ---------- Supabase (service role) ----------
function sbHeaders(env, extra) {
  return Object.assign({ apikey: env.SUPABASE_SECRET_KEY, Authorization: 'Bearer ' + env.SUPABASE_SECRET_KEY }, extra || {});
}
async function sb(env, method, path, body, extraHeaders) {
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers: sbHeaders(env, Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=representation' }, extraHeaders || {})),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Database ' + method + ' ' + path.split('?')[0] + ' failed: ' + res.status + ' ' + text.slice(0, 200));
  return text ? JSON.parse(text) : [];
}

// Who is calling, and may they publish? Only top admins whose Content Editor access is still on.
async function authenticate(event, env) {
  const header = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { error: 'Not signed in.', status: 401 };
  const meRes = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: 'Bearer ' + token } });
  if (!meRes.ok) return { error: 'Session expired — please sign in again.', status: 401 };
  const me = await meRes.json();
  const rows = await sb(env, 'GET', 'profiles?id=eq.' + encodeURIComponent(me.id) + '&select=id,name,email,role,permissions');
  const p = rows[0];
  const allowed = !!p && p.role === 'site_admin' && !(p.permissions && p.permissions.contentEditor === false);
  if (!allowed) return { error: 'Only top admins can publish.', status: 403 };
  return { user: { id: p.id, name: p.name || p.email || 'Unknown', email: p.email || '' } };
}

// ---------- Reading the saved records ----------
const bySort = (a, b) => (a.sort_order - b.sort_order) || String(a.id).localeCompare(String(b.id));

async function loadRecords(env, page) {
  const inList = 'in.("' + page.replace(/"/g, '') + '","Site-Wide")';
  const q = t => t + '?page=' + encodeURIComponent(inList) + '&select=*';
  const [sections, fields, repeats, images] = await Promise.all([
    sb(env, 'GET', q('site_content_sections')),
    sb(env, 'GET', q('site_content_fields')),
    sb(env, 'GET', q('site_content_repeats')),
    sb(env, 'GET', q('site_content_images'))
  ]);
  return { sections, fields, repeats, images };
}

// Boxes in the order the editor binds them: sections in order; in each, its own boxes, then each
// repeated card's boxes. Duplicate wording lines up with the right box because of this order.
function rowsForScope(records, scopePage) {
  const rows = [];
  records.sections.filter(s => s.page === scopePage).sort(bySort).forEach(sec => {
    records.fields.filter(f => f.page === scopePage && f.section_name === sec.section_name).sort(bySort).forEach(f => {
      rows.push({ key: 'f:' + f.id, kind: 'field', id: f.id, label: sec.section_name + ' — ' + f.field_label,
        rec: { original: f.original_value, value: f.field_value, published: f.published_value } });
    });
    records.repeats.filter(r => r.page === scopePage && r.section_name === sec.section_name).sort(bySort).forEach(r => {
      (r.fields || []).forEach((ff, i) => {
        rows.push({ key: 'r:' + r.id + '#' + i, kind: 'repeat', repeatId: r.id, index: i, label: sec.section_name + ' — ' + r.repeat_title + ' — ' + ff.label,
          rec: { original: ff.original !== undefined ? ff.original : ff.value, value: ff.value, published: ff.published } });
      });
    });
  });
  return rows;
}

function imageDrafts(records) {
  const out = [];
  records.images.forEach(r => {
    if (engine.imageIsDraft(r)) out.push({ kind: 'image', id: r.id, file: r.file, label: r.label, rec: r });
  });
  records.repeats.forEach(r => {
    if (r.image && engine.imageIsDraft(r.image)) out.push({ kind: 'repeat-image', repeatId: r.id, file: r.image.file, label: r.image.label, rec: r.image });
  });
  return out;
}

// ---------- Working out the edits ----------
const toEngineRow = r => engine.fieldRow(r.key, r.rec);

// files: { 'index.html': html, 'includes/header.html': html, ... } (page file + the three shared files)
// Returns the edited HTML for each file, which boxes were applied, and which could not be placed.
function planText(pageName, pageFile, files, records) {
  const pageRows = rowsForScope(records, pageName);
  const siteRows = pageName === 'Site-Wide' ? [] : rowsForScope(records, 'Site-Wide');
  const labelOf = new Map(pageRows.concat(siteRows).map(r => [r.key, r.label]));
  const out = {};
  const failed = [];
  const applied = [];

  const pageRes = engine.applyRows(files[pageFile], pageRows.map(toEngineRow));
  out[pageFile] = pageRes.html;
  pageRes.failed.forEach(f => failed.push({ key: f.key, label: labelOf.get(f.key), reason: f.reason }));
  pageRows.forEach(r => { if (toEngineRow(r).next !== null && !pageRes.failed.some(f => f.key === r.key)) applied.push(r); });

  // The shared header/footer/prayer-button boxes: each goes to the first shared file that has its text.
  let remaining = siteRows.slice();
  INCLUDE_FILES.forEach(path => {
    const html = files[path];
    if (!remaining.length) { out[path] = html; return; }
    const probe = engine.applyRows(html, remaining.map(r => ({ key: r.key, live: engine.liveOf(r.rec), next: 'x' })));
    const missing = new Set(probe.failed.map(f => f.key));
    const here = remaining.filter(r => !missing.has(r.key));
    remaining = remaining.filter(r => missing.has(r.key));
    const res = engine.applyRows(html, here.map(toEngineRow));
    out[path] = res.html;
    res.failed.forEach(f => failed.push({ key: f.key, label: labelOf.get(f.key), reason: f.reason }));
    here.forEach(r => { if (toEngineRow(r).next !== null && !res.failed.some(f => f.key === r.key)) applied.push(r); });
  });
  remaining.forEach(r => {
    if (toEngineRow(r).next !== null) failed.push({ key: r.key, label: labelOf.get(r.key), reason: 'not found in the shared header/footer' });
  });
  return { files: out, applied, failed };
}

// "images/foo-800.webp 800w, images/foo.webp 1600w" on the <img> that uses `file` -> every size file.
function srcsetFilesFor(html, file) {
  const out = new Set([file]);
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].indexOf('images/' + file) === -1) continue;
    const ss = /srcset="([^"]+)"/.exec(m[0]);
    if (ss) ss[1].split(',').forEach(part => { const f = part.trim().split(/\s+/)[0].split('/').pop(); if (f) out.add(f); });
  }
  return Array.from(out);
}

function publicUrl(env, path) {
  return env.SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path.split('/').map(encodeURIComponent).join('/');
}

async function downloadObject(env, path) {
  const res = await fetch(publicUrl(env, path));
  if (!res.ok) throw new Error('Could not read the saved photo (' + path + '): ' + res.status);
  return Buffer.from(await res.arrayBuffer());
}

// ---------- Marking what is now live ----------
async function patchRepeat(env, repeatId, mutate) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = await sb(env, 'GET', 'site_content_repeats?id=eq.' + repeatId + '&select=*');
    if (!rows.length) return;
    const row = rows[0];
    const patch = mutate(row);
    const done = await sb(env, 'PATCH', 'site_content_repeats?id=eq.' + repeatId + '&version=eq.' + row.version, patch);
    if (done.length) return;
  }
  throw new Error('Could not record the published state of a card (it kept changing).');
}

async function markPublished(env, applied, drafts) {
  for (const r of applied) {
    if (r.kind === 'field') {
      await sb(env, 'PATCH', 'site_content_fields?id=eq.' + r.id, { published_value: r.rec.value });
    }
  }
  const byRepeat = new Map();
  applied.filter(r => r.kind === 'repeat').forEach(r => {
    if (!byRepeat.has(r.repeatId)) byRepeat.set(r.repeatId, []);
    byRepeat.get(r.repeatId).push(r);
  });
  drafts.filter(d => d.kind === 'repeat-image').forEach(d => { if (!byRepeat.has(d.repeatId)) byRepeat.set(d.repeatId, []); });
  for (const [repeatId, rows] of byRepeat) {
    await patchRepeat(env, repeatId, row => {
      const fields = (row.fields || []).map(f => Object.assign({}, f));
      rows.forEach(r => { if (fields[r.index]) fields[r.index].published = r.rec.value; });
      const patch = { fields };
      const draft = drafts.find(d => d.kind === 'repeat-image' && d.repeatId === repeatId);
      if (draft && row.image) {
        const image = Object.assign({}, row.image);
        if (draft.rec.replacement_path) image.published_replacement_path = draft.rec.replacement_path;
        else delete image.published_replacement_path;
        patch.image = image;
      }
      return patch;
    });
  }
  for (const d of drafts.filter(x => x.kind === 'image')) {
    await sb(env, 'PATCH', 'site_content_images?id=eq.' + d.id, { published_replacement_path: d.rec.replacement_path || null });
  }
}

// ---------- Signed preview links ----------
function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function signPreview(env, payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', env.SUPABASE_SECRET_KEY + ':content-preview').update(body).digest());
  return body + '.' + sig;
}
function verifyPreview(env, token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const want = b64url(crypto.createHmac('sha256', env.SUPABASE_SECRET_KEY + ':content-preview').update(body).digest());
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch (e) { return null; }
}

module.exports = {
  PAGE_FILES, PAGE_PATHS, INCLUDE_FILES, BUCKET,
  sb, sbHeaders, authenticate, loadRecords, rowsForScope, imageDrafts, planText, srcsetFilesFor,
  publicUrl, downloadObject, markPublished, signPreview, verifyPreview, toEngineRow
};
