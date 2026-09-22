// Form test-mode switch - drop-in helper for Netlify Functions.
// No npm dependencies, so it also works on drag-and-drop deploys (which skip `npm install`).
//
// ONE environment variable controls everything:
//   FORM_TEST_MODE_TO=you@your-own-inbox.com   -> test mode ON
//   (unset or empty)                           -> normal behavior, completely untouched
//
// Set it ONLY on the agency test site. NEVER on a client's live site.
// Rules + how to test it: _Service Integrations Playbook/Form Test Mode/README.md

const ONE_EMAIL = /^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]+$/;

// Read at call time (not at file load) so it always reflects the current environment.
function config() {
  const raw = (process.env.FORM_TEST_MODE_TO || '').trim();
  if (raw === '') return { on: false, to: null, error: null };
  if (!ONE_EMAIL.test(raw)) {
    return { on: true, to: null, error: 'FORM_TEST_MODE_TO is set but is not a single valid email address' };
  }
  return { on: true, to: raw, error: null };
}

function isTestMode() { return config().on; }

// Merge into EVERY response you return - success AND errors, any HTTP method.
// The header exists only in test mode, so seeing it is a safe pre-flight proof that a deploy
// is in test mode BEFORE you submit anything real.
function headers(extra) {
  return Object.assign({}, extra || {}, config().on ? { 'X-Form-Test-Mode': 'on' } : {});
}

// Call first thing in the handler, before ANY side effect. If test mode is on but misconfigured,
// this returns a ready-made 500 to return immediately (fail closed: a broken switch must never
// fall back to the real recipients). Otherwise returns null and you carry on.
function guard() {
  const c = config();
  if (c.on && c.error) {
    console.error('[TEST MODE] ' + c.error + ' - refusing to run');
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ error: 'Form is misconfigured.' }) };
  }
  return null;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Wrap EVERY outbound email payload - staff notifications AND submitter auto-replies.
// `payload` is the object you send to the email API ({ from, to, subject, html, text, reply_to, ... }).
// Normal mode: returned untouched. Test mode: the only recipient is the test address, the subject
// gets "[TEST] ", the body gets a banner listing who it would really have gone to, cc/bcc removed.
function prepareEmail(payload) {
  const c = config();
  if (!c.on) return payload;
  if (c.error) throw new Error(c.error);
  const wouldHaveGoneTo = [].concat(payload.to || []).join(', ') || '(nobody)';
  const banner = 'TEST MODE - in normal mode this email goes to: ' + wouldHaveGoneTo;
  const out = Object.assign({}, payload, { to: [c.to], subject: '[TEST] ' + (payload.subject || '') });
  delete out.cc;
  delete out.bcc;
  if (typeof out.html === 'string') {
    out.html = '<div style="background:#fff3cd;border:2px solid #d39e00;padding:10px;margin:0 0 12px;font:bold 14px Arial,sans-serif;color:#664d03">'
      + escapeHtml(banner) + '</div>' + out.html;
  }
  if (typeof out.text === 'string') out.text = banner + '\n\n' + out.text;
  if (typeof out.html !== 'string' && typeof out.text !== 'string') out.text = banner;
  return out;
}

// Wrap EVERY write to the client's real records: database insert, CRM / mailing-list contact or tag,
// spreadsheet row, webhook to another system. (Reads are fine - e.g. looking up who gets the email.)
// Normal mode: runs fn() and returns its result. Test mode: skips it, logs what would have happened,
// and returns { ok: true, skipped: true } so code that checks `res.ok` keeps working.
async function write(label, fn) {
  if (!config().on) return fn();
  console.log('[TEST MODE] skipped write: ' + label);
  return { ok: true, status: 200, skipped: true };
}

module.exports = { isTestMode, headers, guard, prepareEmail, write };
