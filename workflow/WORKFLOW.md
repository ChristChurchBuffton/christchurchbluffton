# Christ Church Bluffton — Master Workflow

## Project Reorganization (2026-04-03) ✅ COMPLETE
> Reorganized project folder to match the Forged Digital Project Template. New working copy created at `Web Design/Christ Church Bluffton/`. Original untouched in `Clients - Active/`.

### Folder Structure
- `src/` — Deployable site code (Netlify publish directory). Was `live/` in old structure.
- `reference/` — Original site build for content reference. Archived to `archive/reference/`.
- `assets/` — Logos, business info, flyers
- `workflow/` — Project workflows and dev notes
- `comm/` — Client and internal communications
- `decisions/` — Architecture and design decisions
- `notes/` — Scratch notes
- `archive/` — Old/deprecated files (gitignored)
- `server/` — Local dev server for function testing

### Config Changes
- `netlify.toml` — publish dir changed from `live/` to `src/`
- `.gitignore` — updated to ignore `reference/` and `archive/`
- `CLAUDE.md`, `README.md`, `todo.md` — created per template

---

## Phase 1: Original Site Build ✅ COMPLETE
> Original full site built in `src/primary/` (now archived as `reference/`). 10 pages with forest green #1B4332 + muted gold #A0875A color scheme, Cinzel/Lato/Cormorant Garamond fonts.

## Phase 2: Live Site (Give + Contact) ✅ COMPLETE
> Rebuilt with new branding: Navy #303b6a + Gold #c3a355, Lora font. Give page as landing page, contact page, privacy, terms, 404. Shared component architecture (includes/header, footer, prayer FAB).

## Phase 3: Full Site Rebuild (2026-04-03) ✅ COMPLETE
> Rebuilt all pages from reference site into new build with updated branding, layout changes, and new content.

### Pages Built
- [x] **Homepage** (`index.html`) — Hero with candle image, about preview, stats section, vision cards (Worship/Groups/Serve), CTA pill
- [x] **About** (`about.html`) — Mission, vision cards, beliefs (4 pillars), scripture banner, pastor section (Rev. Jonathan Riddle). No leadership section.
- [x] **Join Us** (`join-us.html`) — Upcoming services (May 2, Jun 6, Jul 11, Aug 1 at 5:30 PM Saturday), Lord of Life Lutheran Church location with address, What to Expect, liturgy + worship music columns, Google Map, CTA
- [x] **Groups** (`groups.html`) — Table 246 Bible study, Prayer Groups, Youth Ministry (Coming Soon)
- [x] **Serve** (`serve.html`) — NEW page. 7 ministry cards: Greeting, Safety, Nursery, Lay Readers, Technology, Eucharist, Worship. Each has placeholder container for mission statements.
- [x] **Give** (`give.html`) — Moved from old index.html. Scripture banner, two-column layout, Tithe.ly modal, pastor quote, QR code.
- [x] **Contact** (`contact.html`) — Already existed. Updated hero size to match other pages. Fixed donate CTA link.
- [x] **Privacy/Terms/404** — Carried over from live site, no changes needed.

### Navigation Updates
- [x] Header: Home, About, Join Us, Groups, Serve, Contact + Give (pill button)
- [x] Footer: Two-column quick links (Home/About/Join Us | Groups/Serve/Contact)
- [x] Active nav link highlighting via JS
- [x] Mobile menu with all links + Give button

### Design Decisions
- Hero overlay: neutral grey (not blue/purple tint)
- Hero gold divider line (no logo or cross icon)
- CTA sections: oval pill style (matching contact page pattern)
- Page headers: consistent sizing across all pages (120px/100px padding, clamp title)
- Image placeholders with dashed borders for all photos pending from client
- "Events" replaced with "Serve" (ministry teams page)
- "Worship" renamed to "Join Us" / "Join Us For Services"
- Lord of Life Lutheran Church as service venue with clickable address

### Shared Components
- `includes/header.html` — Logo, 6 nav links, Give pill button, hamburger mobile
- `includes/footer.html` — Branding, two-column quick links, newsletter signup, legal links
- `includes/prayer-fab.html` — Prayer request floating button + popup form
- `css/shared.css` — Header, footer, nav, mobile menu, prayer FAB, accessibility, responsive
- `js/components.js` — Component loader, mobile menu, newsletter handler, prayer form, active nav highlighting

### Breakpoints (shared.css)
- **1023px** — Hide desktop nav + Give, show hamburger. Footer goes single column centered.
- **768px** — Footer adjustments, prayer FAB/popup sizing
- **480px** — Header shrinks to 60px, smaller logo/text
- **360px** — Tightest layout, church location text hides

---

## Phase 3.5: Content Updates (2026-04-10) ✅ IN PROGRESS
> Received pastor bio, mission statement, Easter photos, and ministry team guidelines.

