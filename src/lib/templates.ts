/**
 * Starter templates.
 *
 * These are real examples of the kind of unstructured text the extraction
 * pipeline is built to handle. Each one deliberately mixes completed work,
 * pending work, and blockers, because that mix is what makes a note worth
 * turning into a board.
 *
 * Text is plain. No em dashes, no en dashes, and no semicolons anywhere, so the
 * whole board stays readable and consistent with the rest of the product.
 */

export interface BoardTemplate {
  id: string;
  label: string;
  /** One line describing what this template is for. */
  blurb: string;
  build: () => string;
}

const today = (): string =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'standup',
    label: 'Daily Standup',
    blurb: 'Yesterday, today, and blockers',
    build: () => `# Daily Standup, ${today()}

## Yesterday
- Finished the API integration for user authentication
- Reviewed PR 42 and left comments
- Fixed the payment flow bug reported in production

## Today
- Build the dashboard analytics charts
- Write unit tests for the auth module
- Sync with the design team on the new UI mockups
- Deploy the staging build

## Blockers
- Waiting on the backend team for the API documentation
- Need design approval before starting the new feature`,
  },
  {
    id: 'sprint',
    label: 'Sprint Planning',
    blurb: 'A sprint goal with a full backlog',
    build: () => `# Sprint Planning, Sprint 14

## Sprint Goal
Ship the user onboarding flow and fix the critical billing bugs.

## Backlog Items
- Build the onboarding wizard in 3 steps: profile, preferences, first board
- Fix the Stripe webhook that does not fire on subscription renewal
- Add an email verification resend button
- Improve mobile responsiveness across the dashboard
- Write API documentation for the version 2 endpoints
- Set up error monitoring with Sentry
- Run a performance audit and lazy load the heavy components
- Add CSV export for board data`,
  },
  {
    id: 'client',
    label: 'Client Project',
    blurb: 'A phased project plan with deliverables',
    build: () => `# Client Project, Website Redesign

## Discovery Phase
- Conduct stakeholder interviews with the CEO, Marketing, and Sales leads
- Audit the existing site for performance, SEO, and conversion rates
- Review 5 competitor sites
- Define the target audience personas

## Design Phase
- Create wireframes for the homepage and key landing pages
- Design the component library in Figma
- Get client approval on the design direction
- Build an interactive prototype for user testing

## Development Phase
- Set up the Next.js project with a CMS integration
- Implement a responsive design across all breakpoints
- Integrate analytics and heatmap tracking
- Run QA across browsers and devices
- Hold the client review and feedback round
- Complete the final launch and hand off`,
  },
  {
    id: 'content',
    label: 'Content Calendar',
    blurb: 'A month of marketing deliverables',
    build: () => `# Content Calendar, Q1 Campaign

## Blog Posts
- Write "10 productivity hacks for remote teams" due Friday
- Draft the case study on how Acme Corp saved 20 hours a week
- Update the SEO meta tags for the top 5 landing pages
- Research keywords for the new product category

## Social Media
- Create 3 LinkedIn posts about the product launch
- Design 5 Instagram carousel graphics
- Schedule a Twitter thread on industry trends
- Respond to all comments from last week's posts

## Email
- Write the monthly newsletter for 500 subscribers
- Set up a drip campaign for new signups across 5 emails
- Run an A and B test on subject lines for the re-engagement campaign

## Video
- Record a 5 minute product demo walkthrough
- Edit and caption the YouTube tutorial`,
  },
  {
    id: 'bugs',
    label: 'Bug Tracker',
    blurb: 'Issues grouped by severity',
    build: () => `# Bug Tracker, Release v2.4

## Critical, P0
- The app crashes on iOS 17 when opening notifications
- Payment fails silently when a card is declined and no error is shown
- Data loss: the board state is not saved after a browser refresh

## High Priority, P1
- Login with Google fails for users who have 2FA enabled
- The dashboard charts show the wrong date range on first load
- File upload hangs at 99 percent for files over 10MB

## Medium Priority, P2
- The dark mode toggle resets on page navigation
- Search results do not update when filters change
- Email notifications are sent twice for the same event
- A tooltip overlaps a button on small mobile screens

## Low Priority, P3
- Typo in the onboarding step 2 copy
- Footer links open in the same tab instead of a new one`,
  },
  {
    id: 'meeting',
    label: 'Meeting Notes',
    blurb: 'Decisions, action items, and open questions',
    build: () => `# Meeting Notes, Product Review
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Attendees: Product, Engineering, Design, Marketing

## Decisions Made
- The launch date is confirmed for March 15th
- Drop feature X from the version 1 scope and move it to version 1.1
- Keep the free tier at 10 uses per day

## Action Items
- PM: update the roadmap and share it with stakeholders by end of day
- Engineering: finalise the API contracts and share the docs
- Design: deliver the final assets to development by Wednesday
- Marketing: prepare the launch announcement email draft
- All: review and sign off on the QA checklist before Thursday

## Open Questions
- Do we need legal review for the new data retention policy?
- Who owns customer support during launch week?`,
  },
  {
    id: 'inbox',
    label: 'Inbox Triage',
    blurb: 'A quick sweep of an overloaded inbox',
    build: () => `# Inbox Triage, ${today()}

## Reply Today
- Answer the Acme Corp proposal questions before their 4pm deadline
- Send the revised quote to Brightline, they asked twice
- Confirm the venue booking for the offsite

## Schedule
- Book the 30 minute design review with Priya
- Set up the 45 minute onboarding call for the new engineer

## Read Later
- Skim the competitor pricing update
- Read the article on async standups
- Review the quarterly roadmap draft`,
  },
  {
    id: 'launch',
    label: 'Product Launch',
    blurb: 'A countdown to a release',
    build: () => `# Product Launch, Version 2.0

## One Week Out
- Finalise the release notes and the changelog
- Write the announcement email and schedule it
- Record the demo video
- Brief the support team on the new features

## Launch Day
- Deploy to production and verify the health check
- Post the announcement on all channels
- Monitor errors for the first 2 hours
- Share the launch on social media

## After Launch
- Collect feedback from the first 50 users
- Triage the bug reports from launch day
- Write a short retrospective on what went well`,
  },
];
