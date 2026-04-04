# Christ Church Bluffton — Client Communications

## Client Info
- **Name**: Rev. Jonathan Riddle
- **Role**: Pastor / Church Planter
- **Project**: Christ Church Bluffton (Anglican church plant, Bluffton SC)
- **Billing**: Donation (free build)

---

## Communication Log

### 2026-02-17
- **Status**: Rough draft complete. Site sent to client for review.
- **Waiting on**: Real photos, phone number, street address, email verification, pastor bio/quote, ACNA membership verification, domain decision.
- **Tithe.ly**: Kevin set up as admin. Giving feature blocked — "Invalid organization ID" error. Owner (Jonathan) completed org setup but Giving still not loading. Possible backend provisioning delay. Revisit next day. Email sent to Jonathan earlier re: org setup.
- **Google Workspace**: Applied for Google Nonprofit. Waiting to hear back.
- **Donation landing page**: Church wants a standalone giving page live BEFORE the full website launches. Domain TBD — may use the actual URL or a separate one. On standby until decision is made.
- **Notes**: No response yet on site content review.

---

### 2026-02-20 — Website Forms & Tithe.ly Overview

**Subject:** Website Forms — How They Work & Tithe.ly Integration

Hi team,

This is additional information regarding the website contact forms. This is especially useful for anyone who will be managing the administration side of Tithe.ly and contacts.

**Overview**

The website has three forms: Contact, Prayer Request, and Stay Updated. Each form sends data to two places:

1. **Tithe.ly** — Populates under the People tab automatically
2. **Email** — Sends a notification to a designated email address (currently going to admin@christchurchbluffton.org)

Having both routes is intentional — servers skip a beat sometimes, so having a backup ensures nothing gets missed.

**Contact Form**

- Required fields: Full Name, Email, Interest (as shown on the temporary site link)
- Name, email, and phone auto-populate in Tithe.ly under People
- An email notification is sent with all submitted info including the contact message and reason for reaching out — Tithe.ly's system does not display that information, so the email is the only place to see it

**Prayer Request**

- When someone submits a prayer request, it also comes into Tithe.ly (we can remove this if preferred)
- If a name is entered, it generates under People in Tithe.ly
- If no name is entered, it comes in as "Anonymous" in both the email and Tithe.ly
- The prayer text itself is only sent via email — I'd recommend setting up a dedicated address like prayers@christchurchbluffton.org down the road, but we can handle that later

**Stay Updated (Footer)**

- A simple email-only signup for users who want to receive church updates without sharing their name or other info
- Once email communications begin going out, I'd recommend adding a note that if recipients no longer wish to receive emails, they can reply requesting to be removed

**Tithe.ly Saved Filters**

Each form submission automatically tags the person in Tithe.ly — "Contact Form," "Prayer Request," or "Stay Updated." I've created saved filters for each tag under the People tab (left column > Saved Filters) so you can quickly view submissions by type. I've left the test submissions in Tithe.ly for now so those who will be working with it can use the saved filters and see how entries come in.

**Family Setup**

I've added my family in Tithe.ly so Judy or whoever will be managing it can start exploring the family features and get familiar with the system.

**Next Steps**

Once Google Workspace is fully set up and email addresses are generated, we'll configure the notification routing properly. While you can't catch them all, I will add spam protection measures — including CAPTCHA and honeypot fields — to all forms before they go live. These won't eliminate every spam submission, but they'll filter out the vast majority of bots and junk entries.

Note: All Resend and Netlify environment variable configurations will need to be repeated on the production URL before going live.

Kevin

---

### 2026-03-19 — Email to Tithely (Tori) re: DKIM Resolution

> Subject: Re: DKIM / Email Deliverability
>
> Hi Tori,
>
> Thank you for looking into this and for the transparency. We understand that DKIM signing isn't currently supported on your end.
>
> We'll adjust our DMARC policy on our domain side to accommodate this. That should resolve the deliverability issues we've been seeing. We'll keep the SPF record as-is since that's already passing.
>
> We did consider the Alternate Sending option, but since our congregation and community are just getting to know us, it's important that emails come from our church domain rather than a third-party address. Building that name recognition early on really matters for a new church plant.
>
> I do want to mention that relaxing our DMARC policy does reduce our domain's email security posture slightly — it means we lose the ability to quarantine unauthenticated messages sent on behalf of our domain. It's a workable solution for now, but we'd love to see DKIM support added to the platform down the road. It would be a great step for churches and organizations that want to maintain strong email authentication while using Tithely's services.
>
> We appreciate everything your team does. Thank you for walking through this with us.
>
> Kevin

---

### 2026-03-19 — Email to Church Team re: Email Deliverability Fix

> Good morning,
>
> I'm sure you've seen some of the emails I'm sending to Tithely so here it is in plain language:
>
> The issue: When setting up our domain, I implemented a security setting (DMARC) that quarantines emails that aren't fully authenticated. Tithely doesn't support DKIM, a standard authentication method most email platforms offer, so their emails sent on our behalf get flagged.
>
> The fix: I'm relaxing our DMARC policy so those emails deliver normally. SPF authentication is still in place, so emails are still verified — just with a slightly more flexible policy. No action needed on your end.
>
> Any risk? Technically, this makes it slightly easier for someone to spoof (send a fake email pretending to be from our domain—usually used for phishing scams)—but that's usually a concern for large corporations, not a church plant. The benefit of emails actually reaching inboxes far outweighs it. I personally like to keep things secure from the get-go, but this will suffice for now.
>
> I just made the backend change. It can take up to 48 hours for things to propagate, but it usually takes a few hours.
>
> Let me know if you have questions and how testing goes.
>
> Kevin

---

## Client Feedback
> Record client responses, change requests, and approvals here.

*(none yet)*

---

## Decisions Made
> Record agreed-upon decisions so they don't get lost.

- Color scheme changed from navy blue to forest green/muted gold (client approved)
- Anglican Diocese of SC logo removed from all pages (may add back if asked)
- Hero badge ("tradition") removed, title renamed to Christ Church Bluffton

---

## Content Received
> Track what the client has provided.

- [ ] Photos (about, worship, groups, pastor headshot, leadership)
- [ ] Phone number
- [ ] Street address
- [ ] Email addresses confirmed
- [ ] Pastor bio (written by client)
- [ ] Pastor quote
- [ ] ACNA membership confirmed
- [ ] Domain choice
