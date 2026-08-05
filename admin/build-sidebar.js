// Regenerates the sidebar nav in every page from includes/sidebar.html.
//
// The sidebar used to be fetched by JS and injected at runtime, which caused a visible
// pop-in on every page load (a real network round-trip has to finish first to know who's
// logged in and what they can see). It's now baked directly into each page's own HTML so
// it's part of the very first paint — but that means it's no longer a single shared file
// automatically kept in sync. If you ever need to add/remove/reorder a nav link, edit
// includes/sidebar.html ONCE, then run:
//
//   node build-sidebar.js
//
// from this folder, and it rewrites the <div id="sidebar-mount">...</div> block in every
// page to match. Never hand-edit the sidebar markup inside an individual page file directly
// — it'll just get overwritten the next time this runs, and the pages will drift apart.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const pages = ['content', 'congregants', 'dashboard', 'account', 'team', 'photos', 'newsletter', 'volunteers', 'events', 'staff', 'prayers', 'subscribers'];

const sidebarHtml = fs.readFileSync(path.join(root, 'includes', 'sidebar.html'), 'utf8').trim();
const mountRegex = /<div id="sidebar-mount">[\s\S]*?<\/div>\s*(?=<div class="main">)/;

// Validate every page FIRST, before writing anything — if the insertion point can't be
// found on even one page, stop with a loud error instead of silently updating the rest
// and leaving that one page's menu out of sync with no indication anything went wrong.
const missing = [];
const contents = {};
for (const page of pages) {
  const file = path.join(root, page + '.html');
  const html = fs.readFileSync(file, 'utf8');
  if (!mountRegex.test(html)) {
    missing.push(page);
  } else {
    contents[page] = html;
  }
}

if (missing.length > 0) {
  console.error(`ERROR: could not find the sidebar-mount block in: ${missing.map(p => p + '.html').join(', ')}`);
  console.error(`Nothing was written. Fix the markup in ${missing.length === 1 ? 'that page' : 'those pages'} (or this script's regex) and re-run.`);
  process.exit(1);
}

for (const page of pages) {
  const file = path.join(root, page + '.html');
  const html = contents[page].replace(mountRegex, `<div id="sidebar-mount">\n${sidebarHtml}\n  </div>\n    `);
  fs.writeFileSync(file, html);
  console.log(`Updated ${page}.html`);
}
