# GitHub connection for the Content Editor's Publish button (temp link only)

## STATUS as of 2026-09-28 — RESUME HERE
Done: GitHub App "CCB Content Publisher" created (App ID **5115401**), installed on just `ForgedDigital/christ-church-bluffton` (Installation ID **165972973**). `GITHUB_APP_ID` and `GITHUB_APP_INSTALLATION_ID` are already added to the temp Netlify site's environment variables.

⚠️ **The first private key got pasted into chat by accident, so it was deleted and a new one generated.** The new `.pem` file is already in Kevin's Downloads folder.

**Next step (Kevin, standing by):** open that `.pem` in Notepad, copy all of it, and paste it directly into the `GITHUB_APP_PRIVATE_KEY` box already set up on the Netlify page (Production, Deploy Previews, and Branch deploys fields), then click Create variable. Paste it into Netlify only — never into chat.

**After that (Claude, each step needs Kevin's OK):**
1. ✅ Confirm all 3 variables are saved on the temp Netlify site — DONE 9/29.
2. Commit + push the editor work to the temp link (`origin`).
3. Test Publish for real on the temp site (one small edit → Publish → check the temp site; try "Use Original Photo").
4. `git pull origin main` before the next local commit/push — Publish commits land on `origin/main` from the server.

**Kevin confirmed 9/29: yes, he wants live Publish too eventually ("of course i want that").** Not started — comes AFTER the temp link is proven out above. When ready: same GitHub App setup but on the CHURCH's GitHub (needs Jonathan, not Kevin, to create/install it on `ChristChurchBuffton/christchurchbluffton`), its key added to Jonathan's Netlify site, and Claude deliberately widening two safeguards (the editor's `EDITING_ENABLED` host allowlist in `content.html`, and `publish-content.js`'s live-domain refusal). Don't start this until Kevin explicitly says go.


**Why:** the Publish button runs inside the website, so it needs its own permission to save changes into Forged's GitHub. It gets a small "GitHub App" limited to ONE repo: `ForgedDigital/christ-church-bluffton` (the temp/staging repo). The church's GitHub and the live site are never touched.

## Part 1 — create the app in GitHub (sign in as the owner of Forged's account)
1. Open the new-app page:
   - if `ForgedDigital` is an organization: https://github.com/organizations/ForgedDigital/settings/apps/new
   - if it's a personal account: https://github.com/settings/apps/new
2. Fill in the form:
   - **GitHub App name:** `CCB Content Publisher` (add a word if taken)
   - **Homepage URL:** `https://forgeddigitaldesign.com` (anything works)
   - **Webhook:** untick "Active"
   - **Repository permissions → Contents:** **Read and write** (nothing else)
   - **Where can this app be installed:** "Only on this account"
3. Click **Create GitHub App**.
4. Write down the **App ID** (a number near the top of the app's page).
5. Scroll to **Private keys** → **Generate a private key**. A `.pem` file downloads — that's the key; treat it like a password.
6. Left menu → **Install App** → Install → **Only select repositories** → `christ-church-bluffton` → Install.
7. The address after installing ends in a number, like `.../installations/12345678` — that's the **Installation ID**.

## Part 2 — put it in the TEMP Netlify site only (Forged's Netlify, site `christchurch-bluffton`; NEVER Jonathan's)
Site configuration → Environment variables → add three:
- `GITHUB_APP_ID` = the App ID
- `GITHUB_APP_INSTALLATION_ID` = the Installation ID
- `GITHUB_APP_PRIVATE_KEY` = open the `.pem` in Notepad, paste EVERYTHING including the BEGIN/END lines

The variables only take effect on the next deploy (the push below covers it). Delete the `.pem` from Downloads afterwards (or keep it in the password manager). Don't paste the key into chat — App ID and Installation ID are not secret.

## Then (Claude does these, each with Kevin's OK)
1. Commit + push everything for the editor to the temp link (`origin`).
2. Test Publish for real on the temp site (one small edit → Publish → check the temp site; try "Use Original Photo").
3. `git pull origin main` before the next local commit/push — Publish commits land on `origin/main` from the server.
4. Live is a separate, later decision: it would need the same app on the CHURCH's GitHub (Jonathan) + its Netlify, and deliberately loosening two safeguards (the editor's host switch and Publish's live-domain refusal).
