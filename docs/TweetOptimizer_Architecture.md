# TweetOptimizer Lite - Architecture

> Claude-Only Version | Minimal Dependencies

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | SvelteKit | Fast, simple, tiny bundles |
| Styling | Tailwind CSS | Rapid iteration |
| Database | Supabase | Auth + Postgres + free tier |
| AI | Claude API | Only external dependency |
| Payments | Stripe | Industry standard |
| Hosting | Vercel | Free, edge functions |

**Total services:** 4

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                     (SvelteKit)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Scorer  │  │ History │  │ Profile │  │ Billing │   │
│  │  Page   │  │  Page   │  │  Setup  │  │  Page   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
└───────┼────────────┼────────────┼────────────┼─────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                   API ROUTES                            │
│              (SvelteKit endpoints)                      │
│  POST /api/score  │  GET /api/history  │  POST /api/profile │
└─────────┬─────────┴──────────┬─────────┴────────┬───────┘
          │                    │                  │
          ▼                    ▼                  ▼
   ┌─────────────┐      ┌─────────────┐    ┌───────────┐
   │ Claude API  │      │  Supabase   │    │  Stripe   │
   │  (scoring)  │      │ (database)  │    │ (billing) │
   └─────────────┘      └─────────────┘    └───────────┘
```

---

## Data Model

```sql
-- Users (extends Supabase Auth)
profiles
  id              uuid PRIMARY KEY (refs auth.users)
  email           text
  credits         integer DEFAULT 10
  tier            text DEFAULT 'free'  -- free, starter, creator, lifetime, pro
  stripe_customer text
  created_at      timestamp

-- Personal model training data
training_tweets
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  content         text
  impressions     integer
  likes           integer
  created_at      timestamp

-- Scoring history
scores
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  content         text
  score           integer  -- 0-100
  signals         jsonb    -- {hook: 8, length: 7, cta: 5...}
  suggestions     text[]
  created_at      timestamp

-- Credit transactions
transactions
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  type            text  -- 'purchase', 'use', 'bonus'
  amount          integer
  created_at      timestamp
```

---

## API Endpoints

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/api/score` | POST | Score a tweet, deduct 1 credit |
| `/api/history` | GET | Get user's scoring history |
| `/api/profile` | GET/POST | Get/update training tweets |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook` | POST | Handle Stripe webhooks |

---

## Scoring Prompt

```typescript
const scorePrompt = `You are an X/Twitter algorithm expert.

Score this tweet 0-100 based on these signals:
- Hook strength (first 10 words)
- Optimal length (70-100 chars ideal)
- Engagement triggers (questions, opinions, stories)
- Readability (short sentences, line breaks)
- Call-to-action presence
- Avoid: links, hashtag spam, engagement bait

${userProfile ? `User's top performing tweets for context:\n${userProfile}` : ''}

Tweet to score:
"""
${tweetContent}
"""

Return JSON:
{
  "score": 0-100,
  "signals": {
    "hook": 0-10,
    "length": 0-10,
    "engagement": 0-10,
    "readability": 0-10,
    "cta": 0-10
  },
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "improved_version": "optional rewrite"
}`;
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1-3)
- [ ] SvelteKit + Tailwind setup
- [ ] Supabase project + schema
- [ ] Basic auth (magic link)
- [ ] Landing page

### Phase 2: Core Scorer (Days 4-7)
- [ ] Tweet input component
- [ ] Claude API integration
- [ ] Score display + breakdown
- [ ] Suggestions UI
- [ ] Credit system

### Phase 3: Personalization (Days 8-10)
- [ ] Training tweets input
- [ ] Personal model context
- [ ] History page

### Phase 4: Payments (Days 11-12)
- [ ] Stripe integration
- [ ] Credit packs
- [ ] Lifetime tier
- [ ] Pro subscription

### Phase 5: Polish (Days 13-14)
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Deploy to Vercel

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| No X API | Manual paste | Zero platform risk |
| Credits not rate limits | Pay-per-score | Fairer pricing |
| Supabase over Firebase | Postgres | Better for relational data |
| SvelteKit over Next | Simpler | Less boilerplate |
| Server-side Claude calls | Security | Hide API key |

---

## Getting Started

```bash
# Create project
npx sv create tweetoptimizer
cd tweetoptimizer

# Add dependencies
npm install @supabase/supabase-js stripe

# Environment variables
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Cost Estimates

| Scale | Claude API | Supabase | Vercel | Total |
|-------|------------|----------|--------|-------|
| 1K scores/mo | $30-50 | $0 | $0 | $50 |
| 10K scores/mo | $300-500 | $25 | $0 | $525 |
| 100K scores/mo | $3-5K | $75 | $20 | $5K |

Gross margin stays 80%+ at all scales.
