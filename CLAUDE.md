# Claude Working Instructions

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
