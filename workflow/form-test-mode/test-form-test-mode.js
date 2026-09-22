#!/usr/bin/env node
// Form test-mode DRY-RUN harness.
//
// Runs your form functions with the network fully stubbed: nothing is sent, nothing is written,
// no account or key is needed. It answers one question before you ever deploy:
//   "If FORM_TEST_MODE_TO is set, can ANYTHING still reach a real person or a real record?"
//
// Usage:   node test-form-test-mode.js test-cases.json [--calls]
//   --calls   also print every outbound call each run made (useful when a check fails)
// Exit code 0 = every case behaved as expected, 1 = problems found.
//
// For each case it runs the function 4 times and checks:
//   normal mode        -> behaves exactly like production (real recipients emailed, records written, no [TEST], no header)
//   test mode          -> every email only to the test address + tagged [TEST]; zero record writes; spam check still called;
//                         X-Form-Test-Mode header present; same NUMBER of emails as normal mode (same paths exercised)
//   switch = not-email -> refuses (5xx) and sends/writes nothing   (fail closed)
//   switch = 2 emails  -> refuses (5xx) and sends/writes nothing   (fail closed)
// A case with "expectHarness": "fail" is a deliberately flawed function - it proves the harness catches that flaw.

const fs = require('fs');
const path = require('path');

const cfgPath = path.resolve(process.argv[2] || 'test-cases.json');
const showCalls = process.argv.includes('--calls');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const baseDir = path.dirname(cfgPath);
const TEST_TO = cfg.testAddress;
const HOSTS = cfg.hosts || {};
const realConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info };

const hostMatches = (host, patterns) => (patterns || []).some(p => (p.startsWith('*.') ? host.endsWith(p.slice(1)) : host === p));

function classify(url, method) {
  let host = '';
  try { host = new URL(url).hostname; } catch (e) { return 'unknown'; }
  if (hostMatches(host, HOSTS.email)) return 'email';
  if (hostMatches(host, HOSTS.spamCheck)) return 'spamCheck';
  if (hostMatches(host, HOSTS.records)) {
    // Some CRMs (Breeze) do their writes as GET requests - "writePaths" lists URL fragments that mean "this GET is really a write"
    const isWritePath = (cfg.writePaths || []).some(p => String(url).includes(p));
    return method === 'GET' && !isWritePath ? 'read' : 'write';
  }
  return 'unknown';
}

