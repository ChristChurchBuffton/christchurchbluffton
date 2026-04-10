# Christ Church Bluffton — Dev Notes

---

## 2026-04-03 — Full Site Rebuild & Project Reorganization

**What was done:**
- Reorganized project folder to match Forged Digital Project Template
- Copied project from `Clients - Active/` to `Web Design/Christ Church Bluffton/` (new working copy)
- Renamed `live/` → `src/`, old `src/` → `reference/` (now archived)
- Updated `netlify.toml` to publish from `src/` instead of `live/`
- Built all pages from reference site content with current branding (navy #303b6a, gold #c3a355, Lora font)

**Pages built:**
- Homepage — hero, about preview, stats, vision cards (Worship/Groups/Serve), CTA pill
- About — mission, vision cards, beliefs (4 pillars), scripture banner, pastor section (no leadership)
- Join Us (`join-us.html`, was `worship.html`) — service dates (May 3, Jun 7, Jul 12, Aug 2 at 5:30 PM Sat), Lord of Life Lutheran Church venue with address, What to Expect, liturgy + worship music columns, Google Map, CTA
- Groups — Table 246 Bible study, Prayer Groups, Youth Ministry (Coming Soon)
- Serve (NEW) — 7 ministry cards: Greeting, Safety, Nursery, Lay Readers, Technology, Eucharist, Worship. Placeholder containers for mission statements.
- Give — moved from old index.html to /give, URLs updated
- Contact — hero resized to match other pages, donate CTA fixed to /give

**Navigation:** Home, About, Join Us, Groups, Serve, Contact + Give (pill button)

**Design choices:**
- Hero overlay: neutral grey (not blue/purple tint)
- CTA sections: oval pill style across all pages
- "Events" replaced with "Serve" (ministry teams)
- "Worship" renamed to "Join Us" / "Join Us For Services"
- Image placeholders with dashed borders for all pending photos

**Post-push fixes (2026-04-04):**
- Removed loading screen/fade from give.html — only homepage should have the loader

**2026-04-05 — Project relocation + photos:**
- Moved project from `Web Design/Christ Church Bluffton/` to `Clients - Active/Christ Church Bluffton/`
- Original Clients - Active version archived to `archive/original-clients-active/`
- Added 9 photos from client to `assets/photos/` — renamed descriptively, converted to webp
- Photos include: outdoor service (2), Riddle family, sanctuary shots (4), youth outing, community gathering
- 3 sanctuary photos (4411, 4413, 4414) are portrait orientation — taken with phone held vertically

**Known issues / remaining:**
- Google Maps embed on join-us uses address-based URL — needs real embed from Google Maps share
- Reference folder couldn't be deleted (Windows lock) — copied to archive
- Backup files in src/ (-previous files) — remove before deploy
- sitemap.xml needs all new page URLs
- All placeholder images need real photos from client
- Serve page mission statements pending

---

## 2026-04-07 — Pastor Bio, Mission Statement & Easter Photos

**What was done:**
- Received email from Jonathan with his official bio and mission statement
- Saved original email to `comm/client/2026-04-07-jonathan-bio-mission.md`
- Updated pastor bio on `about.html` with Jonathan's real bio:
  - Background at The Church of the Cross (10+ years ministry leadership)
  - Vision for Gospel-centered presence in the Lowcountry
  - Education: Appalachian State (undergrad), Reformed Theological Seminary (MDiv)
  - Family: wife Lisa, 29 years married, 6 children
  - Personal: C.S. Lewis, Tolkien, Carolina Panthers
- Updated mission statement on both `about.html` and `index.html`:
  - "Plant a reproducing Anglican church in Bluffton and beyond"
  - "Shaped by Scripture, Prayer, and Sacramental Life"
  - "Gospel movement that fosters personal conversion and authentic community"
  - "Every person is known and valued"
  - "Make Bluffton a better and more hopeful place to live"
- Added 10 new Easter service photos from Jonathan (converted jpeg → webp, saved to `assets/photos/`):
  - 4 altar/communion shots, 1 sanctuary wide, 1 fellowship, 1 worship music, 1 pastor at lectern, 2 baptism
- Backups: `about-previous.html`, `index-previous.html`

**Still pending:**
- Pastor quote on about.html — still placeholder, needs Jonathan's preferred wording
- Photos not yet placed on site pages — ready in assets/photos/ for future placement
- Serve page mission statements still pending from client

---

## 2026-02-19 — Tithe.ly API Dead End

**Issue**: Tithe.ly confirmed they no longer offer API keys in 3.0. The old Breeze 2.0 API keys are gone. There is NO way to push data from an external site into the Tithe.ly People database via API.

**Impact**: Cannot wire custom frontend forms (contact, prayer request, stay updated) to Tithe.ly People database as originally planned.

**Final Answer (2026-02-19)**: Tithe.ly confirmed CSV import (People > Import CSV) is the ONLY option. No API, no webhooks, no Zapier, no automated sync. Future integrations are on their roadmap but no timeline.

**Plan:**
- **Contact form** → Netlify Forms (email notification to pastor)
- **Prayer request form** → Netlify Forms (email notification to pastor)
- **Stay Updated signup** → Netlify Forms (collects name/email, pastor exports list when needed for mass emails)
- **Donations** → Tithe.ly stays as-is (embed/modal on give.html + donation.html)
- **Mass emails** → Future decision: Gmail BCC for small list, or Sender.net free tier (2,500 subs / 15k emails/mo) if list grows
- **Tithe.ly People database** → Pastor manually manages contacts, or imports from Netlify form exports

**Workflow for pastor**: Periodically export form submissions from Netlify dashboard → CSV → import into Tithe.ly People. Simple enough for a church plant.

This plan is actually simpler and has zero ongoing cost. Netlify Forms free tier = 100 submissions/month (plenty for a church plant).

---

## 2026-02-20 — Resend Email Notifications Setup

**Status**: Fully configured and tested on testing URL. Must repeat env vars on production Netlify site.

**What was done:**
- Added 3 Netlify environment variables: `RESEND_API_KEY` (secret), `EMAIL_FROM`, `NOTIFY_EMAIL`
- `EMAIL_FROM` set to `Christ Church Bluffton <notifications@christchurchbluffton.org>`
- `NOTIFY_EMAIL` set to `admin@christchurchbluffton.org`
- Domain `christchurchbluffton.org` verified in Resend
- Added DNS records in GoDaddy: DKIM (TXT), SPF (MX + TXT on `send` subdomain)
- Updated main SPF record to include `amazonses.com`
- Added approved sender list in Google Workspace Admin to bypass spam filters
- All 3 forms tested and working: Contact, Prayer Request, Stay Updated

**TODO for production launch:**
- Re-add all 3 Netlify environment variables (`RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL`) on the production Netlify site
- DNS and Resend domain verification already done (shared across environments)
- Add spam protection (CAPTCHA + honeypot) to all forms before going live
- Update `NOTIFY_EMAIL` to final recipient(s) once Google Workspace emails are set up

---

## 2026-04-01 — Site Temporarily Taken Down (Client Request)

**What happened:** Client requested the live site be temporarily taken down.

**What was deployed:** A `temp-deploy/` folder with:
- `index.html` — plain white 404 page (no branding, no colors, noindex/nofollow)
- `netlify.toml` — no-cache headers (so browsers don't cache the 404), security headers
- `robots.txt` — blocks all crawlers

**Deployed to:** Production Netlify site (`christchurchbluffton.org`) via manual drag-and-drop.

**How to revert (restore the real site):**
1. Go to the production Netlify dashboard
2. Go to **Deploys**
3. Either:
   - **Option A**: Click on the previous deploy (the last real site deploy) and hit "Publish deploy" to restore it instantly
   - **Option B**: Drag the full `live/` folder from `C:\Users\kwmcc\Desktop\Web Design\Clients - Active\Christ Church Bluffton\live\` onto the deploy area
4. After restoring, verify:
   - All pages load correctly
   - Forms work (contact, prayer, stay-updated)
   - Tithe.ly donation modal works on give page
   - Announcement bar shows
   - Google can crawl again (robots.txt in live/ allows indexing)

**Important:** The no-cache headers on the temp deploy mean browsers won't serve a stale 404 after restoring — visitors will see the real site immediately.
