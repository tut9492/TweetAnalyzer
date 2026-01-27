import { NextResponse } from 'next/server';
import { extractUsername, getUserProfile, getUserTweets } from '@/lib/twitter/analyze-client';
import { AnalysisResponse, Tweet, TopPost } from '@/lib/twitter/analyze-types';

/**
 * Calculate total engagement for a tweet
 */
function getTotalEngagement(tweet: Tweet): number {
  return (tweet.likeCount || 0) + 
         (tweet.retweetCount || 0) + 
         (tweet.replyCount || 0) + 
         (tweet.viewCount || 0);
}

/**
 * Check if tweet is a reply
 */
function isReply(tweet: Tweet): boolean {
  return tweet.isReply === true;
}

/**
 * Check if tweet has media
 */
function hasMedia(tweet: Tweet): boolean {
  return !!tweet.entities?.media && tweet.entities.media.length > 0;
}

/**
 * Check if tweet has links
 */
function hasLinks(tweet: Tweet): boolean {
  return !!tweet.entities?.urls && tweet.entities.urls.length > 0;
}

/**
 * Get hour from tweet date
 */
function getHour(tweet: Tweet): number {
  const date = new Date(tweet.createdAt);
  return date.getHours();
}

/**
 * Get day of week from tweet date
 */