function makeFetch(calls) {
  return async (url, init) => {
    init = init || {};
    const method = (init.method || 'GET').toUpperCase();
    const bodyText = init.body == null ? '' : String(init.body);
    let bodyJson = null;
    try { bodyJson = JSON.parse(bodyText); } catch (e) { /* not JSON */ }
    const kind = classify(String(url), method);
    calls.push({ url: String(url), method, kind, bodyText, bodyJson });
    let payload = kind === 'spamCheck' ? { success: true } : kind === 'email' ? { id: 'stub-email-id' } : [];
    for (const s of (cfg.stubs || [])) {
      if (String(url).includes(s.urlContains) && (!s.method || s.method.toUpperCase() === method)) payload = s.respond;
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}

async function run(caseCfg, mode) {
  for (const k of Object.keys(process.env)) if (k.startsWith('FORM_TEST_MODE')) delete process.env[k];
  Object.assign(process.env, cfg.env || {});
  if (mode === 'on') process.env.FORM_TEST_MODE_TO = TEST_TO;
  if (mode === 'notEmail') process.env.FORM_TEST_MODE_TO = 'not-an-email';
  if (mode === 'twoEmails') process.env.FORM_TEST_MODE_TO = TEST_TO + ', second@example.test';
  for (const k of Object.keys(require.cache)) delete require.cache[k];   // fresh module state every run
  const calls = [];
  global.fetch = makeFetch(calls);
  console.log = console.error = console.warn = console.info = () => {};
  let res = null, err = null;
  try {
    const mod = require(path.resolve(baseDir, caseCfg.function));
    res = await mod.handler({ httpMethod: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(caseCfg.payload) }, {});
  } catch (e) { err = e; }
  Object.assign(console, realConsole);
  return { res, err, calls, mode };
}

const emailsOf = r => r.calls.filter(c => c.kind === 'email');
const writesOf = r => r.calls.filter(c => c.kind === 'write');
const recipients = c => ['to', 'cc', 'bcc'].flatMap(f => [].concat((c.bodyJson || {})[f] || []));
const headerValue = r => {
  const h = (r.res && r.res.headers) || {};
  const k = Object.keys(h).find(x => x.toLowerCase() === 'x-form-test-mode');
  return k ? String(h[k]).toLowerCase() : null;
};
const describeCall = c => { const u = new URL(c.url); return c.method + ' ' + u.host + u.pathname; };

function checkNormal(r, c) {
  const p = [];
  if (r.err) return ['function threw: ' + r.err.message];
  const expected = c.expectStatus || 200;
  if (!r.res || r.res.statusCode !== expected) p.push('returned ' + (r.res && r.res.statusCode) + ' instead of ' + expected);
  const emails = emailsOf(r);
  if (!emails.length) p.push('sent no emails - the test payload may not be reaching the email code, so nothing was really checked');
  if (emails.some(e => /^\[TEST\]/.test((e.bodyJson || {}).subject || ''))) p.push('emails carry "[TEST]" in normal mode - the switch is leaking into production behavior');
  const got = emails.flatMap(recipients).map(x => x.toLowerCase());
  const missing = (c.realRecipients || cfg.realRecipients || []).filter(x => !got.includes(x.toLowerCase()));
  if (missing.length) p.push('normal mode did not email the real recipient(s): ' + missing.join(', '));
  const writes = writesOf(r).length;
  if (c.writesExpected != null ? writes !== c.writesExpected : writes === 0) p.push('normal mode made ' + writes + ' record write(s)' + (c.writesExpected != null ? ', expected ' + c.writesExpected : ' - expected at least one, so the write path was not exercised'));
  if (headerValue(r)) p.push('X-Form-Test-Mode header shows up in normal mode');
  return p;
}

function checkTest(r, c, normal) {
  const p = [];
  if (r.err) return ['function threw: ' + r.err.message];
  const expected = c.expectStatus || 200;
  if (!r.res || r.res.statusCode !== expected) p.push('returned ' + (r.res && r.res.statusCode) + ' instead of ' + expected);
  const emails = emailsOf(r);
  emails.forEach((e, i) => {
    const stray = recipients(e).filter(a => a.toLowerCase() !== TEST_TO.toLowerCase());
    if (stray.length) p.push('email #' + (i + 1) + ' would still reach someone other than the test address: ' + stray.join(', '));
    if (!/^\[TEST\]/.test((e.bodyJson || {}).subject || '')) p.push('email #' + (i + 1) + ' subject is not tagged [TEST]');
  });
  const writes = writesOf(r);
  if (writes.length) p.push(writes.length + ' write(s) to real records were NOT skipped: ' + writes.map(describeCall).join('; '));
  const unknown = r.calls.filter(x => x.kind === 'unknown');
  if (unknown.length) p.push('outbound call(s) to hosts the harness does not know: ' + [...new Set(unknown.map(u => new URL(u.url).host))].join(', ') + ' - add them to "hosts" in the test-cases file so they are checked');
  if (c.spamCheck !== false && !r.calls.some(x => x.kind === 'spamCheck')) p.push('the spam check (Turnstile) was not called - it must stay ON in test mode');
  if (headerValue(r) !== 'on') p.push('response is missing the "X-Form-Test-Mode: on" header');
  const normalCount = emailsOf(normal).length;
  if (emails.length !== normalCount) p.push('test mode sent ' + emails.length + ' email(s) but normal mode sends ' + normalCount + ' - test mode must exercise the same email paths');
  return p;
}

function checkRefused(r, label) {
  const p = [];
  const leaked = r.calls.filter(x => x.kind === 'email' || x.kind === 'write');
  if (leaked.length) p.push(label + ': ' + leaked.length + ' email/write call(s) still happened - a broken switch must fail closed');
  const refused = r.err || (r.res && r.res.statusCode >= 500);
  if (!refused) p.push(label + ': the function did not refuse (returned ' + (r.res && r.res.statusCode) + ') - a broken switch must fail closed');
  return p;
}

(async () => {
  let allAsExpected = true;
  for (const c of cfg.cases) {
    const expectFail = c.expectHarness === 'fail';
    const normal = await run(c, 'normal');
    const test = await run(c, 'on');
    const notEmail = await run(c, 'notEmail');
    const twoEmails = await run(c, 'twoEmails');
    const problems = [
      ...checkNormal(normal, c).map(x => '[normal mode] ' + x),
      ...checkTest(test, c, normal).map(x => '[test mode]   ' + x),
      ...checkRefused(notEmail, 'switch set to a non-email').map(x => '[broken switch] ' + x),
      ...checkRefused(twoEmails, 'switch set to two emails').map(x => '[broken switch] ' + x),
    ];
    const passed = problems.length === 0;
    const asExpected = passed !== expectFail;
    if (!asExpected) allAsExpected = false;
    console.log((asExpected ? 'OK   ' : 'BAD  ') + c.name + '  ->  ' + (passed ? 'PASS' : 'FAIL') + (expectFail ? '   (deliberately flawed: this SHOULD fail)' : ''));
    problems.forEach(x => console.log('       - ' + x));
    if (showCalls) [['normal', normal], ['test', test]].forEach(([n, r]) => { console.log('       calls in ' + n + ' mode:'); r.calls.forEach(x => console.log('         ' + x.kind.padEnd(9) + describeCall(x) + (x.kind === 'email' ? '  to=' + recipients(x).join(',') + '  subject=' + ((x.bodyJson || {}).subject || '') : ''))); });
  }
  console.log('\n' + (allAsExpected ? 'RESULT: every case behaved as expected.' : 'RESULT: PROBLEMS FOUND - see BAD lines above.'));
  process.exit(allAsExpected ? 0 : 1);
})();
