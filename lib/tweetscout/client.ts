const TWEETSCOUT_API_BASE = 'https://api.tweetscout.io/v2';

export interface TweetScoutEngager {
  username: string;
  displayName: string;
  followers: number;
  influenceScore?: number;
  isVerified: boolean;
  engagementType: 'like' | 'retweet' | 'reply' | 'quote';
  profileUrl: string;
}

/**
 * Fetches high-influence users who engaged with a tweet via TweetScout API
 * @param tweetId - Twitter tweet ID
 * @param apiKey - TweetScout API key
 * @param minFollowers - Minimum followers to consider "high influence" (default: 10000)
 * @returns Array of high-influence engagers
 */
export async function getTweetEngagers(
  tweetId: string,
  apiKey: string,
  minFollowers: number = 10000
): Promise<TweetScoutEngager[]> {
  if (!apiKey) {
    console.warn('TweetScout API key not provided');
    return [];
  }

  // Try different possible endpoint patterns
  // Adjust based on actual TweetScout API documentation
  const possibleEndpoints = [
    `/tweets/${tweetId}/engagers`,
    `/tweets/${tweetId}/engagement`,
    `/tweets/${tweetId}/analytics`,
    `/tweet/${tweetId}/engagers`,
    `/engagement/${tweetId}`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const url = `${TWEETSCOUT_API_BASE}${endpoint}`;
      console.log(`📡 [TweetScout] Trying endpoint: ${url}`);

      // Try Bearer token first
      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // If Bearer doesn't work, try API key header
      if (response.status === 401) {
        response = await fetch(url, {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [TweetScout] Successfully fetched engagers from ${endpoint}`);
        return parseEngagersResponse(data, minFollowers);
      }

      // If 404, try next endpoint
      if (response.status === 404) {
        continue;
      }

      // If rate limit, wait and retry
      if (response.status === 429) {
        console.warn('⏱️  TweetScout rate limit hit, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

    } catch (error) {
      console.warn(`⚠️  Error with endpoint ${endpoint}:`, error);
      continue;
    }
  }

  console.warn(`⚠️  Could not fetch engagers for tweet ${tweetId} from any endpoint`);
  return [];
}

/**
 * Parses TweetScout API response to extract high-influence engagers
 * Adjust this function based on actual TweetScout response structure
 */
function parseEngagersResponse(
  data: any,
  minFollowers: number
): TweetScoutEngager[] {
  const engagers: TweetScoutEngager[] = [];

  // Try different possible response structures
  const users = 
    data?.engagers || 
    data?.users || 
    data?.data?.engagers || 
    data?.data?.users ||
    data?.engagement?.users ||
    data?.likes || 
    data?.retweets || 
    data?.replies ||
    data?.data ||
    [];

  if (!Array.isArray(users)) {
    console.warn('⚠️  TweetScout response does not contain users array');
    return [];
  }

  for (const user of users) {
    // Extract user data (adjust field names based on actual response)
    const followers = 
      user.followers_count || 
      user.followers || 
      user.follower_count ||
      user.public_metrics?.followers_count ||
      0;

    const username = 
      user.username || 
      user.screen_name || 
      user.userName ||
      user.screenName ||
      '';

    const displayName = 
      user.name || 
      user.display_name || 
      user.displayName ||
      '';

    // Determine engagement type
    const engagementType: 'like' | 'retweet' | 'reply' | 'quote' = 
      user.engagement_type || 
      user.type ||
      (user.liked ? 'like' : 
       user.retweeted ? 'retweet' : 
       user.replied ? 'reply' : 
       user.quoted ? 'quote' : 'like');

    // Check if user is high-influence
    const isVerified = user.verified || user.is_verified || user.isBlueVerified || false;
    const influenceScore = user.influence_score || user.influenceScore || followers;

    if (followers >= minFollowers || isVerified || (influenceScore && influenceScore > 50)) {
      engagers.push({
        username,
        displayName,
        followers,
        influenceScore,
        isVerified,
        engagementType,
        profileUrl: `https://twitter.com/${username}`,
      });
    }
  }

  // Sort by influence (followers or influence score) and return top 10
  return engagers
    .sort((a, b) => (b.influenceScore || b.followers) - (a.influenceScore || a.followers))
    .slice(0, 10);
}




