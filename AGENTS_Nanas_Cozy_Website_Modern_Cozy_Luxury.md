# AGENTS.md

## Project: Nana’s Cozy Corner Website

Build the public marketing and enrollment website for Nana’s Cozy Corner, a licensed childcare center in Milwaukee, WI.

Do not rebuild Nana’s Brain.

Nana’s Brain is the future internal center-management system. This website should be designed to connect to Nana’s Brain later through forms, APIs, and shared enrollment workflows.

---

## Selected Brand Direction

Use the first logo direction: **Modern Cozy Luxury**.

The website should be designed around a warm, premium childcare brand that feels:

- safe
- cozy
- modern
- trusted
- family-centered
- educational
- polished
- community-rooted
- premium but approachable

The brand should not feel like a generic daycare template. It should feel like a high-trust early childhood education center with warmth, legacy, and professionalism.

---

## Visual Style

Use the following design direction:

### Color Palette

Primary:
- warm cream background
- soft caramel / gold accents
- cocoa brown text
- muted sage green support color

Suggested colors:
- Cream: #FFF8ED
- Warm Ivory: #FAEBD7
- Caramel Gold: #C9954E
- Cocoa Brown: #4A3327
- Soft Sage: #8A9A6B
- Deep Espresso: #2B1D17

### Typography

Use a refined pairing:
- elegant serif or soft display font for headings
- clean sans-serif for body text

The typography should feel warm, professional, and easy to read.

### Shape + Layout

Use:
- rounded cards
- soft shadows
- spacious sections
- warm image treatments
- calm transitions
- mobile-first layout
- large readable buttons
- clear parent pathways

Avoid:
- generic ABC blocks
- clipart children
- chaotic colors
- hard corporate styling
- overly childish graphics
- cluttered page sections

---

## Website Goal

The website should:
- build parent trust
- increase enrollment inquiries
- explain programs clearly
- promote Early Head Start eligibility
- simplify tour requests
- capture waitlist/enrollment interest
- support referral traffic
- feel warm, safe, modern, and professional

The website is the public front door.
Nana’s Brain is the future internal operating system.

---

## Core Pages

Build or structure toward:

- Home
- About
- Programs
- Early Head Start
- Enrollment
- Schedule a Tour
- Referral Program
- Contact

---

## Primary Calls to Action

Use these across the site:

- Enroll Now
- Check EHS Eligibility
- Schedule a Tour
- Join Waitlist
- Refer a Family

Primary CTAs should feel warm and clear, using caramel/gold styling with strong contrast.

---

## Future Nana’s Brain Connection

For now, forms can submit normally or use placeholder handlers.

But structure form data so it can later be sent to Nana’s Brain.

Important future API endpoints:

- POST /api/leads
- POST /api/tour-requests
- POST /api/ehs-screenings
- POST /api/referrals
- POST /api/contact

Do not build the full backend unless specifically requested.

---

## Lead Pipeline Compatibility

Design forms so future submissions can map into Nana’s Brain statuses:

1. New Inquiry
2. Contacted
3. Tour Scheduled
4. Tour Completed
5. Application Started
6. EHS Review
7. Documents Needed
8. Approved
9. Enrolled
10. Waitlisted
11. Lost / Not Eligible

---

## Form Data to Capture

### Enrollment Interest

- parent name
- phone
- email
- child name
- child date of birth
- desired start date
- program/age group
- preferred contact method
- message

### EHS Pre-Screen

- parent name
- phone
- email
- child age or expected due date
- ZIP code
- SNAP/TANF/SSI status
- foster/kinship status
- housing status
- income eligibility interest
- preferred contact method

### Tour Request

- parent name
- phone
- email
- preferred tour date
- preferred time
- child age
- notes

### Referral Form

- referrer name
- referrer type
- referrer phone/email
- referred parent name
- referred parent phone/email
- child age
- EHS eligible maybe/yes/no
- notes

---

## Homepage Flow

Build the homepage in this order:

### 1. Hero Section

Headline:
A Safe, Loving Start for Your Child’s Future

Subheadline:
Quality early childhood education and care for Milwaukee families in a warm, trusted, family-centered environment.

Primary CTAs:
- Enroll Now
- Check EHS Eligibility
- Schedule a Tour

The hero should feel emotional and premium. Use warm imagery, cozy spacing, and the selected logo direction.

### 2. Trust Section

Highlight:
- licensed childcare
- experienced educators
- family-centered care
- Early Head Start alignment
- safe and nurturing environment
- strong parent communication

### 3. Programs by Age

Use clean cards for:

- Infants
- Toddlers
- Early Learners
- Before/After School, if applicable

Each card should include:
- age range
- care focus
- simple CTA

### 4. How Enrollment Works

Show a simple four-step process:

1. Submit interest form
2. We contact you
3. Tour + eligibility review
4. Start care

This should reduce parent confusion and make enrollment feel easy.

### 5. Early Head Start Section

Explain that eligible families may receive no-cost support for children ages 0–3 and expectant families.

Include CTA:
Check EHS Eligibility

### 6. About Nana

Emphasize:
- family legacy
- deep passion for early education
- 70+ years combined experience
- owner’s Master’s degree
- 25 years of direct childcare experience
- belief that early positive influence changes a child’s future

Tone should feel real, warm, and personal — not corporate.

### 7. Parent Testimonials Placeholder

Create testimonial cards that can be replaced with real reviews later.

### 8. Final CTA

Headline:
Ready to Give Your Child a Strong Start?

Buttons:
- Enroll Now
- Schedule a Tour

---

## Referral Program Page

Build a referral page around the Cozy Circle Referral Program.

Core message:
You earn when they stay.

Include:
- $750 referral bonus
- paid after 60 consecutive days of enrollment
- referrer types: current parent, staff member, approved community partner
- Early Head Start eligible referrals may qualify for a bonus boost after eligibility confirmation
- referral form

Keep language simple and parent-friendly.

---

## Early Head Start Page

The EHS page should clearly explain:

- who can apply
- children ages 0–3
- expectant families
- income eligibility
- SNAP/TANF/SSI indicators
- foster/kinship/housing status
- health, dental, vision, hearing, and developmental support
- family engagement
- no-cost support for eligible families

Make the page feel supportive, not bureaucratic.

---

## Coding Rules

Use clean, maintainable code.

Prioritize:
- mobile-first design
- accessible forms
- reusable components
- clean routing
- TypeScript where applicable
- future API compatibility
- clear file organization
- readable components
- good empty states
- clear form validation
- success/error feedback

Do not create unnecessary complexity.

Do not rebuild or modify Nana’s Brain unless specifically requested.

---

## Done Means

A feature is done when:

- it works on desktop and mobile
- forms validate properly
- user receives clear success/error feedback
- data structure is ready for future Nana’s Brain connection
- page is easy for a parent to understand
- page is easy for a non-technical childcare worker to explain
- design matches the Modern Cozy Luxury logo direction