function getDayOfWeek(tweet: Tweet): string {
  const date = new Date(tweet.createdAt);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

/**
 * Analyze tweets and calculate metrics
 */
function analyzeTweets(tweets: Tweet[], followers: number): AnalysisResponse['postingStrategy'] & AnalysisResponse['engagementMetrics'] & AnalysisResponse['contentBreakdown'] & { topPosts: TopPost[] } {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter tweets from last 30 days
  const recentTweets = tweets.filter(t => {
    const tweetDate = new Date(t.createdAt);
    return tweetDate >= thirtyDaysAgo;
  });

  // Filter tweets from last 7 days
  const last7DaysTweets = recentTweets.filter(t => {
    const tweetDate = new Date(t.createdAt);
    return tweetDate >= sevenDaysAgo;
  });

  // Calculate posting strategy
  const posts = last7DaysTweets.filter(t => !isReply(t));
  const replies = last7DaysTweets.filter(t => isReply(t));
  const postsPerDay = posts.length / 7;
  const repliesPerDay = replies.length / 7;

  // Calculate threads (tweets with the same conversationId)
  const threadTweets = new Set<string>();
  const conversationGroups: { [key: string]: Tweet[] } = {};
  
  recentTweets.forEach(tweet => {
    if (tweet.conversationId) {
      if (!conversationGroups[tweet.conversationId]) {
        conversationGroups[tweet.conversationId] = [];
      }
      conversationGroups[tweet.conversationId].push(tweet);
    }
  });
  
  // Mark tweets in conversations with 2+ tweets as thread tweets
  Object.values(conversationGroups).forEach(group => {
    if (group.length >= 2) {
      group.forEach(tweet => {
        threadTweets.add(tweet.id);
      });
    }
  });
  
  const threadsPerWeek = Math.round((Object.keys(conversationGroups).filter(id => conversationGroups[id].length >= 2).length) / 4.3); // Approximate

  // Calculate engagement metrics
  const totalEngagement = recentTweets.reduce((sum, t) => sum + getTotalEngagement(t), 0);
  const avgEngagement = recentTweets.length > 0 ? Math.round(totalEngagement / recentTweets.length) : 0;
  const engagementRate = followers > 0 ? (avgEngagement / followers) * 100 : 0;

  // Calculate best posting times (group by hour)
  const hourEngagement: { [key: number]: { count: number; total: number } } = {};
  recentTweets.forEach(tweet => {
    const hour = getHour(tweet);
    if (!hourEngagement[hour]) {
      hourEngagement[hour] = { count: 0, total: 0 };
    }
    hourEngagement[hour].count++;
    hourEngagement[hour].total += getTotalEngagement(tweet);
  });

  // Find best hours (top 3 by average engagement)
  const bestHours = Object.entries(hourEngagement)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEngagement: data.total / data.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3)
    .map(h => {
      const period = h.hour >= 12 ? 'pm' : 'am';
      const displayHour = h.hour > 12 ? h.hour - 12 : h.hour === 0 ? 12 : h.hour;
      return `${displayHour}${period}`;
    });

  // Calculate content breakdown
  const threads = recentTweets.filter(t => threadTweets.has(t.id) && !isReply(t));
  const singleTweets = recentTweets.filter(t => !threadTweets.has(t.id) && !isReply(t));
  const replyTweets = recentTweets.filter(t => isReply(t));
  const withMediaTweets = recentTweets.filter(t => hasMedia(t));
  const withLinksTweets = recentTweets.filter(t => hasLinks(t));

  const total = recentTweets.length;
  const threadsPct = total > 0 ? Math.round((threads.length / total) * 100) : 0;
  const singlePct = total > 0 ? Math.round((singleTweets.length / total) * 100) : 0;
  const repliesPct = total > 0 ? Math.round((replyTweets.length / total) * 100) : 0;
  const mediaPct = total > 0 ? Math.round((withMediaTweets.length / total) * 100) : 0;
  const linksPct = total > 0 ? Math.round((withLinksTweets.length / total) * 100) : 0;

  // Calculate multipliers
  const threadEngagement = threads.length > 0 
    ? threads.reduce((sum, t) => sum + getTotalEngagement(t), 0) / threads.length 
    : 0;
  const singleEngagement = singleTweets.length > 0
    ? singleTweets.reduce((sum, t) => sum + getTotalEngagement(t), 0) / singleTweets.length
    : 0;
  const mediaEngagement = withMediaTweets.length > 0
    ? withMediaTweets.reduce((sum, t) => sum + getTotalEngagement(t), 0) / withMediaTweets.length
    : 0;
  const noMediaEngagement = (total - withMediaTweets.length) > 0
    ? recentTweets.filter(t => !hasMedia(t)).reduce((sum, t) => sum + getTotalEngagement(t), 0) / (total - withMediaTweets.length)
    : 0;
  const linksEngagement = withLinksTweets.length > 0
    ? withLinksTweets.reduce((sum, t) => sum + getTotalEngagement(t), 0) / withLinksTweets.length
    : 0;
  const noLinksEngagement = (total - withLinksTweets.length) > 0
    ? recentTweets.filter(t => !hasLinks(t)).reduce((sum, t) => sum + getTotalEngagement(t), 0) / (total - withLinksTweets.length)
    : 0;

  const mediaMultiplier = noMediaEngagement > 0 ? (mediaEngagement / noMediaEngagement).toFixed(1) : '1.0';
  const linksMultiplier = noLinksEngagement > 0 ? (linksEngagement / noLinksEngagement).toFixed(1) : '1.0';
  const threadMultiplier = singleEngagement > 0 ? (threadEngagement / singleEngagement).toFixed(1) : '1.0';

    // Get top 5 posts
    const topPosts: TopPost[] = recentTweets
      .map(tweet => {
        const engagement = getTotalEngagement(tweet);
        const isThreadTweet = threadTweets.has(tweet.id);
        const isReplyTweet = isReply(tweet);
        
        let type: 'Thread' | 'Single' | 'Reply' = 'Single';
        if (isReplyTweet) type = 'Reply';
        else if (isThreadTweet) type = 'Thread';

        const date = new Date(tweet.createdAt);
        const day = getDayOfWeek(tweet);
        const hour = date.getHours();
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const postedAt = `${day} ${displayHour}:${minutes}${period}`;

      return {
        id: tweet.id,
        text: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
        totalEngagement: engagement,
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        type,
        tweetCount: isThreadTweet && tweet.conversationId ? 
          (conversationGroups[tweet.conversationId]?.length || 0) : undefined,
        mediaType: hasMedia(tweet) ? (tweet.entities?.media?.[0]?.type === 'video' ? 'Video' : 'Image') : undefined,
        postedAt,
        postedAtDate: date,
      };
    })
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 5);

  return {
    postsPerDay: Math.round(postsPerDay * 10) / 10,
    repliesPerDay: Math.round(repliesPerDay * 10) / 10,
    threadsPerWeek: threadsPerWeek,
    bestPostingTimes: bestHours.length > 0 ? bestHours : ['N/A'],
    avgEngagement,
    engagementRate: Math.round(engagementRate * 10) / 10,
    bestFormat: threadMultiplier !== '1.0' 
      ? `Threads (${threadMultiplier}x single posts)`
      : 'Single tweets',
    topTopics: [], // TODO: Extract topics from tweet text
    threads: { 
      percentage: threadsPct, 
      note: threadMultiplier !== '1.0' ? 'highest engagement' : undefined 
    },
    singleTweets: { percentage: singlePct },
    replies: { percentage: repliesPct },
    withMedia: { 
      percentage: mediaPct, 
      multiplier: `${mediaMultiplier}x ${parseFloat(mediaMultiplier) >= 1 ? 'better' : 'worse'}` 
    },
    withLinks: { 
      percentage: linksPct, 
      multiplier: `${linksMultiplier}x ${parseFloat(linksMultiplier) >= 1 ? 'better' : 'worse'}` 
    },
    topPosts,
  };
}

