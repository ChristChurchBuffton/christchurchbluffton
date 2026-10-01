#!/usr/bin/env node
'use strict';
// Content Editor health check — run it after ANY change to a public page, the shared header/footer,
// or the editor's saved records:
//
//     node admin/check-editor-sync.js            (full check; reads the database via admin/server/.env)
//     node admin/check-editor-sync.js --offline  (files only, no database)
//
// It looks for the three things that have quietly broken the editor before:
//   1. the editor's preview copies (src/admin/assets/site-mirror/) drifting from the real pages
//   2. saved editor records that no longer match any text on the page ("orphans" — their box can't be
//      edited or published), and text on a page that has no record at all (nothing to edit)
//   3. photos on a page with no photo record (no Change Photo button)
// Exits with code 1 if anything is wrong, so it can also be wired into a commit hook.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MIRROR = path.join(SRC, 'admin', 'assets', 'site-mirror');
const engine = require(path.join(SRC, 'netlify', 'functions', 'lib', 'content-engine.js'));
const cp = require(path.join(SRC, 'netlify', 'functions', 'lib', 'content-publish.js'));

const offline = process.argv.includes('--offline');
const read = p => fs.readFileSync(p, 'utf8').replace(/\r/g, '');
let problems = 0;
const bad = msg => { problems++; console.log('  ✗ ' + msg); };
const good = msg => console.log('  ✓ ' + msg);

// ---- 1) mirror drift ----
console.log('\n1. Editor preview copies vs the real pages');
const MIRROR_BASE = '<base href="/admin/assets/site-mirror/">';
const filesToCompare = Object.values(cp.PAGE_FILES).concat(cp.INCLUDE_FILES, ['css/shared.css', 'js/components.js']);
let drift = 0;
filesToCompare.forEach(f => {
  const real = read(path.join(SRC, f));
  const mirrorPath = path.join(MIRROR, f);
  if (!fs.existsSync(mirrorPath)) { bad(f + ' has no editor preview copy'); drift++; return; }
  const mirror = read(mirrorPath).split('\n').filter(l => l.trim() !== MIRROR_BASE).join('\n');
  if (mirror !== real) { bad(f + ' differs from its editor preview copy — apply the same change to src/admin/assets/site-mirror/' + f); drift++; }
});
if (!drift) good(filesToCompare.length + ' files match');

// ---- 2 & 3) records vs page text, photos ----
async function loadAll() {
  const env = {};
  fs.readFileSync(path.join(__dirname, 'server', '.env'), 'utf8').split(/\r?\n/).forEach(l => {
    const m = /^([A-Z_]+)=(.*)$/.exec(l.trim());
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  const get = async t => {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + t + '?select=*', { headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: 'Bearer ' + env.SUPABASE_SECRET_KEY } });
    if (!res.ok) throw new Error(t + ': ' + res.status);
    return res.json();
  };
  const [sections, fields, repeats, images] = await Promise.all(['site_content_sections', 'site_content_fields', 'site_content_repeats', 'site_content_images'].map(get));
  return { sections, fields, repeats, images };
}

