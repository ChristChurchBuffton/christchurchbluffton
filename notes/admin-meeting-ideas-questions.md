# Admin Meeting — Ideas & Questions

For Wednesday's meeting (2026-09-02).

## Ideas
1. Connect events to update live on the webpage — add an event in the admin portal, it shows up on the public site automatically, no separate deploy step.
2. Build a full Youth page — plus a Youth Group section inside the admin portal to track parent/student info (roster, contact info), not just a public-facing page. Need him to define what info it should actually track before we scope this.
3. Link up the Newsletter composer to actually send emails (Resend) — currently drafts only, Send button is disabled/not connected.
4. Bring the site's typography in line with the brand guide's 3-font system — checked directly against the live CSS, here's what's actually in use vs. the brand guide (`assets/branding/Christ Church Bluffton Brand.pdf`), plus verified 2026-09-02 that the site's code has zero trace of ACaslon Pro or any Adobe Fonts embed anywhere — confirmed not in use today:
   - **ACaslon Pro** (headings, brand guide) — NOT on the site at all
   - **Lora** (brand guide's secondary/body serif) — currently the ONLY font in use sitewide, doing all 3 roles
   - **Inter** (body text, brand guide) — NOT on the site at all
   - Note: ACaslon Pro is a paid Adobe font, not free like Lora/Inter — it can only be used on a live site via Adobe's own embed code (loads live from Adobe's servers), not a downloadable font file. The brand guide PDF itself was built in Adobe InDesign (per its file metadata, created 2026-08-28) — meaning whoever made it already has a real Adobe Creative Cloud account, which is exactly the kind of account that could already include Adobe Fonts access.
   - **Questions to ask Jonathan, in order:**
     1. Do they actually want ACaslon Pro live on the website, or was it only ever meant for print/brand materials?
     2. Who made this brand guide — is that person/agency still involved, and do they already have Adobe Fonts access we could use?
     3. If yes: can they set up the web embed and hand us the code, rather than starting a new subscription from scratch?
     4. If no one has it: whose Adobe account should host it going forward — the church's own is safer long-term than ours, so the site doesn't lose the font if the agency relationship ever changes.
5. New ministry team idea: Home Visitation / Pastoral Care, similar in spirit to the existing Prayer Teams ministry — nothing scoped yet, just raising it again.

## Questions

**Website**
1. Does Privacy/Terms need real legal review before we expand data collection?
2. There's no phone number listed anywhere on the site (header, footer, or Contact page) — is that intentional, or is there a number we should add?
3. Has the legal name filing (dropping "Anglican") gone through with the state yet? Terms/Privacy still just say "Christ Church Bluffton" with no legal suffix since there's no official new name to use yet — remind him to send it over once it's filed.
4. Footer Facebook/Instagram links have said "Coming Soon" for about 2.5 weeks now — are real accounts coming, or should those rows come down for now?

**Admin Panel**
1. Who should have access to the admin portal, and what should each person be able to see/do — how do you want it structured and navigated?

## Service pricing — what upgrading would cost (checked 2026-08-31, read-only, no changes made)
Relevant to Idea #3 (Newsletter send-button) — actually turning on email sending will push volume through Resend.

**Resend (email)** — own dedicated account. Two separate products, priced and capped differently:

*Transactional* (the small stuff already live today — contact form, prayer request, newsletter-signup confirmation emails):
| Plan | Price | Emails/mo | Daily cap |
|---|---|---|---|
| Free (current) | $0/mo | 3,000 | 100/day |
| Pro | $20/mo | 50,000 (+$0.90/1,000 after) | none |

Current usage: 30/3,000 this month — barely used, nowhere near the cap.

*Marketing / Broadcasts* (the actual newsletter "Send" feature — priced by contact count, NOT by how many emails go out; confirmed via Resend's docs: no send-volume cap at any tier):
| Plan | Price | Contacts | Send cap |
|---|---|---|---|
| Free | $0/mo | 1,000 | none |
| Pro Marketing | $40/mo | 5,000 (+open/click analytics) | none |

**Real-world usage check**: Judy sends the church's actual weekly newsletter herself, manually, to about **440 people a week**. That's comfortably under the 1,000-contact Free cap, and since Broadcasts have no send-volume limit at any tier, sending to all 440 at once isn't a problem either. **Correction from earlier in this doc**: free genuinely does cover Judy's real usage — no upgrade needed just to turn the newsletter feature on. Only reasons to move to Pro Marketing later: the subscriber list growing past 1,000 people, or wanting real open/click tracking.

**Netlify (hosting)** — already one tier above free: Personal plan, $9/mo (not Free)
- Free: $0 — custom domain+SSL, unlimited preview links, serverless functions
- Personal (current, $9/mo): + secret-leak scanning, 1-day analytics, priority support, 1,000 usage credits/mo
- Current usage: 54/1,000 credits used this billing period — lots of headroom
- Next tier (Pro): $20/mo — unlimited team seats, private repos, 3+ simultaneous builds, 30-day analytics, bigger credit pool
- Triggers an upgrade: burning through 1,000 credits/mo, needing more than one build running at a time, or adding more people to the Netlify team

**Sanity** — not actually part of this project (CCB's admin panel runs on Supabase, not Sanity) — general reference only, not a real cost risk here.
