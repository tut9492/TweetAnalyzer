# Tweet Analysis & Optimization System
## Technical Specification v1.0

**Purpose:** A system that scores tweet drafts, generates optimized variants, and produces publication-ready content.

---

## 1. SCORING RUBRIC

### 1.1 Scale
- **Range:** 1-10 (integer)
- **Passing threshold:** 7+ is publishable, 8+ is strong, 9+ is exceptional

### 1.2 Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Hook Strength | 25% | First line's ability to stop the scroll |
| Clarity | 20% | Single clear idea, no confusion |
| Engagement Potential | 20% | Likelihood of replies, quotes, saves |
| Authenticity | 15% | Matches author's voice and expertise |
| Structure | 10% | Format, whitespace, readability |
| CTA Effectiveness | 10% | Clear next step (if applicable) |

### 1.3 Factor Scoring Details

#### Hook Strength (25%)
```
10: Pattern interrupt + curiosity gap + immediate value signal
9:  Strong curiosity gap OR bold contrarian claim
8:  Clear value proposition in first line
7:  Decent opener, gets to point quickly
6:  Generic but functional opener
5:  Buried lede, real hook is line 2-3
4:  Weak/vague opener
1-3: No hook, starts with context/throat-clearing
```

**Hook Patterns (ranked by effectiveness):**
1. Contrarian claim: "Most [common belief] is wrong..."
2. Curiosity gap: "The real reason X happens..."
3. Direct value: "How to [achieve outcome] in [timeframe]"
4. Social proof + insight: "After [credential], here's what I learned..."
5. Question (use sparingly): "Why do [surprising thing]?"

**Hook Penalties:**
- Starts with "I" (-1 point)
- Starts with "So" or "Just" (-1 point)
- First line > 60 characters (-0.5 points)
- No hook, just jumps into content (-2 points)

#### Clarity (20%)
```
10: Crystal clear, a 12-year-old would understand
9:  One idea, well-executed, no ambiguity
8:  Clear main point, minor supporting details
7:  Understandable but could be tighter
6:  Slightly muddled, 2 competing ideas
5:  Reader has to work to understand
4:  Confusing structure or jargon-heavy
1-3: Multiple ideas fighting, unclear point
```

**Clarity Rules:**
- One tweet = one idea (STRICT)
- If you need "and" to describe the tweet's point, it's two tweets
- Technical jargon must earn its place (is audience technical?)
- Acronyms: spell out or skip unless universally known

#### Engagement Potential (20%)
```
10: Highly quotable + invites debate + shareworthy
9:  Strong reply magnet OR highly shareable
8:  Clear engagement hook (question, hot take, useful)
7:  Solid content people will like
6:  Fine content, low reply incentive
5:  Informative but passive consumption
4:  Niche appeal, limited interaction
1-3: No engagement mechanism
```

**Engagement Multipliers:**
- Asks genuine question (+1)
- Takes a stance people will debate (+1)
- Provides actionable value (+1)
- Taps into shared frustration (+1)
- Has "I need to save this" quality (+1)

**Engagement Penalties:**
- Preaching to choir, no tension (-1)
- Too complete, nothing to add (-1)
- Humble brag disguised as insight (-2)

#### Authenticity (15%)
```
10: Unmistakably this author's voice and expertise
9:  Strong voice, clear authority
8:  Authentic, within expertise zone
7:  Sounds like them, standard topic
6:  Generic but not off-brand
5:  Could be anyone
4:  Slightly off-voice
1-3: Doesn't match author's brand/expertise
```

**Voice Calibration Inputs:**
- Author's typical tone (analytical, casual, provocative)
- Expertise areas (what they can credibly claim)
- Audience expectations
- Historical high-performers

#### Structure (10%)
```
10: Perfect format for content type, optimal length
9:  Great structure, proper whitespace
8:  Good format choice, readable
7:  Acceptable structure
6:  Slightly off format for content type
5:  Poor whitespace or awkward breaks
4:  Wall of text or over-fragmented
1-3: Unreadable structure
```

**Structure Rules:**
- Single insight: 1-3 lines max
- Story/example: Can go longer with line breaks
- List format: Use for 3+ parallel items
- Whitespace: Break at natural thought boundaries
- Character count awareness:
  - Under 100 chars: Punchy insight
  - 100-200 chars: Standard tweet
  - 200-280 chars: Must justify length
  - Thread starter: Needs clear continuation hook

#### CTA Effectiveness (10%)
```
10: Natural, valuable CTA that serves reader
9:  Clear next step, well-integrated
8:  Functional CTA, not jarring
7:  Present but could be stronger
6:  Weak or generic CTA
5:  CTA feels forced
4:  CTA undermines content
N/A: No CTA needed (score based on natural ending)
```