// Text runs between tags, with the classes of everything around them.
const IGNORE_CLASSES = ['skip-link', 'sr-only', 'donation-secure', 'footer-links-list', 'footer-legal', 'footer-powered', 'copyright', 'mobile-menu'];
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'select', 'option', 'textarea']);
const VOID = new Set(['br', 'wbr', 'img', 'input', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track']);
function textRuns(html) {
  const runs = [];
  const stack = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|[^<]+/g;
  let m;
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;
    if (tok[0] === '<') {
      const name = m[1].toLowerCase();
      if (tok[1] === '/') { const i = stack.map(s => s.name).lastIndexOf(name); if (i !== -1) stack.length = i; }
      else if (!VOID.has(name) && !tok.endsWith('/>')) {
        const cls = /\bclass="([^"]*)"/.exec(m[2]);
        stack.push({ name, classes: cls ? cls[1].split(/\s+/) : [], id: (/\bid="([^"]*)"/.exec(m[2]) || [])[1] });
      }
      continue;
    }
    const text = tok.replace(/&[a-zA-Z#0-9]+;/g, ' ').trim();
    if (!/[A-Za-z0-9]/.test(text)) continue;
    const inSkip = stack.some(s => SKIP_TAGS.has(s.name) || s.id === 'loader' || s.classes.some(c => IGNORE_CLASSES.includes(c) || c.startsWith('prayer-popup')));
    if (inSkip) continue;
    runs.push({ start: m.index, end: m.index + tok.length, text: tok.trim().slice(0, 70) });
  }
  return runs;
}

(async () => {
  if (offline) { console.log('\n(skipped 2 and 3 — --offline)'); return; }
  let records;
  try { records = await loadAll(); } catch (e) { bad('could not read the editor records: ' + e.message); return; }

  console.log('\n2. Saved records vs the text on each page');
  // Each record is placed against the editor's own preview copy — exactly what the editor does.
  const lastProblems = problems;
  const includeHtml = {};
  cp.INCLUDE_FILES.forEach(f => { includeHtml[f] = read(path.join(MIRROR, f)); });
  const coverage = {}; // file -> used spans
  const place = (file, html, rows) => {
    const res = engine.applyRows(html, rows.map(r => ({ key: r.key, live: engine.liveOf({ original: r.rec.original }), next: 'x' })));
    coverage[file] = (coverage[file] || []).concat(res.used || []);
    return res;
  };
  Object.entries(cp.PAGE_FILES).forEach(([pageName, file]) => {
    const html = read(path.join(MIRROR, file));
    const rows = cp.rowsForScope(records, pageName);
    const res = place(file, html, rows);
    const label = new Map(rows.map(r => [r.key, r.label]));
    res.failed.forEach(f => bad(pageName + ': record "' + label.get(f.key) + '" matches nothing on the page (stale — fix or remove it)'));
  });
  // Shared header/footer/prayer button: each record goes to the first shared file with its text.
  const siteRows = cp.rowsForScope(records, 'Site-Wide');
  let remaining = siteRows.slice();
  cp.INCLUDE_FILES.forEach(f => {
    const probe = engine.applyRows(includeHtml[f], remaining.map(r => ({ key: r.key, live: engine.liveOf({ original: r.rec.original }), next: 'x' })));
    const missing = new Set(probe.failed.map(x => x.key));
    const here = remaining.filter(r => !missing.has(r.key));
    remaining = remaining.filter(r => missing.has(r.key));
    place(f, includeHtml[f], here);
  });
  remaining.forEach(r => bad('Site-Wide: record "' + r.label + '" matches nothing in the shared header/footer (stale — fix or remove it)'));

  // Text with no record.
  const filesWithText = Object.values(cp.PAGE_FILES).concat(cp.INCLUDE_FILES);
  filesWithText.forEach(file => {
    const html = read(path.join(MIRROR, file));
    const zones = engine.excludedZones(html);
    const spans = coverage[file] || [];
    textRuns(html).forEach(run => {
      if (zones.some(([zs, ze]) => run.start < ze && run.end > zs)) return;
      if (spans.some(sp => run.start < sp.end && run.end > sp.start)) return;
      bad(file + ': "' + run.text + '" has no editor record — it can\'t be edited');
    });
  });
  if (problems === lastProblems) good('every record matches the page, and every piece of page text has a record');

  console.log('\n3. Photos');
  const photoIssues = problems;
  const withRow = new Set(records.images.map(i => i.file).concat(records.repeats.filter(r => r.image).map(r => r.image.file)));
  const IGNORE_PHOTOS = new Set(['logo-loader.png']); // the loading-screen logo — not a page photo
  filesWithText.forEach(file => {
    const html = read(path.join(MIRROR, file));
    const re = /<img\b[^>]*\bsrc="([^"]+)"/gi;
    let m;
    while ((m = re.exec(html))) {
      const name = m[1].split('/').pop();
      if (!withRow.has(name) && !IGNORE_PHOTOS.has(name)) bad(file + ': photo "' + name + '" has no photo record — no Change Photo button');
    }
  });
  if (problems === photoIssues) good('every photo on a page has a record');
})().then(() => {
  console.log(problems ? '\n' + problems + ' problem(s) found.\n' : '\nAll good.\n');
  process.exit(problems ? 1 : 0);
});
