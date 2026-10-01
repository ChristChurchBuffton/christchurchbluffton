'use strict';
// Content Editor → "Publish Page" and "Preview Draft".
//
// Publish takes one page's SAVED editor records (text, links, photos — plus any unpublished
// header/footer changes, which live in shared files) and commits them to the site's files in ONE
// commit on the TEMP/staging repository. Netlify then rebuilds the temporary preview site from it.
// It can never touch the live website: the repository below is the temp one, the GitHub
// connection only exists on the temp site's settings, and the function refuses to run on the live
// domain even if it were somehow called there.
//
// Only top admins (role site_admin, Content Editor access on) may call it — checked against the
// signed-in user's real profile on every request, not against anything the browser claims.

const gh = require('./lib/github-app');
const cp = require('./lib/content-publish');
const engine = require('./lib/content-engine');

const REPO = process.env.PUBLISH_REPO || 'ForgedDigital/christ-church-bluffton'; // the temp/staging repo — NEVER the live one
const BRANCH = 'main';

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

const CONTENT_TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

// Before a swapped photo overwrites the site's file, keep the original bytes (once) in storage so
// "Use Original Photo" can always bring it back.
async function backupOriginal(env, token, file) {
  const url = cp.publicUrl(env, '_originals/' + file);
  const head = await fetch(url, { method: 'HEAD' });
  if (head.ok) return;
  let bytes;
  try { bytes = await gh.readBinaryFile(token, REPO, BRANCH, 'src/images/' + file); }
  catch (e) { if (e.status === 404) return; throw e; }
  const ext = (/\.[^.]+$/.exec(file) || [''])[0].toLowerCase();
  const res = await fetch(env.SUPABASE_URL + '/storage/v1/object/' + cp.BUCKET + '/_originals/' + encodeURIComponent(file), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.SUPABASE_SECRET_KEY, apikey: env.SUPABASE_SECRET_KEY, 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream', 'x-upsert': 'false' },
    body: bytes
  });
  if (!res.ok && res.status !== 409) throw new Error('Could not back up the original photo ' + file + ' (' + res.status + ')');
}

exports.handler = async (event) => {
  const env = process.env;
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const host = String((event.headers && (event.headers.host || event.headers.Host)) || '').toLowerCase();
  if (/(^|\.)christchurchbluffton\.org$/.test(host)) return json(403, { error: 'Publishing is not available on the live site.' });
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return json(500, { error: 'Server not configured (database).' });

  try {
    const auth = await cp.authenticate(event, env);
    if (auth.error) return json(auth.status, { error: auth.error });

    const body = JSON.parse(event.body || '{}');
    const page = body.page;
    const file = cp.PAGE_FILES[page];
    if (!file) return json(400, { error: 'Unknown page.' });

    // A link that shows the page with everything saved applied, valid for 30 minutes.
    if (body.action === 'preview-link') {
      const token = cp.signPreview(env, { page, uid: auth.user.id, exp: Date.now() + 30 * 60 * 1000 });
      return json(200, { url: 'https://' + host + '/.netlify/functions/preview-content?t=' + token });
    }

    if (!gh.configured(env)) return json(500, { error: 'Publishing is not set up on this site yet (the GitHub connection is missing).' });

    const records = await cp.loadRecords(env, page);
    const token = await gh.installationToken(env);

    const files = {};
    for (const f of [file].concat(cp.INCLUDE_FILES)) files[f] = await gh.readTextFile(token, REPO, BRANCH, 'src/' + f);

    const plan = cp.planText(page, file, files, records);
    if (plan.failed.length) {
      return json(422, { error: 'Some changes could not be matched to the page.', failed: plan.failed });
    }
    const drafts = cp.imageDrafts(records);
    const changes = plan.applied.length + drafts.length;
    if (!changes) {
      return json(200, { success: true, changes: 0, message: 'Nothing to publish — no saved changes differ from the published page.' });
    }

    // Everything that changes goes into one commit.
    const commit = [];
    Object.keys(plan.files).forEach(f => { if (plan.files[f] !== files[f]) commit.push({ path: 'src/' + f, content: plan.files[f] }); });

    const seen = new Set();
    const allHtml = Object.values(files).join('\n');
    for (const d of drafts) {
      if (d.rec.replacement_path) {
        for (const v of engine.imageFilesToCommit(d.rec)) {
          const repoPath = 'src/images/' + v.file;
          if (seen.has(repoPath)) continue;
          seen.add(repoPath);
          await backupOriginal(env, token, v.file);
          commit.push({ path: repoPath, content: await cp.downloadObject(env, v.path) });
        }
      } else {
        // Back to the original photo: every size file the page uses for it.
        for (const f of cp.srcsetFilesFor(allHtml, d.file)) {
          const repoPath = 'src/images/' + f;
          if (seen.has(repoPath)) continue;
          seen.add(repoPath);
          try { commit.push({ path: repoPath, content: await cp.downloadObject(env, '_originals/' + f) }); }
          catch (e) { /* never replaced, so nothing to restore */ }
        }
      }
    }

    if (commit.length) {
      const xml = await gh.readTextFile(token, REPO, BRANCH, 'src/sitemap.xml');
      const today = new Date().toISOString().slice(0, 10);
      const nextXml = engine.setSitemapLastmod(xml, cp.PAGE_PATHS[page], today);
      if (nextXml !== xml) commit.push({ path: 'src/sitemap.xml', content: nextXml });
    }

    let result = { sha: null, url: null };
    if (commit.length) {
      result = await gh.commitFiles(token, REPO, BRANCH, commit,
        'Publish ' + page + ' content changes via Content Editor (' + changes + ' change' + (changes === 1 ? '' : 's') + ', by ' + auth.user.name + ')');
    }

    // The page now has this wording/photo — remember it, so the next publish replaces the right text.
    await cp.markPublished(env, plan.applied, drafts);
    await cp.sb(env, 'POST', 'content_publish_log', {
      published_by: auth.user.name, page, target: 'temp', commit_sha: result.sha, commit_url: result.url, changes,
      summary: plan.applied.map(r => r.label).concat(drafts.map(d => 'Photo: ' + d.label)).slice(0, 12).join('; ')
    });

    return json(200, { success: true, changes, commitUrl: result.url, commitSha: result.sha });
  } catch (err) {
    console.error('[Publish Content] Error:', err.message);
    return json(500, { error: 'Publish failed: ' + err.message });
  }
};
