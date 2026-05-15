import Anthropic from '@anthropic-ai/sdk';
import { Tweet } from '../twitter/analyze-types';
import {
  ACTION_WEIGHTS,
  computeWeightedScoreFromInputs,
} from '../analysis/weighted-scorer';

const MODEL = 'claude-opus-4-7';

const SYSTEM_PROMPT = `You are a viral tweet coach for crypto and AI founders. You help builders ship launch announcements, technical narrative posts, and memecoin marketing that go viral on X.

You understand the new (May 2026) X For You ranking algorithm: it rewards replies more than likes, dwell time more than scrolls, shares (especially DM/copy-link) heavily, and penalizes block/mute/report. Author diversity attenuation means flooding gets suppressed. Candidates score independently — each post stands alone.

You also know what works for this niche:
- Strong first line that stops the scroll
- Personal narrative with technical credibility ("I built X for seven months")
- Clear callouts ($TICKER, @handles, links)
- A reveal or claim that earns the read
- An end CTA or hook for the next post

When scoring drafts, be honest. Don't flatter. Call out generic phrasing, weak hooks, missing CTAs, and over-length. Match the user's existing voice — they have one; don't suggest changes that sound like a different person.

Your output must be valid JSON matching the provided schema.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hookScore: {
      type: 'integer',
      description: 'How well the first line stops the scroll, on a 1-10 scale',
    },
    hookFeedback: {
      type: 'string',
      description: 'One sentence on why the hook scored what it did',
    },
    structureType: {
      type: 'string',
      enum: ['single', 'thread', 'reply', 'quote', 'announcement', 'list'],
    },
    structureFeedback: {
      type: 'string',
      description: 'One sentence on the structure: does it earn its length, is the arc clear',
    },
    voiceMatch: {
      type: 'integer',
      description: 'How well the draft matches the user\'s historical voice on a 1-10 scale based on reference posts',
    },
    missingElements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Concrete elements missing from the draft (e.g. "No $TICKER", "No CTA", "No specific number/proof point")',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'What this draft does well',
    },
    predictedPercentile: {
      type: 'integer',
      description: 'Predicted percentile from 0 to 100 vs the user\'s own historical posts',
    },
    variants: {
      type: 'array',
      description: 'Two or three rewrites of the draft',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          label: { type: 'string', description: 'Short label like "Tighter hook" or "Add ticker CTA"' },
          text: { type: 'string', description: 'The full revised draft' },
          why: { type: 'string', description: 'One sentence on why this variant should perform better' },
        },
        required: ['label', 'text', 'why'],
      },
    },
  },
  required: [
    'hookScore',
    'hookFeedback',
    'structureType',
    'structureFeedback',
    'voiceMatch',
    'missingElements',
    'strengths',
    'predictedPercentile',
    'variants',
  ],
} as const;

export interface DraftCoachReport {
  hookScore: number;
  hookFeedback: string;
  structureType: string;
  structureFeedback: string;
  voiceMatch: number;
  missingElements: string[];
  strengths: string[];
  predictedPercentile: number;
  variants: Array<{ label: string; text: string; why: string }>;
}

interface RankedReference {
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  weightedScore: number;
}

function pickReferenceTweets(tweets: Tweet[], n: number = 5): RankedReference[] {
  const scored = tweets.map((t) => {
    const media = t.entities?.media?.[0];
    const weightedScore = computeWeightedScoreFromInputs({
      likes: t.likeCount || 0,
      retweets: t.retweetCount || 0,
      replies: t.replyCount || 0,
      quotes: 0,
      impressions: t.viewCount || 0,
      isVideo: media?.type === 'video',
      isThread: false,
    });
    return {
      text: t.text,
      likes: t.likeCount || 0,
      retweets: t.retweetCount || 0,
      replies: t.replyCount || 0,
      impressions: t.viewCount || 0,
      weightedScore,
    };
  });
  scored.sort((a, b) => b.weightedScore - a.weightedScore);
  return scored.slice(0, n);
}

function formatReferences(refs: RankedReference[]): string {
  return refs
    .map(
      (r, i) =>
        `--- Reference post ${i + 1} (score: ${Math.round(r.weightedScore)}, ` +
        `likes: ${r.likes}, replies: ${r.replies}, retweets: ${r.retweets}, ` +
        `impressions: ${r.impressions}) ---\n${r.text}`,
    )
    .join('\n\n');
}

export async function coachDraft(opts: {
  draft: string;
  historicalTweets: Tweet[];
  username?: string;
}): Promise<DraftCoachReport> {
  const client = new Anthropic();
  const references = pickReferenceTweets(opts.historicalTweets, 5);

  const referenceBlock = `User handle: @${opts.username ?? 'unknown'}

These are the user's top 5 historical posts by weighted score, used as a baseline for voice and what works for them:

${formatReferences(references)}

Action weights used in the score: favorite=${ACTION_WEIGHTS.favorite}, retweet=${ACTION_WEIGHTS.retweet}, reply=${ACTION_WEIGHTS.reply}, impression=${ACTION_WEIGHTS.impression}.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: {
        type: 'json_schema',
        schema: RESPONSE_SCHEMA,
      },
    },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: referenceBlock,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Score this draft and return the JSON report.\n\n--- DRAFT ---\n${opts.draft}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response');
  }
  return JSON.parse(textBlock.text) as DraftCoachReport;
}