**CTA Types (by effectiveness):**
1. Engagement CTA: "What's your experience with X?"
2. Value CTA: "Reply [word] and I'll send you [resource]"
3. Soft follow: "I write about X every week"
4. Hard follow: "Follow for more" (use sparingly)
5. Link CTA: Only with genuine value, never bait

---

## 2. VARIANT GENERATION

### 2.1 Overview
Generate exactly 3 variants for every draft:
1. **TIGHT** — Maximum clarity and concision
2. **SPICY** — Enhanced personality and punch
3. **EDGE** — Urgency, FOMO, or contrarian angle

### 2.2 TIGHT Variant Rules

**Objective:** Strip to essential meaning. Every word must earn its place.

**Transformation Steps:**
```
1. DELETE all throat-clearing phrases:
   - "I think that..." → [delete]
   - "In my opinion..." → [delete]
   - "It's worth noting that..." → [delete]
   - "The thing is..." → [delete]
   - "To be honest..." → [delete]

2. COMPRESS wordy phrases:
   - "in order to" → "to"
   - "the reason why" → "why"
   - "at this point in time" → "now"
   - "due to the fact that" → "because"
   - "a large number of" → "many"
   - "in the event that" → "if"

3. ELIMINATE redundancy:
   - "completely eliminate" → "eliminate"
   - "future plans" → "plans"
   - "end result" → "result"
   - "basic fundamentals" → "fundamentals"

4. STRENGTHEN verbs:
   - "is able to" → "can"
   - "has the ability to" → "can"
   - "make a decision" → "decide"
   - "take action" → "act"

5. CUT qualifiers (unless essential):
   - "very" → [delete]
   - "really" → [delete]
   - "quite" → [delete]
   - "somewhat" → [delete]
   - "fairly" → [delete]

6. FRONT-LOAD the insight:
   - Move the "aha" to line 1 if buried
   - Delete setup/context if possible
```

**TIGHT Target Metrics:**
- 15-30% shorter than original
- First line contains the core insight
- No word appears twice (unless intentional)
- Reading level: accessible

**Example Transformation:**
```
ORIGINAL:
"I think one of the most important things that founders
need to understand is that in order to be successful,
they really need to focus on just one thing at a time."

TIGHT:
"Founders: focus on one thing.
That's it. That's the secret."
```

### 2.3 SPICY Variant Rules

**Objective:** Amplify personality, add punch, make it memorable.

**Transformation Steps:**
```
1. STRENGTHEN claims:
   - "might help" → "transforms"
   - "can be useful" → "is essential"
   - "is important" → "is everything"
   - Add conviction (remove hedging)

2. ADD vivid language:
   - Replace abstract → concrete
   - Replace generic → specific
   - Add sensory or emotional words

3. INJECT personality:
   - Add characteristic phrases
   - Include authentic reactions
   - Show don't tell enthusiasm/frustration

4. PUNCH UP the hook:
   - Make first line more provocative
   - Add tension or stakes
   - Create stronger curiosity gap

5. ADD rhythm:
   - Use parallel structure
   - Vary sentence length (short punch after longer setup)
   - End on strong word

6. INCLUDE "texture":
   - Specific numbers beat vague quantities
   - Names/examples beat abstractions
   - "Show your work" details
```

**SPICY Flavor Additions:**
- Hot take framing: "Unpopular opinion:" / "Hard truth:"
- Specificity: vague numbers → exact numbers
- Stakes: why this matters NOW
- Personality tags: humor, frustration, excitement

**Example Transformation:**
```
ORIGINAL:
"Building in public is a good strategy for founders
who want to grow their audience while building."

SPICY:
"Building in public is a cheat code.

You get:
- Free marketing
- Instant feedback
- Accountability
- A hiring pipeline

All while doing work you'd do anyway.

The founders NOT doing this are playing on hard mode."
```

### 2.4 EDGE Variant Rules

**Objective:** Create urgency, tap FOMO, or take contrarian position.

**Transformation Steps:**
```
1. FIND THE CONTRARIAN ANGLE:
   - What does everyone believe that's wrong?
   - What's the uncomfortable truth?
   - What would surprise people?

2. ADD URGENCY:
   - Time pressure: "before it's too late"
   - Scarcity: "few people know"
   - Trend awareness: "this is shifting now"

3. CREATE FOMO:
   - Imply insider knowledge
   - Reference what smart people are doing
   - Show asymmetric opportunity

4. RAISE STAKES:
   - What do people lose by ignoring this?
   - What's the cost of inaction?
   - What separates winners from losers here?

5. PATTERN INTERRUPT:
   - Start with unexpected statement
   - Challenge conventional wisdom
   - Use surprising framing
```

