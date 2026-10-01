'use strict';
// Content Editor → "Preview Draft": the page with every SAVED (not yet published) change applied,
// at its own link. The link is signed and expires after 30 minutes; nothing is written anywhere.
// Works from the same repository files Publish would edit, so it shows exactly what Publish would
// produce — including header/footer changes and swapped photos.

const gh = require('./lib/github-app');
const cp = require('./lib/content-publish');
const engine = require('./lib/content-engine');

const REPO = process.env.PUBLISH_REPO || 'ForgedDigital/christ-church-bluffton'; // temp/staging repo
const BRANCH = 'main';

const page = (status, html) => ({
  statusCode: status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  body: html
});
const message = (status, text) => page(status, '<!doctype html><meta charset="utf-8"><title>Draft preview</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#1e2547"><h2>Draft preview</h2><p>' + text + '</p></body>');

exports.handler = async (event) => {
  const env = process.env;
  if (event.httpMethod !== 'GET') return message(405, 'Method not allowed.');
  const host = String((event.headers && (event.headers.host || event.headers.Host)) || '').toLowerCase();
  if (/(^|\.)christchurchbluffton\.org$/.test(host)) return message(403, 'Draft previews are not available on the live site.');
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return message(500, 'Not set up yet.');
  if (!gh.configured(env)) return message(500, 'Previews are not set up on this site yet (the GitHub connection is missing).');

  const payload = cp.verifyPreview(env, event.queryStringParameters && event.queryStringParameters.t);
  if (!payload) return message(403, 'This preview link has expired or is not valid. Open the Content Editor and choose Preview Draft again.');
  const pageName = payload.page;
  const file = cp.PAGE_FILES[pageName];
  if (!file) return message(400, 'Unknown page.');

  try {
    const records = await cp.loadRecords(env, pageName);
    const token = await gh.installationToken(env);
    const files = {};
    for (const f of [file].concat(cp.INCLUDE_FILES)) files[f] = await gh.readTextFile(token, REPO, BRANCH, 'src/' + f);
    const plan = cp.planText(pageName, file, files, records);
    const out = Object.assign({}, plan.files);

    // Swapped photos point at their saved files; "back to original" points at the kept original.
    const allHtml = Object.values(files).join('\n');
    const swaps = [];
    cp.imageDrafts(records).forEach(d => {
      if (d.rec.replacement_path) {
        engine.imageFilesToCommit(d.rec).forEach(v => swaps.push({ file: v.file, url: cp.publicUrl(env, v.path) }));
      } else {
        cp.srcsetFilesFor(allHtml, d.file).forEach(f => swaps.push({ file: f, url: cp.publicUrl(env, '_originals/' + f) }));
      }
    });
    Object.keys(out).forEach(f => { swaps.forEach(s => { out[f] = out[f].split('images/' + s.file).join(s.url); }); });

    const origin = 'https://' + host;
    // The page loads its header/footer with fetch(); hand it the draft versions instead.
    const includes = {};
    cp.INCLUDE_FILES.forEach(f => { includes[f.replace(/^includes\//, '')] = out[f]; });
    const shim = '<script>(function(){var inc=' + JSON.stringify(includes).replace(/</g, '\\u003c') + ';var of=window.fetch;' +
      'window.fetch=function(u,o){var s=String(typeof u==="string"?u:(u&&u.url)||"");var m=/includes\\/([a-z-]+\\.html)/.exec(s);' +
      'if(m&&inc[m[1]]!==undefined){return Promise.resolve(new Response(inc[m[1]],{status:200,headers:{"Content-Type":"text/html"}}));}' +
      'return of.apply(this,arguments);};})();</script>';
    const ribbon = '<div style="position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;background:#1e2547;color:#fff;font:bold 13px Arial,sans-serif;padding:10px 18px;border-radius:999px;border:2px solid #c3a355;box-shadow:0 4px 18px rgba(0,0,0,.35)">DRAFT PREVIEW — saved changes, not published' +
      (plan.failed.length ? ' · ' + plan.failed.length + ' change(s) could not be placed' : '') + '</div>';
    let html = out[file];
    html = html.replace(/<head[^>]*>/i, m => m + '<base href="' + origin + '/"><meta name="robots" content="noindex,nofollow">' + shim);
    html = html.replace(/<\/body>/i, ribbon + '</body>');
    return page(200, html);
  } catch (err) {
    console.error('[Preview Content] Error:', err.message);
    return message(500, 'Could not build the preview: ' + err.message);
  }
};
