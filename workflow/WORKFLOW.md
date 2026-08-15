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

## Phase 6: Recovery, Visual Audit & Copy Update (2026-07-20)
> Project folder had been mis-swept into `zArchive\Chirst Church Bluffton (DO NOT USE)` during the 2026-07-01 Google Drive → Desktop migration. Recovered and moved back to `Clients - Active\Christ Church Bluffton` (correct spelling) with no data loss.

- [x] Folder recovered from zArchive, path corrected
- [x] Local dev server moved to port 3002 (3001 now used by Praesidium Pro) — must be started with `-e html` flag (`npx http-server src/ -p 3002 -c-1 -e html`) or clean-URL nav links (`/about`, `/contact`, etc.) 404 locally. Production Netlify handles this via `pretty_urls = true` in netlify.toml; plain http-server does not without the flag.
- [x] Full visual + responsive breakpoint audit across all 10 pages (mobile/tablet/laptop/desktop) — layout/reflow clean everywhere, no broken states found. Open items moved to `todo.md` (placeholder images, Serve mission-statement copy, live-domain CAPTCHA check).
- [x] First round of client copy feedback applied: About page beliefs paragraph (plainer language) + Join Us "What to Expect" list (5 new lines) — see `comm/client/2026-07-20-copy-feedback-about-and-what-to-expect.md`
- [x] Serve page mission statements populated 2026-07-21 from client's "Ministry Teams Guidlines.docx" (archived to `comm/client/`) — all 7 existing cards filled, plus new 8th card (Altar Guild) added and 8-card grid confirmed clean at all breakpoints
- [x] Footer redesign 2026-07-21 — tablet/mobile now single-column (was a broken intermediate 2-col layout), Quick Links merged into one unified list (was two visually-gapped stacked lists), newsletter input capped at 260px width
- [x] Prayer Request FAB overlap fix 2026-07-21 — fades out via IntersectionObserver + CSS opacity transition when the footer scrolls into view, instead of permanently reserving padding
- [x] Photo recovery 2026-07-21 — discovered `https://christchurch-bluffton.netlify.app/` (live preview) has real photos that never made it into this repo's git history (confirmed via `git log`, stops at `fcf2613`). Downloaded 8 images from the live site into `src/images/` and wired them into index.html, about.html, join-us.html, groups.html — homepage mission photo, homepage vision cards (new markup added, didn't exist locally before), About mission + pastor photo, Join Us "What to Expect" photo, Groups Table 246 photo. 4 photos remain genuine placeholders (Join Us: Book of Common Prayer + Worship Music; Groups: Prayer Group + Youth Activities) — confirmed no photo exists anywhere for these, including live.
- [ ] **Awaiting further content/comm from Rev. Riddle** — remaining full content review still outstanding (project currently blocked on this).

## Phase 7: Front-End Visual Pass, Full Audit & Launch Standby (2026-07-21 → 2026-07-27) ✅ COMPLETE
> Heads-up given by user 2026-07-21 kicked off a front-end visual pass that grew into a full multi-day security/SEO/accessibility audit and Anglican rebrand. Full itemized detail lives in `todo.md`; this is the condensed phase summary.

- [x] **Visual polish roadmap** (2026-07-21) — navy section texture, gold section-divider accents, consistent photo shadow/border-radius treatment, animated stat counters, hover treatments, one supporting accent color (terracotta, later removed — see rebrand below)
- [x] **Full site audit** (2026-07-23/24) — 3 parallel review passes across all HTML/CSS/JS/serverless functions. Fixed real security gaps (duplicate Turnstile widget, non-functional honeypot wiring, missing CAPTCHA on prayer/newsletter forms), dead code cleanup, broken Google Maps embed (root cause was a CSP `frame-src` block), stale cache headers, full responsive `srcset` rollout
- [x] **Backend/SEO audit** (2026-07-23) — meta tag standardization, dedicated OG images per page, structured data service hours, image compression pass, unused image cleanup
- [x] **Real client photos** (2026-07-26/27) — sourced and placed real (non-stock) photos for Worship vision card and Greeting & Ushers card
- [x] **Anglican rebrand** (2026-07-27, commit `909e952`) — "Anglican" removed sitewide per client request; legal pages, homepage stats, youth sections all updated; found/fixed a leftover visual bug on Join Us liturgy cards along the way
- [x] **Team feedback + badge polish** (2026-07-27, commit `b1be370`) — Prayer Groups marked "Coming Soon" instead of describing an unlaunched ministry as active, new Refreshments & Hospitality ministry card added, and all three "Coming Soon" badges across the site fixed for consistent color/style/spacing (see `todo.md` for full detail)
- [x] **STATUS as of 2026-07-27**: site is ON STANDBY TO GO LIVE — code/backend fully confirmed launch-ready, client will trigger the domain cutover on their own timing (see `todo.md` "Go-Live / Domain Cutover" checklist)

