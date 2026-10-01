'use strict';
// Content Editor engine — the text/HTML logic behind Publish and Preview. Pure functions: no
// network, no database. It takes a page's HTML plus the saved editor records and returns the
// HTML with those edits applied.
//
// The hard part is that an editor record only knows its text ("Join us for worship") while the
// page file holds HTML ("Join us for&nbsp;worship", "youth@<wbr>church.org", "&mdash;"). So a
// record is located by an entity- and inline-tag-tolerant match, and a record that has been
// published before is located by the exact HTML that was inserted last time. A match must be a
// whole run of text between tags (the same rule the editor uses when it binds a record to the
// page), so "Give" never matches inside "Give Now".

const INLINE = 'wbr|br|span|a|em|strong|b|i|u|small|cite|mark|sup|sub';
const VOID = new Set(['br', 'wbr', 'img', 'input', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track']);
const NAMED = {
  ' ': ['nbsp'], '&': ['amp'], '<': ['lt'], '>': ['gt'], '"': ['quot'], "'": ['apos'],
  '—': ['mdash'], '–': ['ndash'], '’': ['rsquo'], '‘': ['lsquo'],
  '“': ['ldquo'], '”': ['rdquo'], '…': ['hellip'], '©': ['copy'],
  '®': ['reg'], '™': ['trade'], '·': ['middot'], '•': ['bull'],
  '→': ['rarr'], '←': ['larr'], '↑': ['uarr'], '↓': ['darr'], '×': ['times'],
  '÷': ['divide'], '«': ['laquo'], '»': ['raquo'], '°': ['deg'], '½': ['frac12'],
  'é': ['eacute'], 'è': ['egrave'], 'ñ': ['ntilde'], '✓': ['check']
};

function escapeRe(c) { return c.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'); }

// One character of text -> every way the HTML source might write it.
function charPattern(ch) {
  if (/\s/.test(ch)) return '(?:\\s|&nbsp;|&#160;|&#[xX]0*[aA]0;)';
  const cp = ch.codePointAt(0);
  const alts = [escapeRe(ch)];
  if (cp > 127 || '&<>"\''.includes(ch)) {
    alts.push('&#0*' + cp + ';');
    alts.push('&#[xX]0*(?:' + cp.toString(16).toLowerCase() + '|' + cp.toString(16).toUpperCase() + ');');
    (NAMED[ch] || []).forEach(n => alts.push('&' + n + ';'));
  }
  return '(?:' + alts.join('|') + ')';
}

const TAGS_BETWEEN = '(?:<\\/?(?:' + INLINE + ')\\b[^>]*>)*';

// Whitespace runs in the record collapse to one "any whitespace" token; inline tags are allowed
// between any two characters (that's what a "whole paragraph with a link in it" record needs).
function buildRegex(text) {
  const chars = Array.from(text.trim());
  const parts = [];
  let prevSpace = false;
  chars.forEach(ch => {
    const isSpace = /\s/.test(ch);
    if (isSpace && prevSpace) return;
    parts.push(isSpace ? charPattern(' ') + '+' : charPattern(ch));
    prevSpace = isSpace;
  });
  // A leading/trailing tag group is not allowed here: the match must START on the first text
  // character and END on the last one; balance() below decides about surrounding tags.
  const body = parts.join(TAGS_BETWEEN);
  return new RegExp('(?<=>\\s*)' + body + '(?=\\s*<)', 'g');
}

// Zones edits must never land in: <head>, scripts, styles, comments, svg. Everything before
// <body> and after </body> is excluded when the file has a body (page files); include files
// (header/footer) have none and are scanned whole.
// Areas the editor never binds a record to (its NEVER_EDITABLE_SELECTOR): the footer's own link
// list and legal/credit lines, the copyright line, the phone-menu copy of the nav, the loading
// screen. Publish must skip the very same areas, or a record whose wording also appears there
// ("Contact" as a Quick Link AND as the footer heading) would edit the wrong place.
const NEVER_CLASSES = new Set(['footer-links-list', 'footer-legal', 'footer-powered', 'copyright', 'mobile-menu']);
function findClose(html, from, name) {
  const re = new RegExp('<(/?)' + name + '\\b[^>]*>', 'gi');
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0].endsWith('/>')) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return null;
}
function classZones(html) {
  const zones = [];
  const re = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const name = m[1].toLowerCase();
    if (VOID.has(name) || m[0].endsWith('/>')) continue;
    const cls = /\bclass="([^"]*)"/.exec(m[2]);
    const id = /\bid="([^"]*)"/.exec(m[2]);
    const hit = (cls && cls[1].split(/\s+/).some(c => NEVER_CLASSES.has(c))) || (id && id[1] === 'loader');
    if (!hit) continue;
    const end = findClose(html, m.index + m[0].length, name);
    if (end) zones.push([m.index, end]);
  }
  return zones;
}