/**
 * POST /api/analyze
 * Analyzes a Twitter creator account
 */
export async function POST(request: Request) {
  console.log('🚀 [API] /api/analyze endpoint called');
  
  try {
    const body = await request.json();
    const { username: input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Extract username from URL or input
    const username = extractUsername(input);
    console.log('Analyzing username:', username);

    // Fetch user profile
    console.log('Fetching user profile...');
    const profile = await getUserProfile(username);
    console.log('User profile fetched:', profile.username);

    // Wait 5.5 seconds between API calls to respect rate limits
    console.log('⏱️  Waiting 5.5 seconds before fetching tweets (rate limit)...');
    await new Promise(resolve => setTimeout(resolve, 5500));

    // Fetch user tweets
    console.log('Fetching user tweets...');
    const tweets = await getUserTweets(username, 100);
    console.log(`Fetched ${tweets.length} tweets`);
    console.log('Tweets type:', typeof tweets);
    console.log('Is array?', Array.isArray(tweets));
    console.log('First tweet sample:', tweets?.[0] ? JSON.stringify(tweets[0], null, 2).substring(0, 200) : 'N/A');

    if (!tweets || tweets.length === 0) {
      console.error('❌ [API] No tweets returned from getUserTweets');
      console.error('Tweets value:', tweets);
      console.error('Tweets type:', typeof tweets);
      console.error('Is array?', Array.isArray(tweets));
      
      return NextResponse.json(
        { 
          error: 'No tweets found for this user. The user may not have any public tweets, or the API response format may be different than expected.',
          debug: {
            tweetsType: typeof tweets,
            isArray: Array.isArray(tweets),
            tweetsLength: tweets?.length,
            tweetsValue: Array.isArray(tweets) ? `Array with ${tweets.length} items` : String(tweets),
            suggestion: 'Check the terminal logs for the full API response structure (look for "===== API RESPONSE (getUserTweets) =====")'
          }
        },
        { status: 404 }
      );
    }

    // Analyze tweets
    console.log('Analyzing tweets...');
    const followers = profile.public_metrics?.followers_count || 0;
    const analysis = analyzeTweets(tweets, followers);

    // Build response
    const response: AnalysisResponse = {
      overview: {
        username: profile.username,
        name: profile.name,
        followers: followers,
        bio: profile.description || '',
        profileImageUrl: profile.profile_image_url,
      },
      postingStrategy: {
        postsPerDay: analysis.postsPerDay,
        repliesPerDay: analysis.repliesPerDay,
        threadsPerWeek: analysis.threadsPerWeek,
        bestPostingTimes: analysis.bestPostingTimes,
      },
      engagementMetrics: {
        avgEngagement: analysis.avgEngagement,
        engagementRate: analysis.engagementRate,
        bestFormat: analysis.bestFormat,
        topTopics: analysis.topTopics,
      },
      contentBreakdown: {
        threads: analysis.threads,
        singleTweets: analysis.singleTweets,
        replies: analysis.replies,
        withMedia: analysis.withMedia,
        withLinks: analysis.withLinks,
      },
      topPosts: analysis.topPosts,
    };

    console.log('Analysis complete');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    
    // Handle rate limit errors specifically
    if (error && typeof error === 'object' && 'isRateLimit' in error && (error as any).isRateLimit) {
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
          isRateLimit: true,
          retryAfter: 5
        },
        { status: 429 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze creator';
    const statusCode = (error && typeof error === 'object' && 'statusCode' in error) 
      ? (error as any).statusCode 
      : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

