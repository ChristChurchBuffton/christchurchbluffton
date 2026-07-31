# Christ Church Bluffton — TODO

## STATUS (2026-07-27): ON STANDBY TO GO LIVE. Code/backend is fully confirmed launch-ready — client will trigger the actual domain cutover on their own timing. See "Go-Live / Domain Cutover" below for the exact checklist for that moment.

## Pre-Launch Punch List (2026-07-31) — working one at a time before tomorrow's push
Blocking:
- [x] 1. Commit today's schedule changes (index.html/join-us.html Aug 1 + Sept 5th edits, todo update) — done, commit `82cddbb`, not yet pushed to `origin` per instruction (pushing after all steps done)
- [x] 2. Domain cutover checklist — CHECKED 2026-07-31 LIVE: DNS already resolves `christchurchbluffton.org` + `www` to Netlify (75.2.60.5), SSL already valid (HTTPS 200, HSTS present). No DNS change needed — domain is already pointed at Jonathan's production Netlify site (it's currently serving the Coming Soon page). The actual go-live push itself is tracked separately now, see "Launch Day Walkthrough" below.
- [x] 3. Confirm GA4 (`G-PTWWV0M0DX`) is receiving data — CHECKED 2026-07-31 LIVE in GA account: data stream correctly registered to `https://christchurchbluffton.org`, "Receiving traffic in past 48 hours," 1,264 views / 62 active users over last 28 days across all real pages (this is dev/testing-site traffic, not public — real site isn't live yet, tag will pick up real traffic automatically once pushed). ⚠️ Flagged: "Key events" shows 0.00 across all 28 days — no contact/prayer/newsletter form submission has ever fired a conversion event. Do one live test submission of each form right after launch to confirm they're wired up.
- [x] 4. Sitemap resubmit + robots.txt fix — CHECKED 2026-07-31: both require the live push first (robots.txt on production currently `Disallow: /`, sitemap 404s). Moved to Launch Day Walkthrough steps 5-8, not a separate pre-launch action.

Not blocking, but still open:
- [x] 5. Pastor quote — confirmed complete by client 2026-07-31, existing text on about.html is final
- [x] 6. Table 246 photo — closed 2026-07-31 per client, more photos to come later, not a launch blocker
- [x] 7. Cross-browser test — CLOSED 2026-07-31: Chrome/Edge covered (checked homepage + join-us at 375px/768px, both clean). Firefox low-risk, nothing exotic in the CSS. Safari — Kevin will check on his personal iPhone (no prior Safari-specific issues on this project historically), accepted as good enough, not blocking launch.
- [x] 8. Lighthouse audit — DONE 2026-07-31 on homepage: Performance 70 (mostly local-dev-server artifacts — no gzip/caching/minification on `npx http-server`, will be better on real Netlify), Accessibility 90→96, Best Practices 96, SEO 92→100. Fixed same day: footer heading order (h4→h2, skipped h3), 3 honeypot fields missing `aria-hidden`, one generic "Learn More" link text. One `console.error` from Cloudflare Turnstile (code 110200 = domain not allowed) — expected on localhost since the sitekey is domain-locked to the real site, not a real bug.
- [x] 9. Color contrast (WCAG AA) review — FIXED 2026-07-31, all 9 flagged issues: all 7 gold buttons sitewide (white→#333 dark charcoal, 5.23:1) — homepage hero buttons, Groups, Join Us, Serve, and all 3 "Give" buttons (header/mobile menu/footer); footer "BLUFFTON" text + newsletter Subscribe button (gold #c3a355→#c9ac66, 4.44:1→4.89:1). Verified live on every affected page.
- [x] 9b. Gold "eyebrow" label text sitewide — FIXED 2026-07-31: `.page-label` (5 pages, navy header band, 5 instances) → `#c9ac66`, 4.44:1→4.89:1. `.section-label` (5 pages, light/white sections, 16 instances) → switched to existing `--gold-text` (#7F6D34, already used elsewhere for hover states, no new color introduced), 2.19-2.42:1→5.07:1 on white / 4.61:1 on lightest-gray. Verified live on Groups + Home. Full color-contrast pass (9+9b) now complete — 30 total instances fixed across the site.

## Backend SEO Re-Review (2026-07-31, second pass after today's edits)
- [x] Titles/meta descriptions/canonicals/OG tags — checked all 10 pages, all correct and within length limits. Two "mismatches" my script initially flagged were false positives (`&amp;` in `<title>` vs raw `&` in attribute content — same rendered text, both valid).
- [x] JSON-LD structured data (index.html + give.html) — both still valid JSON, unaffected by today's edits.
- [x] Sitemap.xml — all 9 real pages present, correct priorities, `lastmod` already set to 2026-08-01 (launch day). No changes needed, already launch-ready.
- [x] robots.txt (in `src/`) — still correct (`Allow: /` + sitemap link), unaffected by today's edits.
- [x] Internal links — crawled every `href` sitewide, all resolve to real pages, zero broken links.
- [x] Image alt text — all 32 images sitewide have alt attributes.
- [x] Heading order — **found + fixed 2 pre-existing issues** (not caused by today's button/color work): about.html's 4 belief cards (Scripture/Creeds/Sacraments/Historic Episcopate) were `h4` directly under an `h2`, skipping `h3` — bumped to `h3`. privacy.html + terms.html had all section headings as `h3` directly under `h1`, skipping `h2` — bumped to `h2`. All 9 pages now have exactly one H1 and zero heading-level skips.
- [x] Re-ran Lighthouse on Home, About, Join Us, Privacy after fixes — all 4 now score **100/100 Accessibility, 100/100 SEO**.

## Team feedback (2026-07-27) — pushed to testing site, commit `b1be370`
Team (Karen/Judy et al.) sent 3 pieces of feedback after reviewing the site. Response logged in full at `comm/client/2026-07-27-team-feedback-table246-prayer-refreshments.md`.
- [x] **Table 246 photo** — flagged as actually being from a discontinued coffee gathering, not a real Table 246 group. Decision: leave in place for now (no change made) until Karen/Judy can supply a real photo. See correction note under Photos Needed below.
- [x] **Prayer ministry listed too early** — ministry hasn't launched yet (pending Jonathan meeting with Pastoral Care teams), but the Groups page "Prayer Groups" section described it in present tense as already meeting with an active prayer chain. Rewrote to planning-stage language, added the same gold "Coming Soon" badge/pattern used for Youth Ministry, and changed the CTA from "Join in Prayer" to "Let Us Know You're Interested."
- [x] **Refreshments volunteers needed** — added a new 9th ministry card on the Serve page, "Refreshments & Hospitality," noting volunteers are needed for post-service cookies and lemonade. New photo sourced (free-licensed, Unsplash) and processed to match the other 8 cards (`ministry-refreshments.webp` / `-700.webp`).
- [x] **Bonus fix from user review**: homepage Youth Ministry spotlight badge was using an orphaned `--accent-terracotta` (red) color instead of gold, inconsistent with the two Groups-page badges — fixed to gold.
- [x] **Bonus polish from user review**: all three "Coming Soon" badges (homepage Youth spotlight, Groups Youth Ministry, Groups Prayer Groups) made bolder/bigger/uppercase with a soft gold glow, and their surrounding spacing was found to be wildly inconsistent (40px/15px/4px above, 20px/60px/18px below across the three) due to stacked/leftover margins — standardized to consistent, deliberate spacing (15px above for the two divider-based badges, ~16px for the homepage inline one; 24px below on all three) via a scoped `#youth-ministry .section-header` override rather than touching the sitewide `.section-header` class.

## Anglican rebrand (2026-07-27) — pushed live to testing site, commit `909e952`
Client requested "Anglican" be removed from the site entirely (denomination is stepping back from that label). Full scope:
- [x] Removed "Anglican" from every page title, meta/OG/Twitter tag, JSON-LD schema (index.html + give.html), body copy, and the shared footer tagline/copyright — verified zero remaining matches across all of `src/` (every file type, not just HTML)
- [x] Legal pages (Terms/Privacy): the registered legal entity name is still "Christ Church Anglican Bluffton, Inc." — client hasn't filed an actual legal rename yet. Per client's own call ("can we not have the legal name?"), dropped the full legal name entirely rather than invent one — both docs now just say "Christ Church Bluffton" throughout, including the 501(c)(3)/liability clauses. **When the client actually completes a legal name change with the state, swap in the real new name at that point** — don't guess at one before then.
- [x] Liturgical practice kept as-is per client (BCP, sacraments, creeds, "Historic Episcopate" belief card) — only the word "Anglican" itself and denominational-label phrases ("Anglican liturgy," "Anglican priest," "Anglican worship") were reworded to generic historic/liturgical language
- [x] Homepage stats swapped from Anglican Communion figures to general Christian stats: 85M+ Anglicans → **2.4B+ Christians Worldwide** (Pew Research), 165 Countries → **Nearly 2x, Gen Z Church Attendance Since 2020** (Barna Group's *State of the Church* 2025 study — not the UK "Quiet Revival" report, which Bible Society retracted in 2026 after a YouGov data error). "2000+ Years of Tradition" was untouched since it was never Anglican-specific.
- [x] Added the same Gen Z/Barna data as supporting copy to both youth sections (homepage "A Heart for Our Youth" + Groups page Youth Ministry) — worded differently on each page to avoid duplicate content
- [x] Fixed unrelated visual bug found during the pass: Join Us "Liturgy & Music" cards had a leftover tan placeholder background showing below the real photos (forced `aspect-ratio: 4/3` no longer matched the actual images) — removed the aspect-ratio override, verified fixed at all breakpoints
- [x] Full backend + frontend + text-size re-review after all changes — clean, no other issues found
- [x] Committed (`909e952`) and pushed to `origin/main` — Netlify testing site rebuilding as of today

## Deploy workflow clarified (2026-07-27)
- Single git remote (`origin` → `ForgedDigital/christ-church-bluffton`) — confirmed via `git remote -v`, there is no second remote configured locally
- Client's own git client shows a Windows Credential Manager account picker on push (3 cached identities: ForgedDigital, traditionsfieldclub, ChristChurchBuffton) — **selecting "Christ Church" there is the client's manual, deliberate live-deploy trigger**, done on their own machine/timing, not something exposed to Claude as a tool
- Confirmed: every push made by Claude this whole project resolved automatically with the ForgedDigital credential, no picker ever appeared — Claude's pushes structurally cannot reach the live deploy path, only the testing site
- **2026-07-27 update**: Claude's pushes went silent for the first time today — Windows Git Credential Manager's cached token had expired, and Claude's shell tools (Bash/PowerShell, no TTY) can't complete GCM's interactive re-login. Confirmed this is environment-wide (same failure reproduced on Praesidium Pro, an unrelated repo), not specific to this project. Fix: one manual `git push` run by Kevin via the `!` prefix refreshes the cached token, after which Claude's pushes work silently again — until the token next expires. This is a recurring possibility going forward, not a one-time bug.
- Backend pre-launch review (2026-07-27) — confirmed clean: netlify.toml (build/redirects/headers), all 3 serverless functions (syntax valid), no hardcoded secrets in tracked files, `.env` properly gitignored, no debug/TODO leftovers, git fully synced with origin
- [x] Found + fixed: unused root-level `package.json` (puppeteer dependency, unrelated to the deployed site) would have triggered an unnecessary `npm install` + Chromium download on every Netlify build — removed from the repo, backed up to sibling folder `Christ Church Bluffton - Root Files Backup/`

## Real Client Photos (2026-07-26/27)
- [x] Reviewed 5 real photos from the church (not stock) found in Downloads — 2 are now in use, 3 archived for later
- [x] Homepage "Worship" vision card — swapped the low-quality/cropped photo for the Bible+guitar photo already used on Serve page's Musical Worship section (same file, `ministry-musical-worship.webp`), for visual consistency and better quality
- [x] Serve page "Greeting & Ushers" — replaced the stock Pexels handshake photo with a real photo of an actual greeter handing a bulletin to arriving members at Christ Church Bluffton (`ministry-greeting-ushers.webp`, re-shot at 1400x933 + 700x467 mobile), alt text updated to match
- [x] Archived the 3 unused real photos (pastor preaching, staff team candid, greeters in fellowship hall, usher "Rob") into a new folder `Christ Church Bluffton - Client Photos/` (sibling to the project, outside git) in case needed for future updates — originals also still sit in `Downloads/`, untouched

## Coming Soon page (2026-07-28) — pushed live to PRODUCTION repo/domain
Discovered during pre-launch audit that `christchurchbluffton.org` was showing a bare "404 Not Found" placeholder (committed directly to the production repo `ChristChurchBuffton/christchurchbluffton` back in April, "Temporarily take down site — client request"). That repo has never had the finished site pushed to it — only an old early build, then the takedown commit.
- [x] Built a standalone "Coming Soon" page (own folder `coming-soon/`, not part of `src/`) — logo, countdown to Saturday Aug 1 9:00 AM Eastern, Acts 2:46 (ESV) verse (same wording as the real site's About/Give/Groups pages), Open Graph image (logo only, `images/og-image.png`) for link previews
- [x] Pushed directly to `ChristChurchBuffton/christchurchbluffton` (main) and confirmed live on the real domain — commits `994a79d` (page) and `03a742c` (OG image). Push worked cleanly with no credential picker/auth issue, contrary to the old assumption that Claude's pushes can't reach production — worth re-testing that assumption before the real cutover too.
- [ ] **IMPORTANT — on the next (real launch) push**: this Coming Soon page must be removed/replaced, not left in the repo. Either delete `index.html`/`images/og-image.png`/`images/logo.png` from the production repo when pushing the real `src/` site over it, or archive the coming-soon files (e.g. copy to `archive/` or the local `coming-soon/` folder is already the source of truth) before overwriting. Do not let the countdown page linger post-launch.

## Launch Day Walkthrough — the actual go-live push (moved out of Pre-Launch Punch List 2026-07-31, do this last, step by step, confirm before each push)
Pre-flight (already confirmed 2026-07-31, no action needed):
- [x] `christchurchbluffton.org` DNS already points to the correct Netlify site (75.2.60.5) — no DNS change needed
- [x] SSL already valid on the domain (HTTPS 200, HSTS present)
- [x] `src/robots.txt` already correct (`Allow: /` + sitemap link) and `src/sitemap.xml` already valid — just need to actually reach production (see steps below)
- [x] GA4 tag (`G-PTWWV0M0DX`) already in every page of `src/` and already confirmed sending data to the right property

The push itself:
1. [ ] Add the production repo as a git remote (e.g. `git remote add production https://github.com/ChristChurchBuffton/christchurchbluffton.git`) — `origin` only points at the testing repo
2. [ ] Push local `main` (with today's commit `82cddbb` + anything after) to the production repo's `main` branch
3. [ ] Confirm the push removed/overwrote the Coming Soon files (`index.html`, `images/og-image.png`, `images/logo.png`) — do not leave the countdown page live post-launch
4. [ ] Load `https://christchurchbluffton.org` in a real browser (cache-busted) and click through all 10 pages to confirm the real site is live, not a stale cached Coming Soon page
5. [ ] Verify `https://christchurchbluffton.org/robots.txt` now shows `Allow: /` (not the old `Disallow: /`)
6. [ ] Verify `https://christchurchbluffton.org/sitemap.xml` now returns 200, not 404
7. [ ] In GSC, manually resubmit `https://christchurchbluffton.org/sitemap.xml` (Sitemaps tab) rather than waiting on Google's own recrawl schedule
8. [ ] In GSC, use URL Inspection → "Request Indexing" on the homepage and a couple of key pages (join-us, about) to speed up re-crawling now that robots.txt allows it
9. [ ] Submit one real test through each of the 3 forms (contact, prayer request, newsletter) on the live domain and confirm: (a) the email arrives, (b) a GA4 Key Event fires — this has never been confirmed, GA4 currently shows 0 Key Events across 28 days of testing
10. [ ] Confirm GA4 Realtime shows active users while doing the above (proves the tag is firing on the real domain, not just the testing site)
11. [ ] Decide/confirm a rollback plan if something breaks right after cutover (e.g. revert the production repo to the Coming Soon commit)

## Full Site Audit (2026-07-23/24) — all HTML/CSS/JS/serverless functions reviewed line-by-line via 3 parallel review passes
- [x] **Security gap, fixed**: contact form had TWO Cloudflare Turnstile widgets rendering on one form (one force-hidden via `!important` CSS instead of just not existing) — `turnstile.getResponse()` was grabbing an unspecified widget's token, which risked failing CAPTCHA verification unpredictably. Removed the duplicate, kept one widget.
- [x] **Security gap, fixed**: the honeypot anti-spam field was checked server-side in all 3 Netlify functions, but the client-side JS (contact.html, and the newsletter/prayer handlers in components.js) never actually included it in the POST payload — meaning the server-side honeypot check could never fire. Now wired through on all 3 forms.
- [x] **Security gap, fixed and confirmed live 2026-07-24**: prayer request and newsletter signup forms now have real Cloudflare Turnstile verification (previously only had the honeypot). Built a second, separate Turnstile widget ("Christ Church Bluffton - Prayer & Newsletter", site key `0x4AAAAAAD8314cvz8A6O5m4`) set to Invisible mode so it adds zero visible friction — contact form keeps its original visible widget on its own site key. New secret key stored as `TURNSTILE_SECRET_KEY_INVISIBLE` in both Netlify accounts (Kevin's live testing site and Jonathan's not-yet-live production site) and in local `server/.env`. Client tested both forms live after deploy — both passed. Also added the required Cloudflare Turnstile privacy disclosure to `privacy.html`.
- [x] **Decision made 2026-07-24**: prayer requests no longer create a Breeze CRM record at all — removed entirely per client request, email-only now (see `prayer.js`).
- [x] Fixed a real path bug in the local dev server (`server/server.js`) — it pointed at `src/primary/`, which doesn't exist (would 500/404 everything on a fresh restart; the currently-running dev process just has the old correct path cached in memory from before a folder reorg). Fixed to `src/`.
- [x] Fixed stale "Weekly Schedule Coming Soon" text in the homepage hero info bar — contradicted the site's own established Saturday 5:30 PM service time (now shows "Saturdays at 5:30 PM")
- [ ] **On hold per client 2026-07-24**: `join-us.html`'s "Upcoming Services" list shows one real date (Aug 1) followed by 3 literal "TBD / Date Coming Soon" placeholder rows. Client is waiting on word from the church on future dates before deciding how to handle this — do not change until then.
- [x] Removed several dead/duplicated CSS blocks found across shared.css and 5 pages (duplicate `.animate` scroll-animation rules in shared.css, duplicate `.vision-card-*` rules on index.html, unused `.image-placeholder`/`.placeholder-icon` leftover from before real photos replaced icon placeholders on index/about/join-us, redundant `.sr-only` redefinitions on give.html/contact.html that duplicated shared.css, split `html{}` rules consolidated)
- [x] Removed a duplicate IntersectionObserver setup in `js/components.js` (the whole scroll-animation block was defined twice, byte-identical)
- [x] Added a `.catch()` to `components.js`'s shared-component loader — previously a failed fetch of header/footer/prayer-fab silently left nav/footer missing with only a console warning
- [x] **Verified correct, not a bug**: confirmed groups.html already has real photos wired in for both Prayer Group and Youth Ministry sections — an earlier note in this file claiming those were still missing was stale/wrong, corrected below
- [x] Also fixed same day: Breeze API failures no longer block the staff notification email (contact.js, stay-updated.js now wrap Breeze in its own try/catch); added real email-format validation (was truthy-only) to contact.js and stay-updated.js; added 10s timeouts to all Turnstile/Breeze/Resend fetch calls across all 3 functions plus the local dev server

## Backend / SEO Audit (2026-07-23)
- [x] Fixed broken Google Maps embed on Join Us page — old `pb=` param had a fabricated place ID and truncated timestamp, replaced with a standard `?q=...&output=embed` URL (no API key needed)
- [x] Fixed the actual root cause of the map staying broken live — CSP `frame-src` didn't allow `google.com`, so the iframe was silently blocked by the site's own security header even after the embed URL was fixed. Added `https://www.google.com` to `frame-src` in netlify.toml
- [x] Standardized every page title / og:title / twitter:title to lead with "Christ Church Bluffton | ..." (previously only the homepage did; every other page had it backwards) — also fixed a title mismatch on Join Us (og said "Service & Worship", twitter said "Join Us")
- [x] Added dedicated OG images for About, Join Us, Groups, and Serve (previously every page shared one generic image) — Home/Give/Contact/Privacy/Terms/404 keep the original candlelight photo as the default
- [x] Tightened Home and About meta descriptions (were 176/170 chars, over Google's ~160 char truncation point)
- [x] Added `apple-mobile-web-app-title` site-wide so the iOS "Add to Home Screen" icon label stays short/clean instead of using the full (now longer) page title
- [x] Verified: favicon/apple-touch-icon/manifest icons all correctly sized (180x180, 192x192, 512x512), robots.txt + sitemap.xml valid, every page has exactly one H1, no images missing alt text, GA4 tag present on all 10 pages, no broken internal links
- [x] Fixed a real cache-header bug in netlify.toml — `/css/*` and `/js/*` were set to 1-year `immutable`, but filenames aren't hashed (`shared.css`, `components.js`), so a future deploy could be invisible to returning visitors for up to a year. Changed to 5-min `must-revalidate`. Also shortened `/images/*` from 1-year immutable to 1-hour `must-revalidate` since this project actively overwrites images under the same filename (done repeatedly this session)
- [x] Added `openingHoursSpecification` (Saturday 5:30 PM) to the homepage's Church/NonprofitOrganization structured data so service times can surface directly in Google
- [x] Added 8 scripture quotes to Serve page ministry cards that were missing one (Greeting & Ushers, Communion, Nursery) — matches the pull-quote style already used on the other 5 teams
- [x] Mobile image optimization pass — found and fixed two images being served at raw ~4000px camera resolution with no downsizing (About's sanctuary photo 484KB→152KB, Home's congregation photo 912KB→216KB); everything else site-wide is already in the 1200-1600px range (appropriate for mobile retina) and lazy-loaded
- [x] Full `srcset`/`sizes` responsive rollout — done 2026-07-24. Generated a smaller mobile version for all 15 images that were large enough to benefit (Home, About, Join Us, Groups, Serve) and wired up `srcset`/`sizes` on each; 4 tiny images that were already too small to shrink further just got missing `width`/`height` attributes added instead
- [x] Moved 6 unused images fully out of the project — done 2026-07-24, relocated from `src/images/` to a sibling folder `Christ Church Bluffton - Unused Images/` (outside the entire project directory, not just gitignored): `church-interior-1200.webp`, `church-interior-600.webp`, `worship-welcome-screens.webp`, `youth-group-bible-study-circle.webp`, `prayer-group-bible-study.webp`, `youth-group-fellowship-circle.webp`

## Professional Polish Roadmap (from 2026-07-21 full visual scan, going one at a time)
- [x] 1. Subtle texture in navy sections (stats bar, CTA pills, hero overlay, page-headers) — done 2026-07-21, dot-grid pattern (radial-gradient, 24px spacing, 6% white opacity) layered onto every navy background site-wide
- [x] 2. Section dividers — subtle gold accent treatment at navy→light transitions (page-headers, hero→content) — done 2026-07-21, gold gradient line added at bottom of all 5 page-headers + homepage hero
- [x] 3. Photo treatment consistency — standardize border-radius/shadow across all photo containers site-wide — done 2026-07-21, added matching shadow (0 20px 60px rgba(48,59,106,0.2)) to About's pastor headshot (also removed leftover dashed placeholder border since it always shows a real photo now) and to Groups/Join Us `.image-placeholder.has-image` photos, matching what Home/About's `.visual-image` already had
- [x] 4. Stat counter animation — done 2026-07-24, 85M+/2000+/165 count up from 0 on scroll into view via IntersectionObserver, respects prefers-reduced-motion (shows final value instantly instead of animating)
- [x] 5. Extend motto-band-style hover treatment — done 2026-07-24, applied to homepage vision card icons (Worship/Groups/Serve — icon shifts navy + lifts on card hover) and About page belief-card numbers (fade in from 30% to full opacity + lift on card hover)
- [x] 6. One supporting accent color — done 2026-07-24, added a warm terracotta (`--accent-terracotta: #B15A43`) used in exactly one spot, the homepage "Coming Soon" badge on the youth ministry spotlight section, so it reads as an intentional highlight rather than a competing brand color
- [x] 7. Fill remaining placeholder photos — Table 246 and pastor headshot done (April + July work); all other photos now sourced too, see Photos Needed below

## Content Updates
- [x] Homepage stats bar — "2026 / Launching in Bluffton" changed to "Est. 2026 / Serving Bluffton" since the church has already launched — done 2026-07-21
- [x] Site-wide sweep of "coming to Bluffton...in 2026" / "launching" language — done 2026-07-22, removed from About page mission section + meta descriptions (About, Home, Give) now that the church is live

## Waiting on Client
- [x] Pastor bio — received (2026-04-07), applied to about.html; reordered 2026-04-21 to lead with family, ministry, then interests
- [x] Mission statement — received (2026-04-07), applied to about.html + index.html
- [x] Ministry team mission statements — received (2026-04-10) from Ministry Teams Guidelines doc, applied to serve.html (Greeting renamed to "Greeting & Ushers" to match doc; added 8th card, Altar Guild)
- [ ] Pastor quote — client confirmed 2026-07-24 they now have it; waiting on the actual text to apply to about.html
- [x] Content review feedback on new site build — first round received 2026-07-20 (About beliefs paragraph + Join Us "What to Expect" copy), both applied. Still awaiting full remaining review from Rev. Riddle.
- [x] ~~ACNA membership verification~~ — removed 2026-07-24 per client, not needed
- [x] ~~Email verification / display name fix (David, admin)~~ — dropped 2026-07-24 per client, no context existed for this anywhere
- [ ] Phone number — still needed
- [x] Ministry team photos (Nursery, Musical Worship, Technology, and all other Serve teams) — sourced 2026-07-22/23, see Photos Needed below
- [x] ~~Higher quality youth group photo, small group photos~~ — removed 2026-07-24 per client, current photos are fine

## Photos Needed
- [x] Homepage — mission section photo (`congregation-packed-wide.webp`)
- [x] Homepage — 3 vision card photos (Worship: worship-music-team, Groups: youth-group-outing, Serve: fellowship-conversation)
- [x] About page — mission section photo (`sanctuary-behind-altar-wide.webp`)
- [x] About page — Pastor photo, Rev. Jonathan Riddle (`riddle-headshot.webp`) — added April 2026
- [x] Join Us page — worship service photo (`altar-service-helpers.webp`)
- [x] Join Us page — Book of Common Prayer image (liturgy section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `book-of-common-prayer.webp`
- [x] Join Us page — worship music image (music section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `worship-piano-keys.webp`
- [ ] Groups page — Table 246 photo (`table-246-group.webp`) — added April 2026, but **flagged 2026-07-27 by the team as the wrong photo** (it's actually from a discontinued coffee gathering, not a real Table 246 group). Left in place for now; waiting on Karen or Judy to supply a real Table 246 photo.
- [x] Groups page — Prayer Group image — CORRECTION 2026-07-23: this was already done, `prayer-group-saved-book.webp` is live on the page. The archived `prayer-group-bible-study.webp` is an unused alternate, not a gap.
- [x] Groups page — Youth Activities image — CORRECTION 2026-07-23: this was already done, `youth-group-hands-prayer.webp` is live on the page. The archived `youth-group-fellowship-circle.webp` is an unused alternate, not a gap.
- [x] Serve page — all 8 ministry team photos (Greeting & Ushers, Altar Guild, Communion, Lay Readers, Nursery, Musical Worship, Technology & Social Media, Safety) — done 2026-07-22/23

## Site Notes
- [x] Serve page rebuilt with alternating left/right ministry team layout (April 2026)
- [x] Safety team — was dropped during the April rebuild despite being a real, documented ministry in the client's Ministry Teams Guidelines doc; restored 2026-07-22 with its own photo, mission statement, and scripture quote (Nehemiah 4:9)
- [x] Scroll animations added site-wide (Intersection Observer)
- [x] Lazy loading on all non-hero images
- [x] Accessibility: sr-only class, footer form labels, footer role, reduced motion support
- [x] Hero overlay lightened on homepage
- [x] Removed loader/fade screen from give.html (only homepage has it now)
- [x] 2026-07-21 footer redesign: single-column layout for tablet+mobile (was a broken 2-col split), Quick Links merged into one unified 6-item list (was two separate stacked 3-item lists causing a visible gap), newsletter email box capped at 260px (was unbounded/stretching full width), form left-aligned/centered correctly under "Stay Updated"
- [x] 2026-07-21 Prayer Request FAB no longer overlaps footer text — fades out via IntersectionObserver when footer scrolls into view (components.js + shared.css)
- [x] `js/components.js` — confirmed `window.scrollTo(0,0)` should NOT be present (removed 2026-04-21 to preserve scroll position on refresh); do not re-add

## Site Build — Remaining
- [x] Update sitemap.xml with all new pages (about, join-us, groups, serve, give) — dates refreshed to 2026-08-01
- [x] Update Google Maps embed on join-us page with real embed URL — done 2026-07-23, see Backend/SEO Audit above for the full fix (embed URL + CSP)
- [x] Breakpoint/responsive QA pass across all pages — done 2026-07-20/22, all 10 pages clean at 375–1440px. Still need a true <375px phone check (tooling limit, not a known bug).
- [x] Test all 3 forms on production URL — done 2026-07-24, prayer and newsletter both confirmed passing live with the new invisible Turnstile widget. Contact form's original widget was already proven live before today.
- [x] Test Netlify deploy from the `src/` publish dir structure — confirmed working extensively throughout this whole project, not a real open item

## Email Deliverability
- [x] ~~DKIM records from Tithely/SendGrid~~ — closed 2026-07-24 per client, email deliverability is already working fine, no need to chase Tithe.ly support further
- [x] ~~DMARC upgrade~~ — closed 2026-07-24 per client, same reason as above
- [x] SPF — done

## Pre-Launch (for Jonathan's production site — not live yet)
- [ ] Cross-browser testing (Firefox, Safari, Edge, mobile)

## Post-Launch QA — reorganized 2026-07-24, categorized per client
- [x] Verify Tithe.ly donation button/modal works on production — confirmed working 2026-07-24 per client
- [ ] Google Analytics — verify data is actually flowing in
- [ ] SSL verification — quick check, Netlify provisions this automatically but worth confirming
- [ ] Google Search Console — re-submit sitemap with new pages
- [ ] Lighthouse audit
- [ ] Color contrast review (WCAG AA)

## Cleanup
- [x] ~~Delete duplicate `Web Design/Christ Church Bluffton/` folder~~ — checked 2026-07-24, doesn't exist, already resolved previously
- [x] Remove backup files from src/ — done 2026-07-24, all 16 `-previous.html/css/js/xml` files sent to the Windows Recycle Bin (not permanently deleted, none were git-tracked)
