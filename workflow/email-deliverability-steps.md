# Christ Church Bluffton — Email Deliverability Fix

## DNS Provider: GoDaddy
## Domain: christchurchbluffton.org
## Hosting: Netlify
## CRM: Tithely (uses SendGrid for email sending)
## Email: Google Workspace (info@christchurchbluffton.org)

---

## Issue 1: Display Name (Quick Fix)
Emails show personal name instead of "Christ Church Bluffton."

### Steps:
1. Log into Tithely as `info@christchurchbluffton.org`
2. Click person icon (bottom right) → **Global Settings**
3. Go to **My Account**
4. Change First Name to "Christ Church", Last Name to "Bluffton"
5. Save

---

## Issue 2: Email Deliverability / Spam (DNS Setup)
Emails sent from Tithely on behalf of info@ are landing in spam or bouncing.

### DNS Status (Updated 2026-03-19):
- **SPF**: DONE — `v=spf1 include:_spf.google.com include:amazonses.com include:sendgrid.net ~all`
- **DKIM (Google)**: DONE — `google._domainkey` TXT record exists
- **DKIM (Resend)**: DONE — `resend._domainkey` TXT record exists
- **DKIM (SendGrid)**: NOT AVAILABLE — Tithely confirmed they do not support DKIM signing (2026-03-19)
- **DMARC**: DONE — Changed from `p=quarantine` to `p=none` (2026-03-19) to allow Tithely emails through

### Resolution (2026-03-19):
- Tithely (Tori) confirmed DKIM is not supported on their platform
- DMARC relaxed from `p=quarantine` to `p=none` in GoDaddy DNS
- SPF still passes (SendGrid is included), so emails are partially authenticated
- Team notified of the change and the reasoning
- Propagation: up to 48 hours, usually a few hours
- TODO: Test that Tithely emails stop going to spam after propagation

---

## Issue 3: Google Workspace Sending Limits (2026-03-19)
Team member tried to send mass email via Apple Mail using `smtp.gmail.com` and hit Google's recipient limits.

### Google Workspace Limits:
- **Per message**: max 100 recipients (BCC) at a time
- **Per day**: 2,000 recipients (Google Workspace paid), 500 (free Gmail)
- This applies regardless of which email client is used (Apple Mail, Outlook, etc.) — the limit is on Google's SMTP server

### Solutions:
- **Small lists**: Break recipients into batches of 50-100 and send multiple times
- **Large lists**: Use a mass email tool (Tithely Messaging, Mailchimp, Sender.net free tier)
- Gmail/Google Workspace is NOT designed for bulk email blasts

### Status: TODO — come back to this

---

## Notes:
- There is a separate `send` subdomain with its own SPF for Amazon SES
- MX records point to Google (aspmx.l.google.com) — Google Workspace handles incoming mail
- DMARC is now `p=none` — less strict but necessary for Tithely compatibility
- Tithely does not support DKIM — this is a platform limitation, not a DNS issue