### Content Applied
- [x] Pastor bio updated on about.html (from Jonathan's Palmetto Bluff write-up)
- [x] Mission statement updated on about.html and index.html
- [x] 10 Easter service photos added to `assets/photos/` (converted to webp)
- [x] Serve page rebuilt — alternating left/right layout with mission statements from Ministry Teams Guidelines doc
- [x] Ministry teams on serve page: Greeting & Ushers, Altar Guild, Communion, Lay Readers, Nursery, Musical Worship, Technology & Social Media (Safety removed — not advertised)
- [x] Scroll animations added site-wide (Intersection Observer, fade-in/slide-up)
- [x] Sitemap updated with all 9 pages
- [x] Accessibility: sr-only class, footer form label, footer role
- [x] Lazy loading on all non-hero images
- [ ] Pastor quote — still placeholder, needs Jonathan's preferred wording

### Images Placed (2026-04-10)
- [x] **index.html** — Hero: church-christmas-candle. Rooted in Tradition: worship-welcome-screens. Worship card: worship-music-team. Groups card: youth-group-outing. Serve card: fellowship-conversation.
- [x] **about.html** — Our Mission: sanctuary-behind-altar-wide.
- [x] **join-us.html** — Worship Service: altar-service-helpers.

### Images Still Needed
- [ ] **about.html** — Pastor section: Professional headshot of Rev. Jonathan Riddle
- [ ] **join-us.html** — Book of Common Prayer placeholder (Liturgy section). Worship Music placeholder (Music section).
- [ ] **groups.html** — Table 246 photo. Prayer Groups photo (people praying together). Youth Ministry photo (higher quality than current).
- [ ] **serve.html** — All 7 ministry team photos: Greeting & Ushers, Altar Guild, Communion, Lay Readers, Nursery, Musical Worship, Technology & Social Media
- [ ] **give.html** — Any image placeholders on the page

### Photo Request Sent
- Email drafted: `comm/client/2026-04-10-photo-request.md` — requesting professional Jonathan photo, youth group, small groups, prayer group, and all ministry team photos

---

## Phase 4: Deployment 🚀 EXISTING
> Production site is LIVE at christchurchbluffton.org with Give + Contact pages.
> New full site build needs to be deployed.

### Current Production
- Domain: `christchurchbluffton.org` (GoDaddy DNS → Netlify, SSL active)
- Production repo: `ChristChurchBuffton/christchurchbluffton`
- Testing repo: `ForgedDigital/christ-church-bluffton`
- Netlify publishes from `src/` (updated from `live/`)

### Before Deploying New Build
- [ ] Test Netlify deploy with new folder structure
- [x] Update sitemap.xml with all new pages (done 2026-04-10)
- [ ] Update Google Maps embed with real URL
- [ ] Remove backup files (-previous files)
- [ ] Place all remaining images (see Phase 3.5 image list)
- [ ] Verify all forms work (contact, prayer, newsletter)
- [ ] Breakpoint testing (mobile, tablet, desktop)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Lighthouse audit (Performance, Accessibility, SEO, Best Practices)
- [ ] Submit updated sitemap to Google Search Console

### Env Vars (Netlify)
- BREEZE_URL, BREEZE_API_KEY, BREEZE_EMAIL_FIELD_ID, BREEZE_PHONE_FIELD_ID, BREEZE_TAG_CONTACT
- RESEND_API_KEY, EMAIL_FROM
- TURNSTILE_SECRET_KEY

---

## Phase 5: SEO & Analytics 📊
- GA4: `G-PTWWV0M0DX` (on all pages)
- Google Search Console: verified, sitemap submitted (needs update for new pages)
- JSON-LD structured data on homepage + give page
- Cloudflare Turnstile: `0x4AAAAAACneNwgE844_oOI-`

---

## Quick Reference
| Item | Value |
|---|---|
| Project folder | `Web Design/Christ Church Bluffton/` |
| Active codebase | `src/` (publishes to Netlify) |
| Dev server | `npx http-server src/ -p 3001 -c-1` |
| GitHub (testing) | `ForgedDigital/christ-church-bluffton` |
| GitHub (production) | `ChristChurchBuffton/christchurchbluffton` |
| Production URL | `christchurchbluffton.org` |
| GA4 ID | `G-PTWWV0M0DX` |
| Netlify config | `netlify.toml` (root) |
| Shared CSS | `src/css/shared.css` |
| Shared JS | `src/js/components.js` |
| Shared HTML | `src/includes/` (header, footer, prayer-fab) |
| Logo assets | `assets/logos/` |
| Client | Rev. Jonathan Riddle |
| Billing | Donation (free) |
| Service venue | Lord of Life Lutheran Church, 351 Buckwalter Pkwy, Bluffton SC 29910 |
| Service times | Saturdays at 5:30 PM (May 2, Jun 6, Jul 11, Aug 1) |
