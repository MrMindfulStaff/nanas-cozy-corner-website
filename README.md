# Nana’s Cozy Corner public website

Static, mobile-first childcare website with an isolated website inquiry function.
No internal operations application is called or changed by this website.

## Develop

Node 24; no third-party build dependencies.

```
npm run build
npm test
npm run dev
```

Edit shared templates and page content in `scripts/build.mjs`; generated root HTML
preserves existing URLs. Edit `styles.css` and `script.js` directly. The build
copies only the public website into `public/` for Vercel. Internal project docs,
tests, and source instructions are not static web pages.

## Inquiry delivery — activation required

The original website forms logged data to the visitor’s browser, cleared the
form, and reported success without any delivery. That behavior has been removed.

Until delivery is configured, the forms explicitly prepare an email for the
parent to review and send. They also offer direct phone and email links. No
receipt is claimed, and no inquiry is silently discarded.

To enable direct submission, configure the WEBSITE project only:

- `RESEND_API_KEY`: website-specific, sending-only credential.
- `INQUIRY_FROM`: sender on a verified Resend domain.
- `INQUIRY_TO`: center’s staffed inbox (defaults to Info@nanascozycorner.com).
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: widget for approved hostnames.
- `INQUIRY_ALLOWED_HOSTS`: exact comma-separated hostnames. For preview testing,
  scope a separate configuration and approved test recipient to that branch.

Do not paste secrets into repository files or browser code. Do not reuse internal
application secrets. Do not enable paid services or send campaigns automatically.

`GET /api/inquiries` exposes only readiness and the public site key.
`POST /api/inquiries` validates a small allowlist of fields, same-origin requests,
server-validated Turnstile action/hostname, and idempotent email delivery.
It accepts no user-controlled recipients and logs no contact/child form values.
202 means the provider accepted the email, not that staff read it or a tour was
booked. Delivery failures retain form data and offer email/call alternatives.

Before marking delivery complete, use a clearly labeled, authorized test request,
confirm the email arrives in the staffed inbox, and test the failure state.
Configure provider delivery/bounce monitoring and identify the staff follow-up
owner. This build does not create a database of inquiries or send parent receipts.

## Search and measurement

Canonical host: `https://www.nanascozycorner.com`. The bare domain and `/index.html`
redirect permanently; existing `.html` URLs are preserved. Page metadata,
ChildCare business markup, robots.txt, and sitemap.xml are generated at build.
Hours: Monday–Friday, 06:00–18:00. Enrollment marketing focus: ages 0–3.
The minimum starting age, openings, tuition, and exact transport coverage remain
operational confirmations; no vacancy counts, guarantees, or fake reviews appear.

No analytics account or measurement ID was found in the original site. No paid
tracking or marketing service has been activated. `nana:interaction` events are
available to a future approved analytics listener and contain only event name,
form kind, and page path. They do not store data by themselves. Configure and
verify event recording before reporting conversion rates.

Retain separate measures for call clicks, form starts, email drafts/opened email
apps, provider-accepted inquiries, confirmed tours, attended tours, and actual
enrollments. Never count a draft or click as an accepted inquiry.

## Content follow-up

Replace existing brand artwork with consented real infant/toddler classroom and
staff photos when available. Existing artwork is labeled as brand artwork in
image alternative text; it is not presented as proof of actual staff/rooms.
Confirm the 4006 parent arrival address before standardizing external listings;
the external EHS listing previously used 4008. Review referral program terms
with the owner before running a referral campaign.


## Tours and leads bridge
Production WEBSITE_INTAKE_SECRET must match the dedicated secret on Nana’s Brain. All direct submissions save there before success. Ms. Kelly still receives notifications via INQUIRY_TO. Tour slots are explicitly published by authorized staff in /tours-leads; no operating-hour slots are auto-created. Tours require email and phone. Bookings are durable even if email fails, with manual retry in Nana’s Brain. Email ACCEPTED means provider accepted, not inbox delivered.