---

## Phase 8: Admin Panel Merge, Live-Form Integration & Team Onboarding (2026-08-03 → 2026-08-05) ✅ COMPLETE
> The Supabase-backed admin panel (built over several earlier sessions as a standalone project) was merged fully into this repo and deployed live at `christchurchbluffton.org/admin`, then connected to the public site's real forms for the first time.

- [x] **Repo merge** (2026-08-03) — admin panel moved from its own separate repo into `src/admin/` here, deployed by the same Netlify build as the public site. Dev-only tooling (`server/`, `supabase/` migrations, `build-sidebar.js`) stays at repo-root `admin/`, outside the deploy path.
- [x] **Performance fix** — page-to-page nav delay traced to a duplicate Supabase profile fetch (`onAuthStateChange` firing both `SIGNED_IN` and `INITIAL_SESSION` on subscribe); fixed with an in-flight guard in `js/shared.js`.
- [x] **Post-merge bugs found & fixed** (2026-08-05) — Content Editor's live preview iframe was fully broken (CSP `frame-src` missing `'self'`, then a stale `<base href>` in 9 site-mirror files once the iframe itself loaded), Photos thumbnails were silently gitignored and never actually deployed.
- [x] **Photos page rebuild** — upload now goes through a naming modal (auto-slugify, JPG-only), and every photo (seeded or uploaded) resolves at `christchurchbluffton.org/a34317d8/<filename>` via a Netlify proxy redirect to Supabase Storage — no deploy needed for new uploads. Copy Link/Delete buttons now pinned to the bottom of every card regardless of filename length.
- [x] **Live site forms wired into the admin panel** — newsletter footer form, contact form, and the prayer request popup all now insert into the real `subscribers`/`prayer_requests` tables (previously only sent email + wrote to Breeze, totally disconnected from this panel). Contact form gained a "would you like someone to follow up?" checkbox (shown only for "Prayer Request") that also logs a prayer request. Prayer popup gained optional email/phone fields and a bug fix so it resets after a successful submission instead of getting stuck on the confirmation screen.
- [x] **Netlify env vars** — `SUPABASE_URL` + `SUPABASE_SECRET_KEY` set on both the `origin` (staging) and `production` Netlify sites (separate accounts/logins) so the live Functions can write to the database.
- [x] **Production deploy** — all of the above pushed to both `origin` and `production`, verified live on the real domain.
- [x] **Team onboarding** — added 2 new real admin accounts (Bradley Chestnut, Treasurer), reset every account's password to a shared distribution temp password except Kevin's own, and set every account's status to "invited" so each person is forced through the real set-your-own-password flow on first login.
- [ ] Dashboard's Recent Activity pagination (12 entries + "Load 10 more") — built, verified on localhost, not yet pushed.
- [ ] `prayers.html` has an uncommitted, unfinished CSS change (3-line text clamp with no way to view the rest) — do not commit as-is.
- [ ] Team-explainer email + admin-panel invite-email template drafted — see `comm/client/` — not sent.

---

## Phase 9: Site Admin Tier, Team Onboarding Follow-Through, Ghost Link Cleanup (2026-08-06) ✅ COMPLETE — pushed to production, all 7 invites sent
> Follow-through on Phase 8's admin panel launch: the real Site Admin role tier (built and shipped earlier as commit `8de01e1`), a fully working Invite flow (discovered broken in production the whole time), and a permission model that actually matches what each role should be able to do.

