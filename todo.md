# Christ Church Bluffton — TODO

## Professional Polish Roadmap (from 2026-07-21 full visual scan, going one at a time)
- [x] 1. Subtle texture in navy sections (stats bar, CTA pills, hero overlay, page-headers) — done 2026-07-21, dot-grid pattern (radial-gradient, 24px spacing, 6% white opacity) layered onto every navy background site-wide
- [x] 2. Section dividers — subtle gold accent treatment at navy→light transitions (page-headers, hero→content) — done 2026-07-21, gold gradient line added at bottom of all 5 page-headers + homepage hero
- [x] 3. Photo treatment consistency — standardize border-radius/shadow across all photo containers site-wide — done 2026-07-21, added matching shadow (0 20px 60px rgba(48,59,106,0.2)) to About's pastor headshot (also removed leftover dashed placeholder border since it always shows a real photo now) and to Groups/Join Us `.image-placeholder.has-image` photos, matching what Home/About's `.visual-image` already had
- [ ] 4. Stat counter animation (85M+/2000+/165 count up on scroll into view, homepage)
- [ ] 5. Extend motto-band-style hover treatment to other icon/number elements (ministry cards, belief card numbers)
- [ ] 6. One supporting accent color beyond navy/gold/cream, used sparingly
- [ ] 7. Fill remaining placeholder photos (Groups: Prayer Group, Youth Activities) — biggest single "unfinished" signal on the site

## Content Updates
- [x] Homepage stats bar — "2026 / Launching in Bluffton" changed to "Est. 2026 / Serving Bluffton" since the church has already launched — done 2026-07-21
- [ ] NOTE: other pages still have "coming to Bluffton...in 2026" / "launching" language (About page mission section, meta descriptions, etc.) — worth a sweep for consistency now that the church is live, not just this one homepage stat

## Next Session (planned, not started)
- [ ] Front-end inspection & changes — colors, fonts, general visual polish pass. Heads-up given 2026-07-21, work not yet begun.

## Waiting on Client
- [ ] Real photos from Jonathan (church, worship, pastor headshot)
- [ ] Phone number
- [ ] Pastor bio/quote — verify current text with Rev. Riddle
- [ ] ACNA membership verification
- [ ] Email verification / display name fix (David, admin)
- [x] Content review feedback on new site build — first round received 2026-07-20 (About beliefs paragraph + Join Us "What to Expect" copy), both applied. Still awaiting full remaining review from Rev. Riddle.
- [x] Mission statements for Serve ministry teams — added 2026-07-21 from client's "Ministry Teams Guidlines.docx". Also added a new 8th card (Altar Guild) that was in the doc but not yet on the page. Greeting renamed to "Greeting & Ushers" to match doc.

## Photos Needed (placeholders in place)
- [x] Homepage — mission section photo (`congregation-packed-wide.webp`) — done 2026-07-21, recovered from live Netlify deploy (christchurch-bluffton.netlify.app), local repo never had it committed
- [x] Homepage — 3 vision card photos added (Worship/Groups/Serve) — new markup added to match live site, wasn't in local HTML at all before today
- [x] About page — mission section photo (`sanctuary-behind-altar-wide.webp`) — done 2026-07-21
- [x] About page — Pastor photo, Rev. Jonathan Riddle (`riddle-headshot.webp`) — done 2026-07-21
- [x] Join Us page — worship service photo (`altar-service-helpers.webp`) — done 2026-07-21
- [x] Join Us page — Book of Common Prayer image (liturgy section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `book-of-common-prayer.webp`
- [x] Join Us page — worship music image (music section) — done 2026-07-21, AI-generated (Flux Dev via Leonardo.ai), `worship-piano-keys.webp`
- [x] Groups page — Table 246 photo (`table-246-group.webp`) — done 2026-07-21
- [ ] Groups page — Prayer Group image — still placeholder on live site too, no photo exists yet
- [ ] Groups page — Youth Activities image — still placeholder on live site too, no photo exists yet

## Unpushed Changes
- [x] Removed loader/fade screen from give.html (only homepage has it now)
- [x] 2026-07-21 footer redesign: single-column layout for tablet+mobile (was a broken 2-col split), Quick Links merged into one unified 6-item list (was two separate stacked 3-item lists causing a visible gap), newsletter email box capped at 260px (was unbounded/stretching full width)
- [x] 2026-07-21 Prayer Request FAB no longer overlaps footer text — fades out via IntersectionObserver when footer scrolls into view (components.js + shared.css)
- [ ] OPEN QUESTION: `js/components.js` still has `window.scrollTo(0,0)` forcing scroll-to-top on every page load — flagged to user 2026-07-21 as a possible regression (was removed 2026-04-21 for breaking scroll restoration on refresh), no answer yet on whether it's intentional

## Site Build — Remaining
- [ ] Update sitemap.xml with all new pages (about, join-us, groups, serve, give)
- [ ] Update Google Maps embed on join-us page with real embed URL (current is address-based)
- [x] Breakpoint/responsive QA pass across all pages — done 2026-07-20, all 10 pages clean at 500–1920px. Still need a true <500px phone check (tooling limit, not a known bug).
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge, mobile)
- [ ] Lighthouse audit
- [ ] Test all 3 forms on production URL (contact, prayer, newsletter) — includes confirming Turnstile CAPTCHA works on live domain (fails locally as expected, site key is domain-locked)
- [ ] Verify Tithe.ly donation modal works on production
- [ ] Remove backup files (index-previous.html, header-previous.html, shared-previous.css)

## Email Deliverability
- [ ] DKIM records from Tithely/SendGrid (waiting on Tori V. from Tithely support)
- [ ] DMARC — currently set to none, upgrade after DKIM confirmed
- [ ] SPF — done

## Pre-Launch
- [ ] Replace remaining placeholder images with real photos — 3 left: Join Us (Book of Common Prayer, Worship Music), Groups (Prayer Group, Youth Activities). None exist anywhere yet (checked live site too).
- [x] Populate Serve page mission statements — done 2026-07-21
- [ ] Final responsive QA pass
- [ ] Color contrast review (WCAG AA)
- [ ] Google Analytics — verify data flowing
- [ ] Google Search Console — re-submit sitemap with new pages
- [ ] SSL verification
- [ ] Test Netlify deploy from new folder structure (src/ publish dir)
