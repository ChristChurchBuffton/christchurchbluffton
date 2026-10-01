'use strict';
// Talks to GitHub as a GitHub App (not a personal token): the app has its own identity, is limited
// to the one repository it is installed on, and only ever holds a short-lived token minted from its
// private key here. Used by the Content Editor's Publish and Preview.
//
// Environment (set on the TEMP site's Netlify only — the live site never gets these, so Publish
// simply cannot run there):
//   GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY (PEM; "\n" escapes allowed)

const crypto = require('crypto');

const API = 'https://api.github.com';

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function appJwt(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  const signature = crypto.createSign('RSA-SHA256').update(header + '.' + payload).sign(privateKeyPem.replace(/\\n/g, '\n'));
  return header + '.' + payload + '.' + b64url(signature);
}

function configured(env) {
  return !!(env.GITHUB_APP_ID && env.GITHUB_APP_INSTALLATION_ID && env.GITHUB_APP_PRIVATE_KEY);
}

async function gh(token, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* not JSON */ }
  if (!res.ok) {
    const err = new Error('GitHub ' + method + ' ' + path + ' failed: ' + res.status + (json && json.message ? ' ' + json.message : ''));
    err.status = res.status;
    throw err;
  }
  return json;
}

async function installationToken(env) {
  const jwt = appJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const json = await gh(jwt, 'POST', '/app/installations/' + env.GITHUB_APP_INSTALLATION_ID + '/access_tokens', {});
  return json.token;
}

// Current text of a file on the branch (files here are small page/include files).
async function readTextFile(token, repo, branch, path) {
  const json = await gh(token, 'GET', '/repos/' + repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(branch));
  return Buffer.from(json.content, 'base64').toString('utf8');
}

// Bytes of a file on the branch (used to back up an original photo before it is replaced).
async function readBinaryFile(token, repo, branch, path) {
  const meta = await gh(token, 'GET', '/repos/' + repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(branch));
  if (meta.content) return Buffer.from(meta.content, 'base64');
  const blob = await gh(token, 'GET', '/repos/' + repo + '/git/blobs/' + meta.sha);
  return Buffer.from(blob.content, 'base64');
}

// One commit containing every changed file, so a publish is all-or-nothing.
//   files: [{ path, content: Buffer|string }]
async function commitFiles(token, repo, branch, files, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await gh(token, 'GET', '/repos/' + repo + '/git/ref/heads/' + branch);
    const parentSha = ref.object.sha;
    const parent = await gh(token, 'GET', '/repos/' + repo + '/git/commits/' + parentSha);
    const tree = [];
    for (const f of files) {
      const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
      const blob = await gh(token, 'POST', '/repos/' + repo + '/git/blobs', { content: buf.toString('base64'), encoding: 'base64' });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await gh(token, 'POST', '/repos/' + repo + '/git/trees', { base_tree: parent.tree.sha, tree });
    const commit = await gh(token, 'POST', '/repos/' + repo + '/git/commits', { message, tree: newTree.sha, parents: [parentSha] });
    try {
      await gh(token, 'PATCH', '/repos/' + repo + '/git/refs/heads/' + branch, { sha: commit.sha, force: false });
      return { sha: commit.sha, url: 'https://github.com/' + repo + '/commit/' + commit.sha };
    } catch (err) {
      // Someone pushed in between — re-read the branch and try once more on top of it.
      if (err.status === 422 && attempt === 0) continue;
      throw err;
    }
  }
  throw new Error('GitHub branch kept moving — please try again.');
}

module.exports = { configured, installationToken, readTextFile, readBinaryFile, commitFiles, appJwt };
