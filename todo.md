# Christ Church Bluffton — TODO

## STATUS (2026-08-13/14): Admin clean-URL fix + new public-site logo (loader/header/footer) + Greeters mass-upload + Dev Update bug fix — PUSHED TO `origin` ONLY, commit `e9ed372`. **Holding on `production` until the church approves** — Kevin's explicit instruction was "we'll later push this to church once approved."

### Admin panel — removed `.html` from all internal navigation
- [x] Sidebar template + all 13 synced pages, login/logout redirects, accept-invite flow, dashboard stat-card links (`shared.js`, `includes/sidebar.html`, `index.html`, `accept-invite.html`, `account.html`, `team.html`, `dashboard.html`) — every internal `window.location.href`/`<a href>` now points to a clean path (`dashboard` not `dashboard.html`). Dashboard's 5 stat-card links were an extra spot found and fixed that wasn't in the original file list.
- [x] Two `panel_announcements` rows had `.html`-suffixed `target_page` values — fixed via direct SQL update.
- [x] Verified end-to-end on localhost: login, logout, sidebar nav across 6+ pages, direct URL entry (proves the server's own clean-URL fallback route works, not just client-side JS), dashboard stat-card clicks.
- [x] **Pushed to `origin` (commit `e9ed372`), holding on `production` until church approves.** Netlify's `pretty_urls` (already on in `netlify.toml`) handles the same rewrite for real `<a href>` tags in production automatically; this fix makes the admin's own JS-driven redirects and sidebar links match that behavior too.

### Public site — new logo, 3 rounds (client sent 3 different source files over the session: `Untitled design.PNG`, then `IMG_8146.PNG`, then final `1.png`)
- [x] **Fade-in loading screen** (`index.html`, homepage only) — logo: crest + "CHRIST CHURCH Bluffton" wordmark from `Untitled design.PNG`. Fixed a real defect in the source file: a transparent gap between the crest's navy outer ring and gold ring (invisible on white, but showed as a broken ring on the loader's navy background) — fixed via a border-flood-fill technique that fills only enclosed/unreachable transparent regions, leaving letter counters (the inside of "o"/"R") alone. Wordmark text recolored white (was navy, invisible on navy bg); divider bar kept gold. Tight-cropped ~13px of baked-in transparent padding that was inflating the gap down to "Welcome Home". Responsive: 190px (mobile) → 240px (≥768px) → 320px (desktop, ≥1280px). Removed the now-redundant plain-text "Christ Church Bluffton" line since the logo image already has it; kept "Welcome Home". Verified 320–2560px.
- [x] **Header logo** (`includes/header.html`, both the desktop bar and the mobile slide-out menu) — final source `1.png` (same ring-gap defect, same fix applied). Desktop/tablet bar: crest untouched, wordmark scaled 1.35x relative to crest (Kevin's explicit call — "leave the logo, make the words bigger"); navy text kept as-is since it already reads fine on the header's white background. Responsive tiers: 44px (≤360px) → 52px (≤480px) → 64px (≤1023px) → 72px (desktop). Mobile slide-out menu uses a SEPARATE, more compact image (`header-logo-mobile.png` — crest 1.10x, text 0.80x, ~3.05:1 aspect vs. the header bar's ~4.8:1), because the mobile panel is only ~240px wide after padding and couldn't fit a taller render of the wide header-bar image without clipping — first attempt at just raising the CSS height overflowed the panel and got reverted. Uses `max-height` + `max-width:100%` (paired `auto` dimensions) instead of a fixed height so it can't overflow again on future size tweaks.
- [x] **Footer logo** (`includes/footer.html`) — same final source (`1.png`), a third distinct crop/scale variant (`footer-logo.png`): wordmark NOT enlarged this time (near-native scale, ~1.0–1.055x — opposite direction from the header ask, Kevin's explicit call), height 70px. Wordmark AND divider bar recolored gold (RGB 188,160,103, sampled from the image's own gold rather than a guessed hex) — footer background is navy, so navy text/bar would've had the same invisibility problem as the loader. Confirmed clean via Kevin's own breakpoint check.
- [x] Original source `Untitled design.PNG` archived (not used live anywhere except the loader) to `assets/logos/CCB Logo-New.png`, alongside the existing logo-variant library.
- [x] **Pushed to `origin` (commit `e9ed372`), holding on `production` until church approves.**

### Dashboard/Accounts — removed a fake "Dev Update" activity entry that was never real
- [x] **Real bug found + fixed**: both `dashboard.html` and `team.html` had a leftover PREVIEW-ONLY line (`log.push({ t: Date.now(), ... action: 'dev_update', ... })`) that fabricated a fake "Dev Update" activity-log row, entirely client-side, on every single page load — never written to `activity_log` in the database (confirmed via direct query: zero real `dev_update` rows exist). This is why Kevin saw the entry's timestamp "keep updating" instead of staying fixed at the real Aug 13 ~10:04 AM push — `Date.now()` just captured whatever moment the page happened to load. Removed both lines entirely (was explicitly marked "Remove once approved and wired to log for real" in a comment — that cleanup step had been forgotten). Also fixed a side effect on Accounts: the Activity Log's entry count included this phantom row, now accurate.
- [ ] **No real mechanism exists yet** to log an actual Dev Update when a real feature ships — the removed code was the only thing that ever touched that label, and it was fake. If Kevin wants real ones going forward: either log them manually (a one-line DB insert whenever a real push happens) or build a small "Log a Dev Update" UI — neither started yet, his call which.

### Greeters volunteer team — mass-uploaded from 2 client Word docs, LIVE IN THE REAL DATABASE (Supabase is shared across localhost/staging/production, not sandboxed)
- [x] Parsed `GREETER TEAMS.docx` (4 sub-teams, no contact info) + `GREETERS LIST.docx` (flat contact list w/ email+phone, some entries are couples sharing one email) via python-docx, cross-referenced by name, inserted 22 new `volunteers` rows under the "Greeters" team with `subTeam` set to "Team 1"–"Team 4" as appropriate. Maury Moody (pre-existing record) remains the ONLY `isLead:true` Greeters record.
- [x] **Real bug found + fixed**: the `sub_teams` registry table only had `"Team 2"` registered for Greeters (the only sub-team ever created via the admin UI before this). Teams 1/3/4 volunteers were silently invisible in the Volunteers page grouping despite being correctly saved in the DB, until `sub_team_names` was updated to include all four.
- [ ] **Data gaps to flag to the church** (not silently guessed at): Cornelia Fahy has no phone/email anywhere in either source doc — left blank. Peter Fahy's email `fahy7@icoud.com` and Mary Principe's `capemep12@gmalil.com` look like typos in the source doc — transcribed exactly as given, not "corrected." Mary Principe has no phone at all. Carley Daniel and Stephanie Mendenhall are in the contact list but weren't assigned to any team in the teams doc — added under Greeters with no sub-team, same pattern as Maury.

## STATUS (2026-08-12): Full admin panel breakpoint sweep — IN PROGRESS, nothing pushed yet
Working page-by-page through the admin panel testing 320px up to 1920px (using an injected same-origin iframe, per the Breakpoint Testing Protocol in CLAUDE.md — never resizing the real browser window). All fixes below are CSS-only unless noted, all still sitting uncommitted in the working tree alongside the pre-existing uncommitted work from 8/11.

**Pages fully swept, all fixes verified at every breakpoint:**
- **Congregants** — grid overflow fix, new City/State/Zip fields (migration `0013_family_address_fields.sql` already applied to the live DB — confirmed below), name-row + child-row stacking under 560px. ⚠️ **Open item, not yet fixed**: the Add/Edit Family modal's Head/Spouse Email placeholders are hardcoded to `kevin@example.com`/`stephanie@example.com` — Kevin's own real info used as example text. Per his instruction, swap for generic placeholders before this file is next touched; not yet swept for the same pattern on other admin pages.
- **Dashboard** — Recent Activity list restructured so long entries don't truncate.
- **Prayer Requests** — Email/Phone + Status/Date now stack under 560px; the whole "Prayer Log" panel (not just individual cards) caps to 560px and centers between 600-1300px viewport width — a deliberate design call: cap the WHOLE container, not just inner cards, confirmed as the preferred pattern and reused on Subscribers/Notification Settings too.
- **Events** — date-above-details stacking (pre-existing), Start/End Date stack under 560px, fixed a hint-text-overlap bug that stacking caused (`.two-col-row + .repeat-hint` margin), **and a brand new feature: Event End Time** (see below).
- **Volunteers** — name-row stacking; Add/Edit Volunteer's Teams checklist no longer has a nested scrollbox (was an awkward "scroll within a scroll" on mobile) and the "team lead" sub-checkbox indent shrinks from 26px to 12px under 560px; **real CSS specificity bug fixed** — `.team-row label { display:flex }` was overriding `.lead-check-row { display:none }`'s more specific intent, so the "make this volunteer the team lead" option showed for every team regardless of checked state, even though the JS toggle to show/hide it correctly was already there and working. Also fixed the team-card header pill (`Greeters · 3 volunteers`) wrapping onto 2 lines or overflowing the card on longer team names — now always drops to its own line under the title at mobile/tablet widths (deliberate default, not just a wrap-when-it-doesn't-fit fallback), goes back to side-by-side at tablet+ (560px+).
- **Subscribers** — name-row stacking; Source/Added split into their own full-width rows under 720px (was awkwardly sharing one row); the "Mailing List" panel caps to 560px and centers, but **only between 600-720px** — tried capping it all the way up to 1300px like Prayer Requests first, but that broke the table's own wider column layouts (Source column got crushed at 1440px, a real regression Kevin caught) since those were sized assuming a full-width row. Reverted that part, kept panel-cap scoped to just the range where the row is genuinely single-column.
- **Notification Settings** — recipient emails already wrapped correctly (pre-existing fix); the "+ Add" input/button row now stacks under 480px (button drops below, stays compact width, right-aligned) instead of squeezing the placeholder text; the whole page container narrows to 560px between 600-1300px (same "cap the whole panel" pattern), reverts to its normal 760px cap outside that range.
- **Newsletter** — reviewed, no fixes needed. Deliberately shows a "Desktop only" placeholder under 900px (a one-time JS check at page-load, not a live media query — if testing this page, reload fresh at each width rather than just resizing, or the placeholder won't update). Composer itself looks clean 1024px through 1920px.
- **Photos, Staff** — pre-existing fixes from before this session (grid overflow, mobile table rework), not re-touched today.

**Not yet started:** Content Editor.

**Not yet reviewed this session, need to circle back**: whatever's currently mid-test — see the live session for exact position.

## NEW FEATURE (2026-08-12): Event End Time — built + verified working end-to-end, still uncommitted
Events could only ever show a single start time ("at 5:30 PM"). Added an optional End Time so it displays as a range ("5:30 PM–7:00 PM").
- [x] Migration `0014_event_end_time.sql` — adds nullable `end_time time` to `public.events`. **Already applied to the live database** (see below for how — this one didn't need the old browser workaround).
- [x] Add/Edit Event modal: new End Time field next to Time, in the same responsive two-col-row as Start/End Date.
- [x] Validation: End Time requires a Start Time to be set too; End Time can't be at-or-before Start Time.
- [x] Display: `formatDateOrRange()` line now shows `5:30 PM–7:00 PM` when both are set, falls back to just `5:30 PM` when End Time is blank — unchanged for existing events.
- [x] Verified end-to-end on localhost: edited the real "Saturday Evening Church Service" event, set End Time to 7:00 PM, saved, confirmed it now reads "...at 5:30 PM–7:00 PM" on the list.

## INFRASTRUCTURE (2026-08-12): Supabase migrations no longer need a browser — SOLVED
Previously every schema migration for this project required the Supabase SQL Editor by hand (no CLI, no DB password, no connection string existed anywhere). Fixed properly instead of working around it again:
- [x] Supabase CLI installed (`C:\Users\kwmcc\.local\bin\supabase.exe`, on PATH).
- [x] Scoped personal access token generated ("CLI - CCB Work", 90-day expiry → ~2026-11-10, project-only, exactly 3 permissions: Project Settings Read, Database Read-write, Migrations Read-write) — saved as `SUPABASE_ACCESS_TOKEN` in `admin/server/.env` (gitignored).
- [x] Confirmed working: schema changes now run via a plain `curl` to the Management API's `/database/query` endpoint, straight from the terminal, no browser needed. Full method + the token-renewal steps documented in the `project_ccb_admin_panel` memory file.
- [x] Migration `0013_family_address_fields.sql` (adds city/state/zip to `congregant_families`) — checked directly via the new method 2026-08-12: already applied to the live DB (columns exist), just hadn't been confirmed/checked off before now.

## Testing note — Panel Announcements (localhost only!)
Each time an announcement's code/copy is updated during local testing, `panel_announcement_dismissals` needs to be manually cleared (`delete from public.panel_announcement_dismissals;` via Supabase SQL Editor) or the popup won't show again — it correctly remembers it was already dismissed. **This is a localhost-testing-only step** — never clear real dismissals once this feature is live for actual staff, since that would make already-seen announcements pop back up for everyone.

## STATUS (2026-08-11): LIVE on production, commit `37c389d` pushed to both `origin` and `production`, verified live on christchurchbluffton.org (checked the Serve page Scripture-quote fix rendered correctly as proof the new deploy actually went out).

## 2026-08-10/11 — Submitter auto-reply emails (prayer, contact, newsletter) + Subscribers dedupe
Copy for all three drafted and approved by Kevin via local preview server (`npx http-server`, port 5511) — preview files kept in `comm/client/` for reference: `2026-08-10-prayer-autoreply-email-preview.html`, `2026-08-10-contact-autoreply-email-preview.html`, `2026-08-10-newsletter-autoreply-email-preview.html`.
- [x] `bradley@christchurchbluffton.org` added to prayer request staff notifications (was admin@ + jonathan@ only)
- [x] Prayer request auto-reply — pastoral tone, quotes the submitted prayer back, sends only if an email was given (form allows anonymous submissions), reply-to `admin@christchurchbluffton.org`
- [x] Newsletter auto-reply — confirms the signup, includes an unsubscribe-by-replying line, reply-to `info@christchurchbluffton.org` (matches the address already public on the Contact page)
- [x] Contact form auto-reply, branches on the "I'm Interested In" dropdown: **Prayer Request** → same pastoral reply as the dedicated prayer form, **Receiving Updates** → same subscribed-confirmation as the newsletter form, everything else (Visiting/Volunteering/Other) → standard "Message Received" reply — per Kevin's explicit rule 2026-08-10
- [x] Staff notification emails temporarily disabled 2026-08-11 for a real staging test (submitted every form + every contact-form branch with a real address, confirmed correct auto-replies arrived, confirmed staff got nothing) — then restored/uncommented before the final push, verified no leftover TEMP markers
- [x] `src/admin/subscribers.html` — Subscribers list now dedupes by email for display (most recent submission wins); public forms still don't block duplicate signups, this is a display-only fix. Removing the shown row only deletes that one raw record — if older duplicates exist for the same email, the next one surfaces after the top is removed. Found this in practice during test-data cleanup: 2 leftover raw rows existed for `kevin@forgeddigitaldesign.com`, Kevin removed one via the panel, second one found and removed via direct Supabase query (`server/.env` credentials, REST API — no full CLI needed).
- [x] Staging site (`christchurch-bluffton.netlify.app`, ForgedDigital-owned) had zero indexing protection (robots.txt wide open, page's own meta tag said `index, follow`) — fixed via a Netlify **Snippet injection** (Post processing → Snippet injection, insert before `</head>`) adding a `noindex, nofollow` meta tag, scoped to that one Netlify site only. Doesn't touch the repo, doesn't affect production (different Netlify site entirely).
- [x] Team email drafted and finalized by Kevin announcing all of the above, ready to send.

## 2026-08-11 — "Notification Settings" admin page (Kevin's idea, built same day, scope expanded to all 3 forms + Site-Admin-only)
Who gets notified about a form submission was hardcoded directly in the function files — changing it (like adding bradley@ earlier the same day) required a code edit + deploy every time. This page lets Site Admins manage those recipient lists themselves, no deploy needed after today's one-time push.
- [x] Migration `0009_notification_settings.sql` — new table, one row per form (`prayer`/`contact`/`newsletter`) holding a `recipients` text array, seeded with the addresses already live at the time so nothing changed on apply. RLS restricted to `is_site_admin()` only (same tier as Accounts/team.html) — not a togglable per-staff permission.
- [x] **Migration had to be run manually via the Supabase SQL Editor** — confirmed the REST API (used everywhere else in this project for row-level work) cannot run schema changes like `CREATE TABLE` under any credentials; that's a hard capability limit, not a workaround. Also hit a real snag getting there: the Supabase account logged into the browser only had access to 4 unrelated projects — the CCB project is under a *different* Supabase login entirely. Resolved by switching to the correct connected Chrome browser (named "Christ Church Bluffton") via the browser-selection flow. Applied and verified live (`select * from notification_settings` confirmed all 3 rows correct) 2026-08-11.
- [x] New page `src/admin/notifications.html` — three sections (Prayer/Contact/Newsletter), each showing current recipients with add/remove, native `confirm()` before removing, blocks removing the last recipient on any list.
- [x] Sidebar entry added to `includes/sidebar.html`, propagated to all 13 admin pages via `node build-sidebar.js` (run from `admin/`) — also added `notifications` to that script's own page list so future syncs include it automatically.
- [x] `prayer.js`, `contact.js`, `stay-updated.js` — added a shared `getRecipients(formKey, fallback)` helper, fetches from the new table at submit-time (not build-time), falls back to the current hardcoded list if the table's empty or the fetch fails so a database hiccup can't silently kill notifications. Fallback list is frozen at what was hardcoded 2026-08-11 — it does NOT track live panel edits, that's the database's job.
- [x] `notification_settings_edit` added to `ACTIVITY_LABELS` in `shared.js`, logged on every add/remove.
- [ ] **Not yet pushed anywhere** — built and tested against the live database from localhost per Kevin's instruction to keep this one on localhost for now. Next: push to `origin` for staging test, confirm the panel + notification routing both work end-to-end, then `production`.

## Future phase — Unsubscribe mechanism (not started, separate from the auto-reply work above)
Decided 2026-08-10: unsubscribing marks a subscriber as unsubscribed rather than deleting them, so staff can see who unsubscribed and when.
- [ ] Add a Supabase migration giving `subscribers` a real status (e.g. `unsubscribed_at` or a status column) — currently that table has no such field, staff just hard-delete someone to "unsubscribe" them today.
- [ ] Build a real unsubscribe link using a per-person token (not a plain email address in the URL, which anyone could use to unsubscribe someone else) — new small Netlify function + a simple confirmation landing page.
- [ ] On unsubscribe: notify `info@christchurchbluffton.org` and reflect the change in the admin Subscribers list.
- [ ] Once this is live, swap the newsletter auto-reply's "reply or email us to unsubscribe" line for the real one-click unsubscribe link.
- [ ] Update `privacy.html`'s unsubscribe language to match the new real mechanism (currently says "contact us" only).

## STATUS (2026-08-06): LIVE on production, commit `f1e2bd4` pushed to both `origin` and `production`, verified working on the real domain. All 6 team accounts deleted + re-invited through the real magic-link flow (+ 1 test account for Kevin), all 3 team emails sent. GSC: About page re-indexing requested; legacy "Indexed, though blocked by robots.txt" explained as stale pre-launch data, no action needed — check back ~mid-August to confirm it cleared. Taking a break here; next session picks up whenever there's new data/replies to review.

## 2026-08-06 — Site Admin tier follow-through, Staff permission lock, Bradley Chestnut bio, ghost link cleanup
- [x] Real magic-link Invite flow built end-to-end (Supabase `generate_link`, top-level `redirect_to` — nesting it under `options` silently fell back to the project's Site URL), replacing the old broken `localhost:8100` invite call and then the temp-password version that followed it. New `accept-invite.html` landing page, new `admin-team.js` function for Reset Password/Remove (also dead before today).
- [x] Blocking forced-password-reset modal (`showForcedPasswordResetModal` in `shared.js`) replaces the old redirect-to-account-page approach — renders over whatever page just loaded instead of losing the user's place.
- [x] Password field UX: eye-icon show/hide toggle added to every password field sitewide in the admin (`addPasswordToggle()`), autocomplete attributes fixed, no more preloaded value in the New Password field on Account Settings. "Forgotten your password? Contact kevin@..." line added to sign-in page — verified live on production.
- [x] Staff role locked out of permissions it will never use — Newsletter, Subscribers, Content Editor, Congregants, Events. Invite modal also now defaults to every checkbox unchecked instead of pre-checked.
- [x] Added a "Meet Our Worship Pastor" section to about.html for Bradley Chestnut (flipped layout vs. Jonathan's section, divider between the two). Two real Content Editor bugs found and fixed along the way: a missing `site_content_sections` registry row silently dropped all of the section's fields/images, and empty `original_value` on the inserted field rows silently blocked inline text editing — neither had any visible error, found via direct browser console inspection.
- [x] **Real bug found and fixed 2026-08-06**: Bradley's flipped section never collapsed to a single column at any screen width, all the way down to phone size (image squeezed to 40px wide) — a CSS specificity conflict where `.pastor-grid.reverse` (unconditional) outranked the mobile media query's plain `.pastor-grid` rule. Fixed by adding a matching override inside the media query; verified via iframe-injection testing at 1440/1200/1050/1024/1023/900/768/480/375/360px.
- [x] Removed the hidden gallery listing page (`src/a34317d8/index.html`) — it went stale on every new admin upload without a redeploy. Kept the underlying Netlify→Supabase Storage proxy redirect and all 5 real static photo files, so individual "Copy Link" URLs from the admin Photos page are completely unaffected.
- [x] Added explicit 404 redirects in `netlify.toml` for the bare `/a34317d8` and `/a34317d8/` paths (no filename) so they show the site's normal 404 page instead of a raw Supabase JSON error — verified live on both staging and production (404 status, real branded not-found page; real photo links unaffected).
- [x] 12 real photos moved (not copied) from Downloads into `src/images/` — Bradley's headshot (now wired into about.html) plus 11 others (communion table setting x6, greeting guests entrance x4, one alternate Bradley headshot) still unplaced, not yet requested.
- [x] Three email drafts saved to `comm/client/` (team explainer, Jonathan's Reading Mode feature, Judy's Photos walkthrough) — **all 3 sent by Kevin 2026-08-06**, after review passes that caught a stray "Judy," line mid-paragraph in the group email (fixed before sending) and flagged a duplicate "Account permissions" bullet (left as-is, Kevin's call).
- [x] **Pushed to `origin` AND `production` 2026-08-06, commit `f1e2bd4`** — verified live on christchurchbluffton.org (About page breakpoints, ghost-link 404s, admin panel login/Accounts/Content Editor all checked directly).
- [x] Bradley Chestnut promoted to Site Admin (Kevin's own action, confirmed live).
- [x] Jonathan Riddle deleted + re-invited alongside the other 5 so his account goes through the same real magic-link flow (he'd been on the account from an earlier real-invite test, so was previously "Active" — now reset to "Invited" like everyone else).
- [x] **All 6 non-Kevin team accounts deleted and re-invited** through the real magic-link flow, plus a 7th test invite (`contact@forgeddigitaldesign.com`, "Kevin McCartney Test", Site Admin) so Kevin can walk through the real flow himself. All 7 confirmed "Invite Sent" with a real one-click link emailed via Resend:
  - Christ Church Admin → admin@christchurchbluffton.org → Site Admin
  - Christ Church Info → info@christchurchbluffton.org → Admin (all permissions)
  - Kim Perri → kimperri@aol.com → Admin (all permissions)
  - Bradley Chestnut → bradley@christchurchbluffton.org → Site Admin
  - Treasurer → treasurer@christchurchbluffton.org → Admin (all permissions)
  - Jonathan Riddle → jonathan@christchurchbluffton.org → Site Admin
  - Kevin McCartney Test → contact@forgeddigitaldesign.com → Site Admin
- [x] GSC: requested re-indexing for `/about` (content changed). Reviewed legacy "Indexed, though blocked by robots.txt" warning (2 pages: root + www variant, last crawled 7/23, validation started 8/1) — confirmed stale pre-launch robots.txt data, not a current issue. **Check back ~mid-August** to confirm it cleared to "Passed."
- [ ] Not yet requested: wire the 11 remaining unplaced real photos (`communion-table-setting-1` through `-6.webp`, `greeting-guests-entrance-1` through `-4.webp`) into actual pages.

## STATUS (2026-08-05, historical): LIVE, no open blockers on the public site. 11 commits pushed to both `origin` and `production` that day.

## 2026-08-05 — Admin panel merged into this repo, LIVE at /admin, live-site forms now feed it
- [x] Admin panel moved from a standalone repo into `src/admin/` in this repo, deployed as part of the normal site build, reachable at `christchurchbluffton.org/admin`
- [x] Fixed real bugs surfaced by the merge: Content Editor's live preview was completely broken (CSP `frame-src` blocking its own iframe, then a stale `<base href>` breaking every image inside it once the iframe itself loaded), Photos page thumbnails were broken (files existed locally but were gitignored, never actually deployed)
- [x] Photos page: uploads now go through a naming step (auto-slugified filename, JPG-only), and every photo link — old or new — resolves at the same `christchurchbluffton.org/a34317d8/<filename>` URL via a Netlify proxy redirect, so new uploads work instantly with no deploy needed
- [x] Newsletter footer form, contact form, and the floating prayer request popup all now write into the admin panel automatically (Subscribers / Prayer Requests) — previously completely disconnected, only sent email + wrote to Breeze
- [x] Contact form: new "Would you like someone to follow up with you about this?" checkbox when "Prayer Request" is selected, adds a real Prayer Requests entry in addition to the Subscribers entry
- [x] Prayer popup: added optional Email/Phone fields; fixed a bug where it got stuck on the "Thank you" screen after submitting instead of resetting for a second use
- [x] Netlify environment variables (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`) added to both the testing and production Netlify sites (separate accounts) so the live forms can actually write to the database
- [x] Added 2 new real admin-panel team members: Bradley Chestnut, and a generic Treasurer account. Every account's password reset to a real distribution temp password and status set to "invited" (except Kevin's own), so each person is forced to set their own password the first time they sign in
- [x] Dashboard's Recent Activity list (12 entries + "Load 10 more") — confirmed live in production (commit `cf89a91`), this line was stale
- [ ] Drafted a team-explainer email and an admin-panel-invite email template — see `comm/client/` — not sent yet

## STATUS (2026-08-03, historical): LIVE, no open blockers. Commits `245a8b3` + `2b83e0d` pushed to both `origin` and `production`.

## 2026-08-03 — Notification emails, contact routing, volunteer image page
- [x] Contact/Prayer/Newsletter notification emails now send styled HTML (navy/gold, matches site) instead of plain text — plain-text fallback kept for non-HTML email clients
- [x] Sender display name is now per-form (`Contact Form Submission` / `Prayer Request` / `Newsletter Submission`) instead of one generic `Christ Church Bluffton <notifications@...>` name for all three
- [x] Contact form routing simplified — every submission now goes to **both `info@` and `admin@christchurchbluffton.org`**, regardless of the "I'm Interested In" dropdown (an interim conditional-by-interest version was built, then replaced same-day before ever going live, per Kevin's follow-up decision)
- [x] Built an unlisted, non-indexed image page at `christchurchbluffton.org/a34317d8` for a volunteer's HTML flyer emails — see [[christ-church-bluffton-notes]] memory for full detail (robots.txt disallow + noindex meta, 4 flyer images standardized to 1200px/JPG for email compatibility, easy to add/remove images later)
- [x] GSC "Blocked by robots.txt" / "Indexed, though blocked by robots.txt" legacy warnings (line below, previously open) — clicked Validate Fix on both in GSC during this session; confirmed these are stale pre-launch crawl data (current live robots.txt is fully open), not a real bug. Validation in progress as of 8/3, should clear within ~2 weeks — check back mid-to-late August.

## STATUS (2026-07-27, historical): ON STANDBY TO GO LIVE. Code/backend is fully confirmed launch-ready — client will trigger the actual domain cutover on their own timing. See "Go-Live / Domain Cutover" below for the exact checklist for that moment.

## Post-Launch Site/GA4/GSC Audit (2026-08-01, second full pass after go-live)
- [x] Live Lighthouse re-run against production (not local dev server): Performance 93, Accessibility 100, Best Practices 96, SEO 100. Core Web Vitals all "good" except CLS at 0.129 (borderline, minor, not urgent). One console error (Turnstile code 600010) only appears under Lighthouse's own headless/automated browser — real-browser tests today got clean 773-char tokens, not a real user-facing issue.
- [x] Security headers confirmed solid on production: CSP scoped to only the actual third parties in use, HSTS with `preload`+`includeSubDomains`, no other gaps.
- [x] **GA4 Key Events cleaned up** — `generate_lead` (the event added earlier today) is confirmed firing correctly and has been starred as a Key Event. The 3 previously-configured Key Events (`close_convert_lead`, `purchase`, `qualify_lead`) were stale/unused leftovers with zero data ever — all un-starred.
- [x] GA4 data caveat noted: current 28-day numbers mix real launch traffic with weeks of internal dev/testing traffic on the same property (100% "(direct)/(none)" source, Ashburn VA in top cities = automation signature). Filter any real reporting to 8/1/26 onward.
- [x] GSC sitemap confirmed "Success" status, 9 discovered pages (matches real page count exactly). Homepage individually confirmed indexed via URL Inspection.
- [x] GSC's aggregate Pages/Indexing chart and Core Web Vitals report both show stale/no data — expected lag, not a real issue, will catch up over the next 1-2 weeks as Google recrawls.
- [x] **Legacy GSC warning validated**: "Indexed, though blocked by robots.txt" + "Blocked by robots.txt" (both pre-launch robots.txt `Disallow: /` issue, already fixed) — Validate Fix clicked on both 2026-08-03, see 2026-08-03 section above.

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
- [x] 9b. Gold "eyebrow" label text sitewide — FIXED 2026-07-31: `.page-label` (5 pages, navy header band, 5 instances) → `#c9ac66`, 4.44:1→4.89:1. `.section-label` (5 pages, light/white sections, 16 instances) → switched to existing `--gold-text` (#7F6D34, already used elsewhere for hover states, no new color introduced), 2.19-2.42:1→5.07:1 on white / 4.61:1 on lightest-gray. Verified live on Groups + Home. **CORRECTION 2026-08-01: this "complete" sweep was NOT actually complete — see Post-Launch section below, found via a broken search pattern that silently returned zero results.**

## Post-Launch Bug Fixes (2026-08-01) — found via live testing right after go-live
- [x] **Real bug, confirmed on live site**: Cloudflare Turnstile token was never refreshed after a successful form submission (only reset on failure) — meant any second submission attempt on the same page load (newsletter, prayer, or contact) would silently reuse an already-spent token and fail. Reproduced live: first newsletter signup succeeded (confirmed via Resend dashboard, email delivered), second one in the same tab failed. Worse for prayer requests specifically — `prayer.js` deliberately fakes a 200 success on Turnstile failure ("pastoral UX" so visitors never see an error), so a stale-token failure there means the visitor sees "Prayer Received" but the pastoral team never gets the email. Fixed: added `turnstile.reset()` to the success path (not just failure) in `components.js` (newsletter + prayer) and `contact.html`.
- [x] Noted, not changed: prayer form intentionally collects no contact info (name optional, no email/phone) — confirmed this matches an existing 2026-07-24 client decision (no Breeze CRM record for prayer, email-only), not an oversight. Flagged to Kevin, no action taken.
- [x] **Color contrast sweep was genuinely incomplete** — my 2026-07-31 "9b" search used a broken regex that silently matched nothing, so I reported it complete when ~23 more instances remained. Found while fixing the 404 page's "Return Home" button (same old `#c3a355` on navy, 4.44:1 fail) and re-ran a proper search. Full corrected list, all fixed 2026-08-01:
  - `#c9ac66` (navy backgrounds): `.cta-btn` on About/Contact/Give/Home/Join Us/Groups/Serve (7 files), homepage loader subtext, Privacy/Terms page-header label, 5 footer link hover states in `shared.css`, 404 page button
  - `--gold-text` (light/white backgrounds): vision-card icons (Home + About), location-card icon + worship-column icons (Join Us), 3 scripture-quote citations (About/Give/Join Us), card-link text (Home), motto-band hover (Home), ministry-subtitle (Serve), mobile menu hover/active state (`shared.css`)
  - Caught + fixed a mistake mid-fix: a line-targeted script edit hit the wrong `var(--gold)` occurrence on Groups/Serve's single-line `.cta-btn` rule (changed the border instead of the text) — caught on verification and corrected
  - Left alone (not real issues): 2 decorative background quote-mark glyphs (opacity 0.3, non-text), 2 icons already on navy backgrounds that pass the lower 3:1 icon threshold, 1 dead/unused CSS rule (`.pastor-credit`, not referenced in any page)
- [x] Live post-launch smoke test: Tithe.ly Give embed ✅, contact form Turnstile ✅ (green "Success"), Google Maps embed ✅, 404 page ✅ (correct status + custom page), Prayer FAB open/close ✅, console errors clean on Home/About, zero broken resources, GA4 Realtime confirmed tracking real domain traffic
- [x] Moved 2 orphaned/unused images (`fellowship-conversation-tech.webp` + `-700.webp`, never referenced in any HTML) out of `src/images/` to sibling `Christ Church Bluffton - Unused Images/` folder
- [x] **Second, bigger Turnstile bug found post-fix**: even with the reset-on-success fix live, the newsletter/prayer widgets were still failing — root cause was that Cloudflare's automatic page-scan runs once on load and never picks up widgets that get added to the DOM later via JS (the footer and prayer FAB are both injected after page load, not present in initial HTML). This is a pre-existing issue, not caused by anything from today, and likely means the newsletter/prayer forms have been broken for real visitors for a while. Fixed by switching to Turnstile's explicit-render mode on all 9 pages with a Turnstile widget, calling `turnstile.render()` manually in `components.js` right after the footer/prayer FAB HTML is actually injected, plus contact.html's own static widget (auto-render had to be replaced everywhere since explicit mode disables it globally).
- [x] **PUSHED TO PRODUCTION 2026-08-01** — all fixes (contrast sweep, GA4 tracking, both Turnstile bugs) now live on `christchurchbluffton.org`. Kevin tested all 3 forms (contact, newsletter, prayer) directly on the live site — confirmed all working.

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
- [x] Coming Soon page fully overwritten by the 2026-08-01 production push (force-push replaced the entire repo history/files) — confirmed live title is the real site, not the countdown page.

## Launch Day Walkthrough — the actual go-live push (moved out of Pre-Launch Punch List 2026-07-31, do this last, step by step, confirm before each push)
Pre-flight (already confirmed 2026-07-31, no action needed):
- [x] `christchurchbluffton.org` DNS already points to the correct Netlify site (75.2.60.5) — no DNS change needed
- [x] SSL already valid on the domain (HTTPS 200, HSTS present)
- [x] `src/robots.txt` already correct (`Allow: /` + sitemap link) and `src/sitemap.xml` already valid — just need to actually reach production (see steps below)
- [x] GA4 tag (`G-PTWWV0M0DX`) already in every page of `src/` and already confirmed sending data to the right property

The push itself:
1. [x] Add the production repo as a git remote — DONE 2026-08-01, `production` -> `ChristChurchBuffton/christchurchbluffton.git`. Found unrelated git history vs `origin` (no common ancestor), flagged to Kevin before proceeding.
2. [x] Push local `main` to the production repo's `main` branch — DONE 2026-08-01, force-pushed (required due to unrelated history) `03a742c...565c7ab main -> main (forced update)`. **SITE IS LIVE.**
3. [x] Confirm Coming Soon page overwritten — DONE 2026-08-01: live title now "Christ Church Bluffton | Church in Bluffton, SC", Coming Soon countdown gone
4. [x] Confirmed real site live on all pages — DONE 2026-08-01: `/`, `/about`, `/join-us`, `/groups`, `/serve`, `/contact`, `/give`, `/privacy`, `/terms` all return 200
5. [x] robots.txt fixed — DONE 2026-08-01: now shows `Allow: /` + sitemap link, old `Disallow: /` gone
6. [x] sitemap.xml live — DONE 2026-08-01: returns 200
7. [x] Sitemap resubmitted in GSC — DONE 2026-08-01 by Kevin
8. [x] URL Inspection → Request Indexing — DONE 2026-08-01, all 9 real pages submitted by Kevin
9. [x] All 3 forms tested live on production by Kevin directly — confirmed working (contact, newsletter, prayer)
10. [x] GA4 Realtime confirmed active during today's automated + manual live testing
11. [x] Rollback plan — DEFINED 2026-08-01: if a real problem shows up on production, revert to the last known-good commit with `git push production <commit-sha> --force` (from the `Christ Church Bluffton` project folder) — Netlify auto-redeploys within ~1 minute of any push to that repo. Known-good checkpoints: `565c7ab` (initial full-site launch, before today's contrast/GA4/Turnstile fixes) or `27b4067`/`3f54715` (today's fixes, current state). Only reverts code — any Breeze contacts or Resend emails already sent aren't undone by a rollback, which is expected/fine. Extreme fallback (site itself needs to come down again): revert to `03a742c`, the old Coming Soon page commit.

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

## Post-Launch QA — reorganized 2026-07-24, categorized per client
- [x] Verify Tithe.ly donation button/modal works on production — confirmed working 2026-07-24 per client, re-confirmed live 2026-08-01
- [x] Google Analytics — DONE 2026-08-01, confirmed flowing (see Launch Day Walkthrough)
- [x] SSL verification — DONE 2026-08-01, confirmed valid
- [x] Google Search Console — DONE 2026-08-01, sitemap resubmitted + all 9 pages Request Indexing by Kevin
- [x] Lighthouse audit — DONE 2026-07-31/08-01, see Pre-Launch Punch List #8
- [x] Color contrast review (WCAG AA) — DONE 2026-08-01, see Pre-Launch Punch List #9/9b + Post-Launch section

## Cleanup
- [x] ~~Delete duplicate `Web Design/Christ Church Bluffton/` folder~~ — checked 2026-07-24, doesn't exist, already resolved previously
- [x] Remove backup files from src/ — done 2026-07-24 (16 files to Recycle Bin). **Round 2, 2026-08-01**: today's editing session generated 16 more `-previous.*` files across `src/` — moved (not deleted) to `archive/src-backups-2026-08-01/`, preserving subfolder structure (`css/`, `images/`, `includes/`, `js/`). None were git-tracked (`*-previous.*` is gitignored), so this was a filesystem move only, no git action needed. `src/` confirmed clean of any `-previous.*` files.
