# Christ Church Bluffton — TODO

## Professional Polish Roadmap (from 2026-07-21 full visual scan, going one at a time)
- [x] 1. Subtle texture in navy sections (stats bar, CTA pills, hero overlay, page-headers) — done 2026-07-21, dot-grid pattern (radial-gradient, 24px spacing, 6% white opacity) layered onto every navy background site-wide
- [x] 2. Section dividers — subtle gold accent treatment at navy→light transitions (page-headers, hero→content) — done 2026-07-21, gold gradient line added at bottom of all 5 page-headers + homepage hero
- [x] 3. Photo treatment consistency — standardize border-radius/shadow across all photo containers site-wide — done 2026-07-21, added matching shadow (0 20px 60px rgba(48,59,106,0.2)) to About's pastor headshot (also removed leftover dashed placeholder border since it always shows a real photo now) and to Groups/Join Us `.image-placeholder.has-image` photos, matching what Home/About's `.visual-image` already had
- [ ] 4. Stat counter animation (85M+/2000+/165 count up on scroll into view, homepage)
- [ ] 5. Extend motto-band-style hover treatment to other icon/number elements (ministry cards, belief card numbers)
- [ ] 6. One supporting accent color beyond navy/gold/cream, used sparingly
- [x] 7. Fill remaining placeholder photos — Table 246 and pastor headshot done (April + July work); Groups Prayer Group / Youth Activities photos still outstanding, see Photos Needed below

## Content Updates
- [x] Homepage stats bar — "2026 / Launching in Bluffton" changed to "Est. 2026 / Serving Bluffton" since the church has already launched — done 2026-07-21
- [x] Site-wide sweep of "coming to Bluffton...in 2026" / "launching" language — done 2026-07-22, removed from About page mission section + meta descriptions (About, Home, Give) now that the church is live

## Waiting on Client
- [x] Pastor bio — received (2026-04-07), applied to about.html; reordered 2026-04-21 to lead with family, ministry, then interests
- [x] Mission statement — received (2026-04-07), applied to about.html + index.html
- [x] Ministry team mission statements — received (2026-04-10) from Ministry Teams Guidelines doc, applied to serve.html (Greeting renamed to "Greeting & Ushers" to match doc; added 8th card, Altar Guild)
- [ ] Pastor quote — verify or replace placeholder quote with Jonathan's preferred wording
- [x] Content review feedback on new site build — first round received 2026-07-20 (About beliefs paragraph + Join Us "What to Expect" copy), both applied. Still awaiting full remaining review from Rev. Riddle.
- [ ] ACNA membership verification
- [ ] Email verification / display name fix (David, admin)
- [ ] Phone number
- [ ] Higher quality youth group photo, small group photos (various ages), ministry team photos (Nursery, Musical Worship, Technology) — photo request email drafted: `comm/client/2026-04-10-photo-request.md`

## Photos Needed
- [x] Homepage — mission section photo (`congregation-packed-wide.webp`)
- [x] Homepage — 3 vision card photos (Worship: worship-music-team, Groups: youth-group-outing, Serve: fellowship-conversation)
- [x] About page — mission section photo (`sanctuary-behind-altar-wide.webp`)
- [x] About page — Pastor photo, Rev. Jonathan Riddle (`riddle-headshot.webp`) — added April 2026
- [x] Join Us page — worship service photo (`altar-service-helpers.webp`)
- [x] Join Us page — Book of Common Prayer image (liturgy section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `book-of-common-prayer.webp`
- [x] Join Us page — worship music image (music section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `worship-piano-keys.webp`
- [x] Groups page — Table 246 photo (`table-246-group.webp`) — added April 2026
- [ ] Groups page — Prayer Group image — still placeholder, no photo exists yet
- [ ] Groups page — Youth Activities image — still placeholder, no photo exists yet
- [ ] Serve page — Greeting & Ushers, Altar Guild, Communion, Lay Readers, Nursery, Musical Worship, Technology & Social Media photos

## Site Notes
- [x] Serve page rebuilt with alternating left/right ministry team layout (April 2026); Safety team removed from serve page (not advertised)
- [x] Scroll animations added site-wide (Intersection Observer)
- [x] Lazy loading on all non-hero images
- [x] Accessibility: sr-only class, footer form labels, footer role, reduced motion support
- [x] Hero overlay lightened on homepage
- [x] Removed loader/fade screen from give.html (only homepage has it now)
- [x] 2026-07-21 footer redesign: single-column layout for tablet+mobile (was a broken 2-col split), Quick Links merged into one unified 6-item list (was two separate stacked 3-item lists causing a visible gap), newsletter email box capped at 260px (was unbounded/stretching full width), form left-aligned/centered correctly under "Stay Updated"
- [x] 2026-07-21 Prayer Request FAB no longer overlaps footer text — fades out via IntersectionObserver when footer scrolls into view (components.js + shared.css)
- [x] `js/components.js` — confirmed `window.scrollTo(0,0)` should NOT be present (removed 2026-04-21 to preserve scroll position on refresh); do not re-add

## Site Build — Remaining
- [ ] Update sitemap.xml with all new pages (about, join-us, groups, serve, give) — last updated 2026-04-10, verify still current
- [ ] Update Google Maps embed on join-us page with real embed URL (current is address-based)
- [x] Breakpoint/responsive QA pass across all pages — done 2026-07-20/22, all 10 pages clean at 375–1440px. Still need a true <375px phone check (tooling limit, not a known bug).
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge, mobile)
- [ ] Lighthouse audit
- [ ] Test all 3 forms on production URL (contact, prayer, newsletter) — includes confirming Turnstile CAPTCHA works on live domain (fails locally as expected, site key is domain-locked)
- [ ] Verify Tithe.ly donation modal works on production

## Email Deliverability
- [ ] DKIM records from Tithely/SendGrid (waiting on Tori V. from Tithely support)
- [ ] DMARC — currently set to none, upgrade after DKIM confirmed
- [x] SPF — done

## Pre-Launch
- [ ] Replace remaining placeholder images with real photos — see Photos Needed above
- [x] Populate Serve page mission statements — done (April 2026, from Ministry Teams Guidelines doc)
- [ ] Final responsive QA pass
- [ ] Color contrast review (WCAG AA)
- [ ] Google Analytics — verify data flowing
- [ ] Google Search Console — re-submit sitemap with new pages
- [ ] SSL verification
- [ ] Test Netlify deploy from new folder structure (src/ publish dir)
- [ ] Remove backup files (-previous files) from src/

## Cleanup
- [ ] Delete duplicate `Web Design/Christ Church Bluffton/` folder
- [ ] Remove backup files from src/ (*-previous.html, *-previous.css, *-previous.js)