function excludedZones(html) {
  const zones = classZones(html);
  const bodyOpen = /<body\b[^>]*>/i.exec(html);
  if (bodyOpen) {
    zones.push([0, bodyOpen.index + bodyOpen[0].length]);
    const bodyClose = html.lastIndexOf('</body>');
    if (bodyClose !== -1) zones.push([bodyClose, html.length]);
  }
  // Dropdown choices and text boxes are form machinery (the Contact form's options even decide
  // which auto-reply is sent) — never page copy, never edited here.
  const re = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<svg\b[\s\S]*?<\/svg>|<select\b[\s\S]*?<\/select>|<textarea\b[\s\S]*?<\/textarea>/gi;
  let m;
  while ((m = re.exec(html))) zones.push([m.index, m.index + m[0].length]);
  return zones;
}
function inZone(zones, s, e) { return zones.some(([zs, ze]) => s < ze && e > zs); }

// If the matched run opens an inline tag it doesn't close (or closes one it didn't open), grow
// the span outward over the matching tag so the replacement never leaves a stray <a> or </a>.
function balance(html, s, e) {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  const seg = html.slice(s, e);
  const stack = [];
  const excessCloses = [];
  let m;
  while ((m = tagRe.exec(seg))) {
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (VOID.has(name) || m[3] === '/') continue;
    if (!closing) stack.push(name);
    else if (stack.length && stack[stack.length - 1] === name) stack.pop();
    else excessCloses.push(name);
  }
  let start = s, end = e;
  for (let i = stack.length - 1; i >= 0; i--) {
    const closeRe = new RegExp('^\\s*<\\/' + stack[i] + '\\s*>', 'i');
    const mm = closeRe.exec(html.slice(end));
    if (!mm) return null;
    end += mm[0].length;
  }
  for (let i = 0; i < excessCloses.length; i++) {
    const openRe = new RegExp('<' + excessCloses[i] + '\\b[^>]*>\\s*$', 'i');
    const mm = openRe.exec(html.slice(0, start));
    if (!mm) return null;
    start -= mm[0].length;
  }
  return { start, end };
}

// Every place the record's text can be found, in file order.
//   - a record that was published before has an exact HTML string (mode 'exact')
//   - a never-published record has plain text from the original page (mode 'text')
// The animated number counters on the Home page ("2.4B+") hold "0" as their visible text and keep
// the real number in data attributes, so they are found by the text they will count up to.
const COUNTER_RE = /<span\b[^>]*\bclass="[^"]*\bstat-number\b[^"]*"[^>]*\bdata-count="([^"]*)"[^>]*>[^<]*<\/span>/gi;
function counterExpected(open) {
  const count = /\bdata-count="([^"]*)"/.exec(open);
  if (!count) return null;
  const dec = parseInt((/\bdata-decimals="([^"]*)"/.exec(open) || [, '0'])[1], 10) || 0;
  const suf = (/\bdata-suffix="([^"]*)"/.exec(open) || [, ''])[1];
  return parseFloat(count[1]).toFixed(dec) + suf;
}
function counterSpans(html, zones, wantText) {
  const out = [];
  COUNTER_RE.lastIndex = 0;
  let m;
  while ((m = COUNTER_RE.exec(html))) {
    const openEnd = m[0].indexOf('>') + 1;
    const open = m[0].slice(0, openEnd);
    if (counterExpected(open) === wantText && !inZone(zones, m.index, m.index + m[0].length)) {
      out.push({ start: m.index, end: m.index + m[0].length, counter: { open } });
    }
  }
  return out;
}

// True when the text between [s, e) is a whole run of text between tags (not a piece of a longer
// sentence) — the same rule the editor uses when it binds a record to the page.
function isWholeRun(html, s, e) {
  return /(?:>|^)\s*$/.test(html.slice(Math.max(0, s - 200), s)) && /^\s*(?:<|$)/.test(html.slice(e, e + 200));
}

