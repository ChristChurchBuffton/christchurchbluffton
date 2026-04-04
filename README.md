# Christ Church Bluffton

## Overview
Website for Christ Church Bluffton, an Anglican church plant in Bluffton, SC. Led by Rev. Jonathan Riddle. This is a donation project (free build).

## Tech Stack
- HTML / CSS / JavaScript (static, no framework)
- Hosting: Netlify
- Serverless Functions: Netlify Functions (contact form, prayer requests, newsletter signup)
- Email: Resend
- CRM: Breeze ChMS (contact form submissions auto-add to Breeze)
- CAPTCHA: Cloudflare Turnstile
- Domain: christchurchbluffton.org (GoDaddy)
- DNS/Email: Google Workspace

## How to Run Locally
1. Navigate to the project folder
2. Run `npx http-server ./src -p 3001`
3. Open `http://localhost:3001` in your browser

For serverless function testing, use the local dev server:
1. `cd server/`
2. `npm install`
3. Add `.env` with required keys
4. `node server.js`

## Folder Structure
```
src/              — Deployable site code (Netlify publish dir)
reference/        — Original site build (content/design reference only)
assets/           — Logos, business info, flyers
workflow/         — Project workflows and dev notes
comm/             — Client and internal communications
decisions/        — Architecture and design decisions
notes/            — Scratch notes
archive/          — Old/deprecated files
server/           — Local dev server for function testing
```

## Deployment
- Hosted on Netlify
- Auto-deploys from `main` branch on GitHub (`ForgedDigital/christ-church-bluffton`)
- `netlify.toml` publishes from `src/`

## Project Status
- Current phase: Waiting on Client
- Rough draft complete. Waiting on real photos, contact info, and content review from client.

## Key Contacts
- Client: Rev. Jonathan Riddle — jonathan@christchurchbluffton.org
- Developer: Kevin — kevin@forgeddigitaldesign.com
