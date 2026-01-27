import { Tweet } from '../twitter/analyze-types';
import { DeepPostAnalysis, AnalysisSummary } from '../twitter/types';
import { getTweetEngagers } from '../tweetscout/client';

export async function analyzePost(
  tweet: Tweet,
  allTweets: Tweet[],
  tweetscoutApiKey?: string
): Promise<DeepPostAnalysis> {
  // Calculate metrics
  const likes = tweet.likeCount || 0;
  const retweets = tweet.retweetCount || 0;
  const replies = tweet.replyCount || 0;
  const quotes = 0; // API doesn't provide quotes, default to 0
  const impressions = tweet.viewCount || 0;
  const totalEngagement = likes + retweets + replies + quotes;
  const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

  // Detect structure
  const isReply = tweet.isReply || false;
  const conversationId = tweet.conversationId;
  const hasMedia = !!tweet.entities?.media && tweet.entities.media.length > 0;
  
  // Determine type
  let type: 'single' | 'thread' | 'reply' | 'quote' = 'single';
  let threadLength: number | undefined;
  
  if (isReply) {
    // Check if it's part of a thread (same conversationId)
    const threadTweets = allTweets.filter(t => t.conversationId === conversationId);
    if (threadTweets.length > 1) {
      type = 'thread';
      threadLength = threadTweets.length;
    } else {
      type = 'reply';
    }
  } else if (conversationId) {
    // Check if there are other tweets in this conversation
    const threadTweets = allTweets.filter(t => t.conversationId === conversationId);
    if (threadTweets.length > 1) {
      type = 'thread';
      threadLength = threadTweets.length;
    }
  }

  // Media type
  let mediaType: 'image' | 'video' | 'gif' | 'none' = 'none';
  if (hasMedia && tweet.entities?.media) {
    const firstMedia = tweet.entities.media[0];
    if (firstMedia.type === 'photo') mediaType = 'image';
    else if (firstMedia.type === 'video') mediaType = 'video';
    else if (firstMedia.type === 'animated_gif') mediaType = 'gif';
  }

  // Extract hashtags and mentions
  const hashtagRegex = /#\w+/g;
  const mentionRegex = /@\w+/g;
  const hashtags = tweet.text.match(hashtagRegex) || [];
  const mentions = tweet.text.match(mentionRegex) || [];
  
  // Count links
  const linkCount = tweet.entities?.urls?.length || 0;

  // Analyze timing
  const createdAt = new Date(tweet.createdAt);
  const dayOfWeek = createdAt.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = createdAt.getHours();
  
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  // Calculate performance vs average
  const avgEngagement = allTweets.reduce((sum, t) => 
    sum + (t.likeCount || 0) + (t.retweetCount || 0) + (t.replyCount || 0), 0
  ) / allTweets.length;
  const performanceVsAvg = avgEngagement > 0 
    ? ((totalEngagement - avgEngagement) / avgEngagement) * 100 
    : 0;

  // Build tweet URL
  const username = tweet.author?.username || 'unknown';
  const url = `https://twitter.com/${username}/status/${tweet.id}`;

  // Fetch high-influence engagers if API key provided
  let bigEngagers: DeepPostAnalysis['bigEngagers'] = [];
  
  if (tweetscoutApiKey) {
    try {
      const engagers = await getTweetEngagers(tweet.id, tweetscoutApiKey, 10000);
      bigEngagers = engagers.map(engager => ({
        username: engager.username,
        displayName: engager.displayName,
        followers: engager.followers,
        engagementType: engager.engagementType,
        profileUrl: engager.profileUrl,
      }));
    } catch (error) {
      console.warn(`Could not fetch engagers for tweet ${tweet.id}:`, error);
    }
  }

  return {
    id: tweet.id,
    text: tweet.text,
    createdAt: tweet.createdAt,
    url,
    metrics: {
      likes,
      retweets,
      quotes,
      replies,
      impressions,
      engagementRate,
      totalEngagement,
    },
    structure: {
      type,
      threadLength,
      hasMedia,
      mediaType,
      textLength: tweet.text.length,
      hashtags,
      mentions,
      linkCount,
    },
    timing: {
      dayOfWeek,
      hour,
      timeOfDay,
      performanceVsAvg,
    },
    bigEngagers,
  };
}

