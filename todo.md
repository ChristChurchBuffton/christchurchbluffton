# Christ Church Bluffton — TODO

## Go-Live / Domain Cutover — NOT TRACKED ANYWHERE ELSE, added 2026-07-24 on review
Jonathan's production Netlify site (the real one, bound to `christchurchbluffton.org`) is confirmed not live yet — nothing in this file actually covers switching the real domain over to it. Flagging as genuinely missing rather than guessing specifics:
- [ ] Confirm what `christchurchbluffton.org` currently points to today (existing old site? nothing? a placeholder?) before cutover, so nothing gets lost
- [ ] Confirm DNS is pointed at Jonathan's Netlify site when ready to go live (A/CNAME records via GoDaddy, per Account PWs doc)
- [ ] Confirm SSL cert provisions correctly on the real domain once DNS is switched (Netlify auto-provisions, but only after DNS actually points there)
- [ ] Confirm GA4 property (`G-PTWWV0M0DX`) is tracking correctly once traffic is real, not just the review-site's traffic
- [ ] Decide/confirm a rollback plan if something breaks right after cutover

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
- [x] Groups page — Table 246 photo (`table-246-group.webp`) — added April 2026
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
