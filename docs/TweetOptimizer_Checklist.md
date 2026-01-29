# TweetOptimizer - Launch Checklist

> Phased, YC-Level Standards

---

## Phase 1: Setup

### Project Foundation
- [ ] SvelteKit initialized
- [ ] Tailwind configured
- [ ] TypeScript strict mode
- [ ] Folder structure set

### Database
- [ ] Supabase project created
- [ ] Schema deployed
- [ ] **RLS enabled on ALL tables**
- [ ] Types generated

### Environment
- [ ] .env.local created
- [ ] .gitignore configured
- [ ] Vercel connected

---

## Phase 2: Build

### Security (Ongoing)
- [ ] RLS policy per table
- [ ] Input validation (Zod)
- [ ] Parameterized queries only
- [ ] User content sanitized

### Auth
- [ ] Supabase Auth configured
- [ ] Routes protected server-side
- [ ] Auth errors handled
- [ ] Logout clears sessions

### Core Features
- [ ] Tweet scoring works
- [ ] Credit system works
- [ ] History page works
- [ ] Profile/training works

---

## Phase 3: Pre-Launch

### Security Audit
- [ ] `npm audit` clean
- [ ] No secrets in git
- [ ] CSP headers set
- [ ] Rate limiting active
- [ ] CORS configured

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie consent

### Performance
- [ ] Lighthouse > 90
- [ ] Images optimized
- [ ] Code splitting enabled

### SEO
- [ ] Meta tags set
- [ ] OG images (1200x630)
- [ ] sitemap.xml
- [ ] robots.txt

### Infrastructure
- [ ] Error monitoring (Sentry)
- [ ] Uptime monitoring
- [ ] Backups verified

---

## Phase 4: Launch

### Pre-Launch
- [ ] Final deploy
- [ ] Smoke test all flows
- [ ] Monitoring dashboards open

### Launch Day
- [ ] Product Hunt live
- [ ] AppSumo deal live
- [ ] Twitter thread posted
- [ ] Support channels monitored

---

## Phase 5: Post-Launch

### First 24 Hours
- [ ] Error rates normal
- [ ] Feedback responded to
- [ ] Critical bugs fixed

### Analytics
- [ ] PostHog/Mixpanel setup
- [ ] Funnel tracking
- [ ] Metrics dashboard

### Growth
- [ ] Testimonials collected
- [ ] Referral program live
- [ ] Email onboarding active

---

## Metrics Tracking

### North Star
**Weekly Active Scorers (WAS)** - Users scoring 3+ tweets/week

### Weekly Log
| Week | Signups | Paid | WAS | Revenue |
|------|---------|------|-----|---------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

---

## Progress

| Phase | Status | Started | Done |
|-------|--------|---------|------|
| Setup | ⬜ | | |
| Build | ⬜ | | |
| Pre-Launch | ⬜ | | |
| Launch | ⬜ | | |
| Post-Launch | ⬜ | | |
