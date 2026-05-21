# AGENTS.md

## Project: Nana’s Cozy Corner Website

Build the public marketing and enrollment website for Nana’s Cozy Corner, a licensed childcare center in Milwaukee, WI.

Do not rebuild Nana’s Brain.

Nana’s Brain is the future internal center-management system. This website should be designed to connect to Nana’s Brain later through forms, APIs, and shared enrollment workflows.

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

## Primary Calls to Action

Use these across the site:

- Enroll Now
- Check EHS Eligibility
- Schedule a Tour
- Join Waitlist
- Refer a Family

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

## Brand Direction

The site should feel:

- warm
- safe
- cozy
- modern
- family-centered
- premium but approachable
- trusted by parents
- ready for community partnerships

Avoid:
- generic daycare clipart
- chaotic colors
- overly childish visuals
- cluttered sections
- weak calls to action

Preferred visual direction:
- cream backgrounds
- warm caramel/gold accents
- soft greens or browns
- rounded cards
- clean typography
- real-family warmth
- strong mobile layout

## Homepage Flow

Build the homepage in this order:

1. Hero section  
   Headline: A Safe, Loving Start for Your Child’s Future  
   CTAs: Enroll Now, Check EHS Eligibility, Schedule a Tour

2. Trust section  
   Highlight licensed care, experienced educators, family-centered environment, EHS alignment

3. Programs by age  
   Infant, toddler, preschool/early learners, before/after school if applicable

4. How enrollment works  
   Step 1: Submit interest form  
   Step 2: We contact you  
   Step 3: Tour + eligibility review  
   Step 4: Start care

5. Early Head Start section  
   Explain no-cost support for eligible families with children ages 0–3 and expectant families

6. About Nana  
   Emphasize legacy, family, education, warmth, and 70+ years combined experience

7. Parent testimonials placeholder

8. Final CTA  
   Ready to give your child a strong start?

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

Do not create unnecessary complexity.

Do not rebuild or modify Nana’s Brain unless specifically requested.
