# Christ Church Bluffton — TODO

## Waiting on Client
- [ ] Professional headshot of Rev. Jonathan Riddle (for about page pastor section)
- [ ] Higher quality youth group photo
- [ ] Small group photos (various age groups)
- [ ] Prayer group photo (people praying together/over someone)
- [ ] Ministry team photos (Greeting & Ushers, Altar Guild, Communion, Lay Readers, Nursery, Musical Worship, Technology)
- [ ] Phone number
- [x] Pastor bio — received (2026-04-07), applied to about.html
- [x] Mission statement — received (2026-04-07), applied to about.html + index.html
- [x] Ministry team mission statements — received (2026-04-10) from Ministry Teams Guidelines doc, applied to serve.html
- [ ] Pastor quote — verify or replace placeholder quote with Jonathan's preferred wording
- [ ] Content review feedback on new site build
- [ ] Photo request email drafted: `comm/client/2026-04-10-photo-request.md` — SEND TO JONATHAN

## Images Placed (2026-04-10)
- [x] **index.html** — Hero: church-christmas-candle. Rooted in Tradition: worship-welcome-screens. Worship card: worship-music-team. Groups card: youth-group-outing. Serve card: fellowship-conversation.
- [x] **about.html** — Our Mission: sanctuary-behind-altar-wide.
- [x] **join-us.html** — Worship Service: altar-service-helpers.

## Images Still Needed (placeholders in place)
- [ ] **about.html** — Pastor section: Professional headshot of Rev. Jonathan Riddle
- [ ] **join-us.html** — Book of Common Prayer placeholder (Liturgy section)
- [ ] **join-us.html** — Worship Music placeholder (Music section)
- [ ] **groups.html** — Table 246 image
- [ ] **groups.html** — Prayer Group image
- [ ] **groups.html** — Youth Ministry image (higher quality)
- [ ] **serve.html** — Greeting & Ushers photo
- [ ] **serve.html** — Altar Guild photo
- [ ] **serve.html** — Communion photo
- [ ] **serve.html** — Lay Readers photo
- [ ] **serve.html** — Nursery photo
- [ ] **serve.html** — Musical Worship photo
- [ ] **serve.html** — Technology & Social Media photo

## Completed (2026-04-10)
- [x] Serve page rebuilt with alternating left/right ministry team layout
- [x] Mission statements added from Ministry Teams Guidelines doc
- [x] Safety team removed from serve page (not advertised)
- [x] Scroll animations added site-wide (Intersection Observer)
- [x] Lazy loading on all non-hero images
- [x] Sitemap updated with all 9 pages (2026-04-10 dates)
- [x] OG tags, Twitter cards, canonical URLs verified on all pages
- [x] Accessibility: sr-only class, footer form labels, footer role, reduced motion support
- [x] Hero overlay lightened on homepage

## Site Build — Remaining
- [ ] Update Google Maps embed on join-us page with real embed URL
- [ ] Breakpoint/responsive QA pass across all pages
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge, mobile)
- [ ] Lighthouse audit
- [ ] Test all 3 forms on production URL (contact, prayer, newsletter)
- [ ] Verify Tithe.ly donation modal works on production

## Email Deliverability
- [ ] DKIM records from Tithely/SendGrid (waiting on Tori V. from Tithely support)
- [ ] DMARC — currently set to none, upgrade after DKIM confirmed
- [x] SPF — done

## Pre-Launch
- [ ] Replace all placeholder images with real photos
- [ ] Final responsive QA pass
- [ ] Color contrast review (WCAG AA)
- [ ] Google Analytics — verify data flowing
- [ ] Google Search Console — re-submit sitemap with new pages
- [ ] SSL verification
- [ ] Test Netlify deploy from new folder structure (src/ publish dir)
- [ ] Remove backup files (-previous files) from src/

## Cleanup
- [ ] Delete duplicate `Web Design/Christ Church Bluffton/` folder
- [ ] Remove backup files from src/ (index-previous.html, about-previous.html, join-us-previous.html, serve-previous.html)