**EDGE Patterns:**
- "Everyone says X. They're wrong."
- "The [type of person] who [outcome] all do this:"
- "In 2 years, [prediction]. Here's why:"
- "Stop [common behavior]. Start [alternative]."
- "[Big claim]. Here's proof:"

**EDGE Guardrails:**
- Must be defensible (don't manufacture controversy)
- Contrarian ≠ wrong (find the real insight)
- Urgency must be genuine (no fake scarcity)
- Edge ≠ mean (provocative, not cruel)

**Example Transformation:**
```
ORIGINAL:
"Building in public is a good strategy for founders
who want to grow their audience while building."

EDGE:
"Stealth mode is dead.

The founders raising in 2024 all built in public.
The ones who didn't? Still looking for product-market fit.

Your 'competitors will copy me' fear is costing you
everything.

The best ideas win by execution speed, not secrecy."
```

---

## 3. FINAL POLISH PROCESS

### 3.1 When User Selects a Variant

Execute this checklist before delivering final version:

```
FINAL_POLISH_CHECKLIST = [
    "character_count_check",      # Under 280 (or appropriate for thread)
    "hook_strength_verify",       # First line still strongest part
    "link_preview_check",         # If link: will preview help or hurt?
    "cta_natural_check",          # CTA flows naturally (if present)
    "read_aloud_test",            # No tongue twisters or awkward rhythm
    "typo_grammar_scan",          # Final proofread
    "brand_voice_confirm",        # Still sounds like author
    "platform_optimization",      # X-specific formatting
]
```

### 3.2 Polish Transformations

**Character Count Optimization:**
```python
if char_count > 270:
    # Find lowest-value words to cut
    # Compress phrases
    # Consider if content should be thread instead

if char_count < 100:
    # Verify this is intentionally punchy
    # Consider if more context helps
```

**Rhythm Check:**
```
- Read aloud (mentally)
- Check for accidental rhymes (remove)
- Check for alliteration (keep if intentional)
- Verify punch words land at line ends
- Ensure varied sentence length
```

**Platform Optimization:**
```
- Line breaks: 1-2 sentences per line max
- No orphan words on final line if avoidable
- Emojis: 0-2 max, only if matches voice
- Hashtags: 0-1 max, only if genuinely useful
- Mentions: only if adding to conversation
```

### 3.3 Final Output Format

```
FINAL VERSION:
[Clean, copy-paste ready text]

CHARACTER COUNT: [X]/280

NOTES:
- [Any specific posting recommendations]
- [Suggested timing if relevant]
- [Thread continuation if applicable]
```

---

## 4. COMPLETE EXAMPLE

### 4.1 Input Draft

```
INPUT:
"Something I've been thinking about lately is how the best
product people I know don't actually spend that much time
talking to users. Counterintuitive but I think there's
something to it. They have such deep mental models of their
users that they can predict what users want. The user
interviews just confirm what they already knew."
```

### 4.2 Score Analysis

```
SCORE: 5.8/10

BREAKDOWN:
- Hook Strength: 4/10 (25% weight) = 1.0
  → "Something I've been thinking about" is weak opener
  → Real hook is buried: "best PMs don't talk to users much"

- Clarity: 7/10 (20% weight) = 1.4
  → Core idea is clear but takes too long to arrive
  → Good insight, muddled delivery

- Engagement: 7/10 (20% weight) = 1.4
  → Contrarian take will spark debate
  → Missing clear engagement mechanism

- Authenticity: 7/10 (15% weight) = 1.05
  → Within expertise zone
  → Voice is present but muted

- Structure: 5/10 (10% weight) = 0.5
  → Wall of text
  → No line breaks for readability

- CTA: 5/10 (10% weight) = 0.5
  → No CTA or conversation prompt
  → Just ends

TOTAL: 5.85 → 5.8

PRIMARY ISSUES:
1. Buried lede (hook is line 2-3)
2. No structure/whitespace
3. Hedging language ("I think", "something to it")
```

### 4.3 Variant Generation

**VARIANT 1: TIGHT**
```
The best product people rarely do user interviews.

Counterintuitive?

They've built such deep user models that interviews
just confirm what they already knew.

The research happens before the meeting.
```
*Changes: Front-loaded insight, removed hedging, added structure*

---

**VARIANT 2: SPICY**
```
Hot take: The best PMs I know barely talk to users.

They're not lazy. They're operating on a different level.

While average PMs ask "what do you want?"
Elite PMs already know.

Years of pattern-matching built an internal user
that's more reliable than any interview.

User research confirms. It doesn't discover.
```
*Changes: Added "hot take" frame, parallel structure, stronger contrast*

---

**VARIANT 3: EDGE**
```
Unpopular opinion:

"Talk to users" is advice for beginners.

The best product people stopped doing regular user
interviews years ago.

They have 10,000 hours of user patterns
burned into their brain.

An interview tells them nothing new.

You're not skipping user research.
You're graduating from it.
```
*Changes: Contrarian framing, FOMO angle (you could graduate too), higher stakes*

---

### 4.4 User Selection & Final Polish

**User selects:** EDGE variant

**Polish Process:**
```
✓ Character count: 264/280
✓ Hook: "Unpopular opinion" + contrarian claim = strong
✓ Rhythm: Good variation, punchy ending
✓ Voice: Confident, direct, matches author
✓ Structure: Clean line breaks, readable

ADJUSTMENT NEEDED:
- "10,000 hours" is cliché, consider alternative
- Final line could be punchier
```

**FINAL VERSION:**
```
Unpopular opinion:

"Talk to users" is advice for beginners.

The best product people stopped doing regular user
interviews years ago.

They've internalized thousands of user conversations.

An interview tells them nothing new.

You're not skipping user research.
You're graduating from it.
```

**CHARACTER COUNT:** 258/280

**NOTES:**
- Strong reply potential from both agreements and disagreements
- Consider posting during PM Twitter active hours (9-11am PT)
- Could spawn thread: "Signs you've graduated from user interviews:"

---

## 5. API SPECIFICATION

### 5.1 Endpoints

```
POST /analyze
POST /generate-variants
POST /polish
POST /full-pipeline
```

### 5.2 Request/Response Schemas

**POST /analyze**
```json
// Request
{
  "draft": "string (the tweet text)",
  "author_context": {
    "voice": "analytical | casual | provocative | inspirational",
    "expertise_areas": ["string"],
    "audience": "string description",
    "sample_high_performers": ["string"] // optional
  }
}

// Response
{
  "score": 5.8,
  "breakdown": {
    "hook_strength": {"score": 4, "weight": 0.25, "weighted": 1.0},
    "clarity": {"score": 7, "weight": 0.20, "weighted": 1.4},
    "engagement": {"score": 7, "weight": 0.20, "weighted": 1.4},
    "authenticity": {"score": 7, "weight": 0.15, "weighted": 1.05},
    "structure": {"score": 5, "weight": 0.10, "weighted": 0.5},
    "cta": {"score": 5, "weight": 0.10, "weighted": 0.5}
  },
  "primary_issues": ["string"],
  "reasoning": "string"
}
```

**POST /generate-variants**
```json
// Request
{
  "draft": "string",
  "analysis": { /* output from /analyze */ },
  "author_context": { /* same as above */ }
}

// Response
{
  "variants": {
    "tight": {
      "text": "string",
      "changes_made": ["string"],
      "projected_score": 7.2
    },
    "spicy": {
      "text": "string",
      "changes_made": ["string"],
      "projected_score": 7.8
    },
    "edge": {
      "text": "string",
      "changes_made": ["string"],
      "projected_score": 7.5
    }
  }
}
```

**POST /polish**
```json
// Request
{
  "selected_variant": "tight | spicy | edge",
  "variant_text": "string",
  "author_context": { /* same as above */ }
}

// Response
{
  "final_text": "string",
  "character_count": 258,
  "polish_notes": ["string"],
  "posting_recommendations": {
    "timing": "string | null",
    "thread_potential": "string | null",
    "hashtags": ["string"] | null
  }
}
```

**POST /full-pipeline**
```json
// Request
{
  "draft": "string",
  "author_context": { /* same as above */ }
}

// Response
{
  "analysis": { /* /analyze response */ },
  "variants": { /* /generate-variants response */ },
  "recommended_variant": "tight | spicy | edge",
  "recommendation_reasoning": "string"
}
```

---

## 6. IMPLEMENTATION NOTES

### 6.1 Model Requirements
- Needs strong language understanding for style transformation
- Requires consistent scoring calibration
- Should handle author voice matching

### 6.2 Calibration
- Scoring should be validated against historical performance data
- Author context improves authenticity scoring accuracy
- Engagement prediction benefits from audience modeling

### 6.3 Edge Cases
- Thread starters: Adjust for continuation hook
- Quote tweets: Account for context of quoted content
- Reply tweets: Different hook dynamics
- Tweets with media: Adjust for visual carrying some weight

---

*Specification Version: 1.0*
*Last Updated: 2024*
