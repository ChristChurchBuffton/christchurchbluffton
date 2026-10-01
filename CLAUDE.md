# Claude Working Instructions

## Communication style
Explanations to the user should be to the point and in plain language — no jargon, no unnecessary preamble.

## Deployment Model — READ THIS BEFORE TOUCHING DOMAIN/DNS/NETLIFY
**One GitHub repo** (`ForgedDigital/christ-church-bluffton`, `main` branch), but **two separate Netlify accounts** deploy from it — do not confuse them:
1. **Kevin's (ForgedDigital) Netlify account** — the temp/testing link, used for all review and testing. Pushes from Claude resolve as this identity by default.
2. **Jonathan's own Netlify account** — the real production site, `christchurchbluffton.org`. Both accounts have the same env vars set.
- **The actual live-deploy trigger is the client's own manual step**, not something Claude does: their local git client shows a Windows Credential Manager identity picker on push (3 cached identities), and the client selecting "Christ Church" there is what makes it go live. Claude's pushes structurally cannot reach production this way.
- If a Claude push ever hangs/fails, it's usually an expired Windows Git Credential Manager token — Claude has no way to complete GCM's interactive re-login (no TTY). Fix: one manual `git push` by Kevin (via `!` prefix) refreshes the token.

## Project Rules
- Always create a `-previous` backup of files before making changes
- Never delete files without explicit user confirmation
- Never push to remote without explicit user confirmation
- Do not add Co-Authored-By tags to git commits
- **Supabase admin panel is part of THIS site now — same repo, same Netlify deploy, served at `/admin`** (corrected 2026-08-05; an earlier version of this note wrongly described it as a separate Netlify site with a future reverse-proxy — that plan is dead, do not resurrect it). Deployable pages live in `src/admin/` (published by Netlify same as the rest of `src/`). Dev-only tooling (`server/` — Express backend, port 8100, distinct from the public site's own `server/` on port 3002 — plus `supabase/` migrations and `build-sidebar.js`) stays at repo-root `admin/`, outside the deploy path, same pattern as the site's own `server/`. Credentials live in `admin/server/.env` only (gitignored) — see `christ-church-bluffton-notes` memory for project ref/keys. Root `netlify.toml`'s CSP is extended (Supabase + jsdelivr) and has a dedicated `/admin/*` noindex header — don't strip those thinking they're leftover site-only rules.
- **`admin/` and `src/` changes commit and push together now** (as of 2026-08-05, reversing the prior "never together" rule above). When Kevin says "commit and push," stage and push everything relevant across both — they're one repo, one push workflow. Still always ask before the actual push itself.

## Accessibility — WCAG 2.1 AA
Every fix or new feature meets WCAG 2.1 AA / ADA Title III requirements — build it in, don't retrofit later. Full methodology: `Web Design\_Accessibility Audit Playbook\`. This project's audit status: `Web Design\_Accessibility Audit Playbook\Findings\2026-08-21-full-site-audit.md`.

## Form Test Mode — testing forms without reaching the church
All three public form functions (`contact.js`, `prayer.js`, `stay-updated.js` in `src/netlify/functions/`) have the Form Test Mode switch (added 2026-09-21). Standard + how it works: `Web Design\_Service Integrations Playbook\Form Test Mode\`. The helper is `src/netlify/functions/lib/form-test-mode.js`.
- **One variable: `FORM_TEST_MODE_TO=<Kevin's own email>`.** Set ONLY on the temp Netlify site (`christchurch-bluffton.netlify.app`, Kevin's account). **NEVER on Jonathan's live site** (`christchurchbluffton.org`) — it would silently send every real submission to Kevin instead of the church. Unset = normal behavior, byte-for-byte unchanged (proven against the pre-switch code).
- In test mode: every email (staff notification AND the visitor's auto-reply) goes only to that address, tagged `[TEST]` with a yellow banner listing who it would really have reached; nothing is written to Supabase (Subscribers, Prayer Requests) or Breeze; Turnstile still runs; every response carries `X-Form-Test-Mode: on`. A bad value fails closed (500, nothing sent).
- **Pre-flight probe (temp site ONLY — never aim it at the live domain) — required before any form submission on the temp link.** Must show `X-Form-Test-Mode: on`; if nothing prints, STOP (variable missing, or site not redeployed after setting it) — a submission would email the church:
  `curl -s -i -X POST https://christchurch-bluffton.netlify.app/.netlify/functions/prayer -d "{}" | grep -i x-form-test-mode` (repeat for `contact` and `stay-updated`).
- Dry-run harness (fully stubbed, sends/writes nothing): `node workflow/form-test-mode/test-form-test-mode.js workflow/form-test-mode/test-cases.json` — must pass after ANY change to a form function. 6 cases: contact (3 routing branches), prayer (with/without email), newsletter.
- Launch/post-launch check: confirm `FORM_TEST_MODE_TO` is ABSENT on Jonathan's Netlify site. Netlify env-var changes only reach functions on the next deploy.
- `admin-invite.js` (Site Admin invites a team member: creates a login + sends an invite email) does NOT have the switch — it's a logged-in admin action, not a public form; don't exercise it on the temp link against real people.

## Sitemap maintenance
`src/sitemap.xml`'s `<lastmod>` dates must be updated whenever a page's real content changes, in the same commit as that change — not left to drift. Found 2026-09-03 that several dates had gone stale by weeks (Serve, Groups) or weren't touching the file at all despite real edits (Contact, after the same-day iOS zoom fix). When editing a public page, check whether its sitemap entry needs a matching date update before committing.

## Content Editor mirror maintenance
Every public page has a matching copy at `src/admin/assets/site-mirror/<page>.html`, used by the admin Content Editor's live preview iframe. **Whenever a public page in `src/` is edited, added, or removed, apply the identical change to its `site-mirror` copy in the same pass** — not a separate cleanup step. Found drift on 2026-09-07 (a missing `@media (max-width:768px)` block in `site-mirror/about.html`, a missing `<wbr>` in `site-mirror/groups.html`'s mailto link) — small, easy-to-miss mismatches from edits that only touched the real page. A structural review/sync audit of every page's mirror against its real counterpart is scoped as the first step of Workflow 4 (`workflow/agent-workflow-specs.md`) before any further Content Editor work.