function locateAll(html, live, zones) {
  const spans = [];
  if (live.mode === 'exact') {
    let from = 0;
    for (;;) {
      const i = html.indexOf(live.value, from);
      if (i === -1) break;
      const e = i + live.value.length;
      if (!inZone(zones, i, e) && isWholeRun(html, i, e)) spans.push({ start: i, end: e });
      from = i + Math.max(1, live.value.length);
    }
  } else {
    const re = buildRegex(live.value);
    let m;
    while ((m = re.exec(html))) {
      const s = m.index, e = s + m[0].length;
      if (re.lastIndex === m.index) re.lastIndex++;
      if (inZone(zones, s, e)) continue;
      const b = balance(html, s, e);
      if (b) spans.push(b);
    }
  }
  const wantText = live.mode === 'exact' ? live.value : live.value;
  counterSpans(html, zones, wantText).forEach(c => spans.push(c));
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

// A counter edited to a number-plus-suffix ("3.1B+", "2,500+" is not one — commas end the
// pattern) keeps counting up: its data attributes are rewritten. Anything else becomes a plain
// static number/label in the same styling.
function counterReplacement(counter, next) {
  const open = counter.open;
  const plain = next.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const hasMarkup = /<[a-z]/i.test(next);
  const num = /^(\d+(?:\.(\d+))?)(\S*)$/.exec(plain);
  const strip = tag => tag.replace(/\s+data-(?:count|decimals|suffix)="[^"]*"/g, '');
  if (num && !hasMarkup) {
    const escAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    let tag = strip(open).replace(/>$/, '');
    tag += ' data-count="' + num[1] + '"';
    if (num[2]) tag += ' data-decimals="' + num[2].length + '"';
    if (num[3]) tag += ' data-suffix="' + escAttr(num[3]) + '"';
    return tag + '>0</span>';
  }
  return strip(open) + next + '</span>';
}

// rows: [{ key, live: {mode, value}, next: '<html to insert>' | null }] in the editor's own binding
// order. Each row takes the first not-yet-used place its text appears (exactly what the editor
// does), so duplicate wording across boxes lines up with the right box. A row whose `next` is
// null is only there to hold its place. Returns { html, failed: [{key, reason}] }.
function applyRows(html, rows) {
  const zones = excludedZones(html);
  const used = [];
  const cache = new Map();
  const edits = [];
  const failed = [];
  rows.forEach(row => {
    const ck = row.live.mode + '\u0000' + row.live.value;
    if (!cache.has(ck)) cache.set(ck, locateAll(html, row.live, zones));
    const spans = cache.get(ck);
    const free = sp => !used.some(u => sp.start < u.end && sp.end > u.start);
    const span = spans.find(free);
    if (!span) {
      if (row.next !== null) {
        // Already there? (A publish that saved the page but not its "published" note is safe to
        // repeat: the new wording is on the page, so there is nothing left to do for this box.)
        const done = locateAll(html, { mode: 'exact', value: row.next }, zones).find(free);
        if (done) { used.push(done); return; }
        failed.push({ key: row.key, reason: 'not found on the page' });
      }
      return;
    }
    used.push(span);
    if (row.next !== null) edits.push({ key: row.key, span, next: row.next });
  });
  edits.sort((a, b) => b.span.start - a.span.start);
  let out = html;
  let prevStart = Infinity;
  edits.forEach(ed => {
    if (ed.span.end > prevStart) { failed.push({ key: ed.key, reason: 'overlaps another edit' }); return; }
    const replacement = ed.span.counter ? counterReplacement(ed.span.counter, ed.next) : ed.next;
    out = out.slice(0, ed.span.start) + replacement + out.slice(ed.span.end);
    prevStart = ed.span.start;
  });
  return { html: out, failed, used };
}

// ---- Turning editor records into rows ----

// What text is on the real page for this record right now.
function liveOf(rec) {
  if (rec.published != null && rec.published !== '') return { mode: 'exact', value: rec.published };
  return { mode: 'text', value: (rec.original || '').trim() };
}

// A field record: {original, value, published}. It needs an edit when its saved value differs from
// what's live (published, or the original wording before the first publish).
function fieldRow(key, rec) {
  const live = liveOf(rec);
  const liveValue = live.mode === 'exact' ? live.value : live.value;
  const changed = (rec.value != null) && rec.value !== liveValue;
  return { key, live, next: changed ? String(rec.value) : null };
}

// ---- Photo files ----
// Images are swapped in place under their existing filenames (the site's own convention — see
// netlify.toml: images "get overwritten in place under the same filename"), so no HTML changes.
// Returns the list of {file, path} that must be committed for a record with a saved swap.
function imageFilesToCommit(rec) {
  if (!rec.replacement_path) return [];
  const variants = Array.isArray(rec.replacement_variants) && rec.replacement_variants.length
    ? rec.replacement_variants
    : [{ file: rec.file, path: rec.replacement_path }];
  return variants.map(v => ({ file: v.file, path: v.path }));
}
function imageIsDraft(rec) {
  return (rec.replacement_path || null) !== (rec.published_replacement_path || null);
}

// ---- Sitemap ----
function setSitemapLastmod(xml, pathName, isoDate) {
  const re = new RegExp('(<loc>[^<]*' + pathName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</loc>\\s*<lastmod>)[^<]*(</lastmod>)');
  return re.test(xml) ? xml.replace(re, '$1' + isoDate + '$2') : xml;
}

module.exports = { buildRegex, excludedZones, locateAll, applyRows, liveOf, fieldRow, imageFilesToCommit, imageIsDraft, setSitemapLastmod, balance };
