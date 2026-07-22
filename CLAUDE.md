# Claude Working Instructions

## Communication style
Explanations to the user should be to the point and in plain language — no jargon, no unnecessary preamble.

## Project Rules
- Always create a `-previous` backup of files before making changes
- Never delete files without explicit user confirmation
- Never push to remote without explicit user confirmation
- Do not add Co-Authored-By tags to git commits

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
- `origin` → `ForgedDigital/christ-church-bluffton` (live site + test via Forged Digital)

## Breakpoint / Responsive Testing Protocol
- Do NOT resize the actual browser window to test breakpoints — `resize_window` is unreliable in this environment (can silently fail, get stuck at a stale size, or apply an inconsistent scaling factor) and it visibly disrupts the user's real browser window, which should never be touched for this.
- Instead: inject a same-origin `<iframe>` into the currently open page via the browser automation JS execution tool, set its `width` to the exact target breakpoint (e.g. 375 / 768 / 1024 / 1440, plus just above and just below any breakpoint defined in the site's own CSS media queries), then screenshot/inspect it.
- Force-refresh CSS/JS inside the iframe before checking anything: `fetch(url, {cache:'no-store'})` the stylesheet/script and swap the `<link>`/`<script>` tag with the fresh content. Local dev servers can keep serving a stale cached copy to a same-tab iframe even with no-cache response headers — always verify a fix is actually live before concluding it doesn't work.
- Prefer `getComputedStyle()` checks (grid-template-columns, height, padding, etc.) over eyeballing screenshots alone — screenshots can render at a scaled resolution that doesn't map 1:1 to real CSS pixels on this machine, which is misleading when judging pixel-level layout.
- Give `<img>` tags explicit `width`/`height` attributes matching their real dimensions — without them, a box with `loading="lazy"` and no other height hint can collapse to 0px and never trigger the lazy-load in the first place.
- Remove the injected test iframe when the check is done.