- [x] **Site Admin role tier** — third tier above Admin/Staff, real RLS enforcement (`admin/supabase/migrations/0008_site_admin_role.sql`), not just UI hiding. Only Site Admins can reach the Accounts page or edit other Admin/Site Admin rows.
- [x] **Real Invite flow, rebuilt twice** — first replaced the dead `localhost:8100` call with a temp-password Netlify Function, then rebuilt again onto Supabase's real magic-link (`generate_link`) with actual email delivery via Resend. Root-caused a silent bug where `redirect_to` nested under `options` was ignored — must be a top-level field on the request body. New `accept-invite.html` landing page consumes the link and sets a real password before landing on the dashboard.
- [x] **Reset Password / Remove rebuilt** — new `admin-team.js` Netlify Function, same dead-backend problem as the old Invite button, now fixed for both admin-initiated actions and self-service "Delete My Account."
- [x] **Password UX pass** — show/hide eye toggle on every password field, autocomplete fixes, no more preloaded value in New Password on Account Settings, "forgot your password" contact line on sign-in, blocking full-screen forced-reset modal that renders in place instead of redirecting away.
- [x] **Staff permission lock** — Staff can never be granted Newsletter, Subscribers, Content Editor, Congregants, or Events, since the role was never meant to reach them; Invite modal now defaults to no permissions checked instead of everything checked.
- [x] **Bradley Chestnut "Worship Pastor" bio section** added to about.html, flipped layout vs. Jonathan's section. Two real Content Editor data bugs found and fixed in the process — see `todo.md` for detail — plus a genuine responsive bug (flipped section never collapsed to single column on mobile) found and fixed via the project's iframe breakpoint-testing protocol.
- [x] **Ghost link (`/a34317d8`) cleanup** — removed the hidden gallery listing page (went stale without a redeploy on every new upload), kept the underlying Supabase Storage proxy so per-photo "Copy Link" URLs are unaffected, and added explicit redirects so the bare folder path shows the real 404 page instead of a raw Supabase error.
- [x] Committed `f1e2bd4`, pushed to both `origin` and `production` — verified live on christchurchbluffton.org (About page breakpoints via computed-style checks at 1440 down to 375px, ghost-link 404s, admin login/Accounts/Content Editor).
- [x] All 6 existing non-Kevin team accounts (incl. Jonathan, added back into scope so everyone goes through the identical real flow) deleted and re-invited through the real magic-link flow, plus a 7th test invite for Kevin (`contact@forgeddigitaldesign.com`) to verify the flow himself. All 3 drafted emails sent by Kevin.
- [x] GSC follow-up: requested re-indexing for `/about`; reviewed the legacy "Indexed, though blocked by robots.txt" warning and confirmed it's stale pre-launch data already mid-validation (started 8/1) — no action needed, just a check-back in ~mid-August.

---

## Phase 10: Admin Cleanup, Logo/Footer Rebuild & Loading-Screen Polish (2026-08-13 → 2026-08-15) — PUSHED TO `origin` ONLY, standing by on `production`
> Admin URL/activity-log cleanup and Greeters onboarding, then a full public-site logo refresh and footer rebuild modeled on Traditions Field Club, then a redo of the homepage loading-screen animation. All three commits (`e9ed372`, `49cb84d`/`bf80e9e`, `0bca5fc`) pushed to `origin` (staging) only — holding on `production` for Kevin's go-ahead.

- [x] **Admin clean-URL + Dev Update fix** (commit `e9ed372`) — stripped `.html` from internal admin links, removed a fake "Dev Update" activity-log entry, uploaded 22 Greeters volunteers. Cross-checked 4 Greeters with missing team assignments against source Word docs (see `todo.md` for findings) — one correction (Maury Moody) found but deliberately left unapplied per Kevin's call to revisit later.
- [x] **Site-wide spacing/overflow fixes + PNG upload support** (commit `49cb84d`) — see `todo.md` for detail.
- [x] **Public-site logo refresh + 4-column footer rebuild** (commit `bf80e9e`) — new footer logo (stacked crest-over-wordmark, matching the loading-screen logo) replacing the old side-by-side version; footer rebuilt from a single narrow bar into a 4-column layout (Branding / Quick Links / Contact / Stay Updated) modeled directly on Traditions Field Club's footer, including Instagram/Facebook "Coming Soon" rows, gold column headers, and a full 320–1440px+ breakpoint sweep (caught and fixed a real logo-size regression at 768px). Source logo files archived to `assets/logos/` with descriptive names. Full detail in `christ-church-bluffton-notes` memory.
- [x] **Loading-screen animation redo** (commit `0bca5fc`) — "Welcome Home" subtext changed from a scale-pop to a letter-spacing reveal, recolored to warm cream, fade-out duration extended 2.5s → 3s. Found and fixed a real CSS cascade-order bug that had been silently locking the subtext at its smallest size on every screen width. Full detail in `christ-church-bluffton-notes` memory.
- [x] Reviewed the live `origin` staging deploy (`christchurch-bluffton.netlify.app`) after each push to confirm it matched localhost.
- [ ] **Production push still pending** — Kevin is standing by for the go-ahead; at that moment, insert a real `dev_update` activity-log row timestamped to the actual go-live, not before.

---

## Quick Reference
| Item | Value |
|---|---|
| Project folder | `Web Design/Christ Church Bluffton/` |
| Active codebase | `src/` (publishes to Netlify) |
| Dev server | `npx http-server src/ -p 3002 -c-1 -e html` |
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