export async function analyzePosts(
  tweets: Tweet[],
  tweetscoutApiKey?: string,
  onlyTopPosts: boolean = true
): Promise<{ posts: DeepPostAnalysis[], summary: AnalysisSummary }> {
  if (tweets.length === 0) {
    return {
      posts: [],
      summary: {
        totalPosts: 0,
        avgEngagement: 0,
        avgEngagementRate: 0,
        bestPerformingType: 'single',
        bestDay: 'Monday',
        bestHour: 12,
        totalEngagement: 0,
      },
    };
  }

  // If onlyTopPosts is true, only fetch engagers for top 10 posts by engagement
  // This saves API calls and time
  let topTweets: Tweet[] = [];
  if (onlyTopPosts && tweetscoutApiKey) {
    // Sort by engagement and take top 10
    const sorted = [...tweets].sort((a, b) => {
      const aEng = (a.likeCount || 0) + (a.retweetCount || 0) + (a.replyCount || 0);
      const bEng = (b.likeCount || 0) + (b.retweetCount || 0) + (b.replyCount || 0);
      return bEng - aEng;
    });
    topTweets = sorted.slice(0, 10);
  }

  // Analyze all posts (but only fetch engagers for top posts if enabled)
  const posts = await Promise.all(
    tweets.map(async (tweet) => {
      const shouldFetchEngagers = 
        tweetscoutApiKey && 
        (!onlyTopPosts || topTweets.includes(tweet));
      
      return analyzePost(
        tweet, 
        tweets, 
        shouldFetchEngagers ? tweetscoutApiKey : undefined
      );
    })
  );

  // Calculate summary
  const totalEngagement = posts.reduce((sum, p) => sum + p.metrics.totalEngagement, 0);
  const avgEngagement = totalEngagement / posts.length;
  const avgEngagementRate = posts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / posts.length;

  // Best performing type
  const typeStats = posts.reduce((acc, p) => {
    const type = p.structure.type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalEngagement: 0 };
    }
    acc[type].count++;
    acc[type].totalEngagement += p.metrics.totalEngagement;
    return acc;
  }, {} as Record<string, { count: number; totalEngagement: number }>);

  const bestPerformingType = Object.entries(typeStats)
    .sort((a, b) => (b[1].totalEngagement / b[1].count) - (a[1].totalEngagement / a[1].count))[0]?.[0] as 'thread' | 'single' | 'reply' | 'quote' || 'single';

  // Best day
  const dayStats = posts.reduce((acc, p) => {
    const day = p.timing.dayOfWeek;
    if (!acc[day]) {
      acc[day] = { count: 0, totalEngagement: 0 };
    }
    acc[day].count++;
    acc[day].totalEngagement += p.metrics.totalEngagement;
    return acc;
  }, {} as Record<string, { count: number; totalEngagement: number }>);

  const bestDay = Object.entries(dayStats)
    .sort((a, b) => (b[1].totalEngagement / b[1].count) - (a[1].totalEngagement / a[1].count))[0]?.[0] || 'Monday';

  // Best hour
  const hourStats = posts.reduce((acc, p) => {
    const hour = p.timing.hour;
    if (!acc[hour]) {
      acc[hour] = { count: 0, totalEngagement: 0 };
    }
    acc[hour].count++;
    acc[hour].totalEngagement += p.metrics.totalEngagement;
    return acc;
  }, {} as Record<number, { count: number; totalEngagement: number }>);

  const bestHour = Object.entries(hourStats)
    .sort((a, b) => (b[1].totalEngagement / b[1].count) - (a[1].totalEngagement / a[1].count))[0]?.[0] || 12;

  return {
    posts,
    summary: {
      totalPosts: posts.length,
      avgEngagement,
      avgEngagementRate,
      bestPerformingType: bestPerformingType as 'thread' | 'single' | 'reply' | 'quote',
      bestDay,
      bestHour: parseInt(bestHour.toString()),
      totalEngagement,
    },
  };
}

