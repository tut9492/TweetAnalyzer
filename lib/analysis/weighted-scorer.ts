import { Tweet } from '../twitter/analyze-types';

/**
 * Weights are tunable. The 2026 xai-org/x-algorithm release exposes the
 * scoring formula but keeps numeric weights private (crate::params).
 * Defaults below are inspired by the 2023 twitter/the-algorithm release
 * and adjusted for signals exposed by the public X API.
 */
export const ACTION_WEIGHTS = {
  favorite: 0.5,
  retweet: 1.0,
  reply: 13.5,
  quote: 1.0,
  impression: 0.001,
  videoBonus: 1.2,
  threadBonus: 1.1,
  minVideoDurationMs: 10_000,
} as const;

export interface WeightedScoreInputs {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  isVideo: boolean;
  videoDurationMs?: number;
  isThread: boolean;
}

export function computeWeightedScoreFromInputs(i: WeightedScoreInputs): number {
  const base =
    ACTION_WEIGHTS.favorite * i.likes +
    ACTION_WEIGHTS.retweet * i.retweets +
    ACTION_WEIGHTS.reply * i.replies +
    ACTION_WEIGHTS.quote * i.quotes +
    ACTION_WEIGHTS.impression * i.impressions;

  let multiplier = 1;
  const videoEligible =
    i.isVideo && (i.videoDurationMs ?? Infinity) >= ACTION_WEIGHTS.minVideoDurationMs;
  if (videoEligible) multiplier *= ACTION_WEIGHTS.videoBonus;
  if (i.isThread) multiplier *= ACTION_WEIGHTS.threadBonus;

  return base * multiplier;
}

export function computeWeightedScore(
  tweet: Tweet,
  opts: { isThread: boolean }
): number {
  const media = tweet.entities?.media?.[0];
  return computeWeightedScoreFromInputs({
    likes: tweet.likeCount || 0,
    retweets: tweet.retweetCount || 0,
    replies: tweet.replyCount || 0,
    quotes: 0,
    impressions: tweet.viewCount || 0,
    isVideo: media?.type === 'video',
    isThread: opts.isThread,
  });
}