Run `node admin/check-editor-sync.js` after any change to a public page, the shared header/footer, or the editor's saved records — it checks that the preview copies match, that every saved record still matches its page text, and that every piece of page text and every photo has a record (exit code 1 on problems). It has already caught stale records and wrong-element matches.

## Content Editor — Publish (added 2026-09-28)
- Editing works only on localhost and the temp site, and only top admins (`site_admin`, Content Editor not turned off) can save — enforced in the database by `can_edit_content()` (migration 0027), not just on screen.
- **Publish Page** (`src/netlify/functions/publish-content.js`) commits a page's saved text, links and photo swaps to the TEMP repo (`ForgedDigital/christ-church-bluffton`, `main`) in one commit through a GitHub App; Netlify then rebuilds the temp site. It refuses to run on the live domain. The GitHub App env vars (`GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`) go on the TEMP Netlify site ONLY — never on Jonathan's.
- Publish commits to `origin/main` from the server, so `git pull origin main` before your next local commit/push, and before ever pushing to `production`.
- **Preview Draft** (`preview-content.js`) is a signed 30-minute link showing the page with saved changes applied. The page list shows a count of saved-but-unpublished changes.
- Photo swaps overwrite the site's file under its existing name (every responsive size); the original bytes are kept once in storage (`content-images/_originals/`) so "Use Original Photo" always works.
- The text/HTML matching lives in `src/netlify/functions/lib/content-engine.js`. It must skip exactly the areas the editor skips (`NEVER_EDITABLE_SELECTOR` in `content.html` ↔ `NEVER_CLASSES` in the engine) — change them together.

## SEO / Indexing — GSC Playbook
- Before launching this site (or any future re-launch) and before any update that touches indexing (URL/slug structure, sitemap, meta tags/canonicals, redirects, robots.txt), follow `Web Design\_GSC Playbook\` — start at its `01-walkthrough.md`. It covers pre-launch readiness checks, the launch-day GSC procedure, post-launch monitoring, and handoff.
- For deeper/framework-specific indexing troubleshooting, `Web Design\_SEO Playbook\` is the broader reference `_GSC Playbook` points back to.

## Tech Stack
- Static HTML / CSS / JavaScript
- No frameworks
- Hosting: Netlify
- Serverless: Netlify Functions (contact, prayer request, newsletter)
- Email: Resend
- CRM: Breeze ChMS
- CAPTCHA: Cloudflare Turnstile

## Folder Structure
- `src/` — Deployable site code (Netlify publish directory)
- `admin/` — Supabase-backed admin panel's dev-only tooling (`server/`, `supabase/`, `build-sidebar.js`) — the actual deployable pages live in `src/admin/`, published to `christchurchbluffton.org/admin` as part of the normal site build
- `reference/` — Original site build for content/design reference (not deployed, gitignored)
- `assets/` — Logos, business docs, flyers
- `workflow/` — Project workflows and dev notes
- `comm/` — Client and internal communications
- `decisions/` — Architecture and design decision logs
- `notes/` — Scratch notes and brainstorming
- `archive/` — Old/deprecated files (gitignored)
- `server/` — Local dev server

## Code Standards
- Use semantic HTML
- Mobile-first responsive design
- Keep JavaScript minimal and vanilla
- Fonts: Lora (headings), system sans-serif (body)

## File Naming
- All lowercase, hyphens for spaces: `about-us.html`, `hero-banner.webp`
- Images: descriptive names, `.webp` format for production

## What NOT to Do
- Do not add comments or docstrings to code you did not change
- Do not refactor or "improve" code beyond what was asked
- Do not create documentation files unless explicitly requested

## Git Remotes
- `origin` → `ForgedDigital/christ-church-bluffton` (staging/save — Kevin pushes here first)
- `production` → `ChristChurchBuffton/christchurchbluffton` (the live site — pushed second, same commits)

## Breakpoint / Responsive Testing Protocol
Full protocol lives in `Web Design\_Breakpoint Playbook\` — start at its `README.md`.
Covers the fixed 9-device testing checklist, the same-origin-iframe testing technique
(never resize the real browser window), and where CSS breakpoints themselves should
actually go (content-based, not fixed device widths).
