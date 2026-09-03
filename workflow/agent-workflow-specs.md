# Agent Workflow Specs

Working notes for the batch of 3-4ish build workflows Kevin is setting up 2026-09-03.
Each section below is one planned Workflow tool run. Not executed yet — gathering specs first.

## ✅ Workflow 1 — Prayer Request routing fix + type-of-care selection — COMPLETE 2026-09-03 (local only, not pushed)
All items below shipped and verified live on the local dev server: routing bug fixed, rename applied, button text changed, 6 checkboxes added to both forms (multi-select, Other/Need reveals a free-text field), migration `0022_prayer_care_types.sql` applied to the live production database (`care_types text[]`, `other_need_text text` on `prayer_requests`), and the admin panel's Prayer Requests page now displays selected care types as tags under the request text. No console errors introduced (only the expected localhost Turnstile domain-lock error). Files touched: `src/includes/prayer-fab.html`, `src/contact.html`, `src/js/components.js`, `src/css/shared.css`, `src/netlify/functions/prayer.js`, `src/netlify/functions/contact.js`, `src/admin/prayers.html`, `admin/supabase/migrations/0022_prayer_care_types.sql`. **Still needs a commit + push to go live** — nothing has been deployed yet.

### ❗ PRIORITY — fix immediately, ahead of the rest of this workflow (Kevin, 2026-09-03)
### Confirmed bug (found 2026-09-03, verified via code + live Supabase query)
`src/netlify/functions/contact.js` — when a Contact-page submission has `interest === 'prayer'`,
the staff notification email is sent using `getRecipients('contact', ...)` (recipients:
info@christchurchbluffton.org, admin@christchurchbluffton.org). It should use the **prayer**
form's recipients instead (admin@, jonathan@, bradley@, bobdurst2030@gmail.com,
prayers@christchurchbluffton.org — see `notification_settings` table, form_key='prayer').
Net effect: a prayer request submitted via the Contact page currently does NOT notify Bradley,
Bob, or prayers@ — only ones submitted via the dedicated Prayer Request form/popup do.
**Fix:** route contact.js's prayer-interest branch through `getRecipients('prayer', ...)`
(or merge both lists) instead of `getRecipients('contact', ...)`.

### New feature — type-of-care checkboxes
Add selection options to the prayer request submission flow — needed on BOTH the homepage
(Prayer Request popup/FAB, `prayer.js`) and the Contact page's prayer branch (`contact.js`
+ `contact.html`'s "I'm Interested In" = Prayer Request path):
- Prayer Request (singular — corrected 2026-09-03 for consistency with the other 5 options)
- Hospital/Home Visit
- Communion
- Bereavement/Grief Support
- Spiritual Guidance
- Other/Need — likely needs its own free-text field

Ties into the still-open "Prayer & Pastoral Care" page/content work mentioned to Bradley
2026-09-03 (see `christ-church-bluffton-notes` memory) — selections should probably also
surface in the admin panel's Prayer Requests view, not just the notification email.

### Rename "Prayer Request" → "Prayer & Pastoral Care"
Applies to both the homepage popup/FAB prayer request feature AND the Contact page's
"I'm Interested In" prayer request option. Use the "&" symbol (Shift-7), not the word "and".
Note: this renames the overall form/section — checkbox option #1 in the type-of-care list
below stays "Prayer Requests" as one specific option within the renamed "Prayer & Pastoral
Care" form, not a conflict.

### Button text change
Submit buttons on the prayer request forms currently say "Submit Prayer" — change to
**"Submit Request"**. Noted only, not yet made.

**Open questions before build:**
- Multi-select (checkboxes, pick several) or single-select? Kevin said "checkboxes" — treating as multi-select unless corrected.
- Does `prayer_requests` table need a new column to store the selection(s), or is email-only enough for now?
- Should "Other" require the free-text field, or is it optional?

## Workflow 2 — TBD

## Workflow 3 — TBD

## Workflow 4 — TBD
