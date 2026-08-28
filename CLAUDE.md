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
