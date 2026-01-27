import { TrendResponse, Trend } from './types';
import { Tweet } from './analyze-types';
import { waitForRateLimit } from '../utils/rate-limiter';

const API_BASE = 'https://api.twitterapi.io';

/**
 * Fetches trending topics from TwitterAPI.io
 * @returns Raw response data from the API
 */
export async function getTrendingTopics(): Promise<TrendResponse> {
  const apiKey = process.env.TWITTER_API_KEY;
  
  if (!apiKey) {
    const error = new Error('TWITTER_API_KEY is not set in environment variables');
    console.error('❌ [Twitter API]', error.message);
    throw error;
  }

  // WOEID (Where On Earth ID) - 1 = Worldwide, 23424977 = United States
  // See: https://gist.github.com/tedyblood/5bb5a9f78314cc1f478b3dd7cde790b9
  const woeid = process.env.TWITTER_WOEID || '1'; // Default to Worldwide
  const url = `https://api.twitterapi.io/twitter/trends?woeid=${woeid}`;
  
  console.log('📡 [Twitter API] Fetching trending topics from:', url);
  console.log('🌍 [Twitter API] Using WOEID:', woeid, woeid === '1' ? '(Worldwide)' : woeid === '23424977' ? '(United States)' : '');
  console.log('🔑 [Twitter API] Using API key:', apiKey.substring(0, 10) + '...');
  console.log('📏 [Twitter API] API key length:', apiKey.length);
  console.log('🌐 [Twitter API] Request URL:', url);
  console.log('📋 [Twitter API] Request headers:', {
    'X-API-Key': apiKey.substring(0, 10) + '...',
    headerCount: 1,
  });

  try {
    console.log('Starting API call...');
    console.log('API Key loaded:', !!apiKey);
    console.log('Calling URL:', url);
    
    const startTime = Date.now();
    console.log('⏳ [Twitter API] Making fetch request...');
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
      cache: 'no-store', // Ensure fresh data
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  [Twitter API] Request completed in ${duration}ms`);
    
    // Log response details
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Get the response text (don't parse JSON yet)
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    // Try to parse it
    let responseJson: any = null;
    try {
      responseJson = JSON.parse(responseText);
      console.log('Parsed data:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Failed to parse response as JSON');
    }

    if (!response.ok) {
      const errorText = responseText || 'Could not read error response';
      let errorJson: any = responseJson;
      
      console.error('❌ [Twitter API] Response NOT OK');
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      console.error('Response body (text):', errorText);
      
      if (errorJson) {
        console.error('Response body (JSON):', JSON.stringify(errorJson, null, 2));
      }
      
      // Handle 404 Not Found errors specifically
      if (response.status === 404) {
        const error = new Error(
          `Endpoint not found (404): The endpoint "${url}" does not exist. ` +
          `Please check the TwitterAPI.io documentation for the correct endpoint URL. ` +
          `Error details: ${errorText}`
        );
        (error as any).statusCode = 404;
        (error as any).isNotFound = true;
        (error as any).endpoint = url;
        console.error('❌ [Twitter API] 404 Error - Endpoint not found');
        console.error('💡 [Twitter API] Possible endpoint variations to try:');
        console.error('   - https://api.twitterapi.io/trend/get_trends');
        console.error('   - https://api.twitterapi.io/twitter/trends');
        console.error('   - https://api.twitterapi.io/trends');
        console.error('   - Check docs: https://docs.twitterapi.io');
        throw error;
      }
      
      // Handle 429 Rate Limit errors specifically
      if (response.status === 429) {
        const rateLimitMessage = errorJson?.message || 
          'Rate limit exceeded. Free tier allows 1 request every 5 seconds.';
        const error = new Error(
          `Rate limit exceeded: ${rateLimitMessage} Please wait 5 seconds before trying again.`
        );
        // Add rate limit info to error object
        (error as any).statusCode = 429;
        (error as any).isRateLimit = true;
        (error as any).retryAfter = 5; // seconds
        console.error('⏱️  [Twitter API] Rate limit error - wait 5 seconds');
        throw error;
      }
      
      const error = new Error(
        `Twitter API request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
      (error as any).statusCode = response.status;
      console.error('❌ [Twitter API] Throwing error:', error.message);
      throw error;
    }

    // Use the parsed JSON (we already parsed it above)
    if (!responseJson) {
      console.error('Cannot proceed: Response is not valid JSON');
      throw new Error('Response is not valid JSON');
    }
    const data = responseJson;
    console.log('Using parsed JSON data for processing');
    
    // Log the raw response structure for debugging
    console.log('📦 [Twitter API] Raw response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from Twitter API');
    }
    
    // Check response status
    if (data.status !== 'success') {
      console.warn('⚠️  [Twitter API] Response status is not "success":', data.status);
      console.warn('📄 [Twitter API] Message:', data.msg);
    }
    
    // Extract trends array
    const trends: Trend[] = data.trends && Array.isArray(data.trends) ? data.trends : [];
    
    console.log('✅ [Twitter API] Successfully fetched trending topics');
    console.log('📊 [Twitter API] Response status:', data.status);
    console.log('📊 [Twitter API] Number of trends:', trends.length);
    
    if (trends.length > 0) {
      console.log('🔝 [Twitter API] Top 3 trends:', 
        trends.slice(0, 3).map((t: Trend) => t.name).join(', ')
      );
    }

    // Return in expected format
    return data as TrendResponse;
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error,
      errorType: error?.constructor?.name || typeof error,
    });
    
    // Re-throw with more context if possible
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }
}

/**
 * Fetches user's posts from TwitterAPI.io
 * @param username - Twitter username (without @)
 * @param limit - Maximum number of posts to fetch (default: 100)
 * @returns Array of tweets with full metadata
 */
export async function getUserPosts(username: string, limit: number = 100): Promise<Tweet[]> {
  const apiKey = process.env.TWITTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWITTER_API_KEY is not set in environment variables');
  }

  // Wait for rate limit
  await waitForRateLimit();

  const url = `${API_BASE}/twitter/user/last_tweets?userName=${username}&count=${limit}`;
  console.log(`📡 [Twitter API] Fetching posts for @${username} (limit: ${limit})`);

  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson: any = null;
    
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // Not JSON
    }

    if (response.status === 429) {
      const error = new Error(
        'Rate limit exceeded. Free tier allows 1 request every 5 seconds. Please wait and try again.'
      );
      (error as any).statusCode = 429;
      (error as any).isRateLimit = true;
      throw error;
    }

    if (response.status === 404) {
      const error = new Error(`User @${username} not found`);
      (error as any).statusCode = 404;
      (error as any).isNotFound = true;
      throw error;
    }

    throw new Error(`Failed to fetch posts: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  let data: any;
  
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ [Twitter API] Failed to parse JSON:', e);
    throw new Error('Invalid JSON response from API');
  }

  // Handle different response structures
  const tweets = data?.data?.tweets || data?.tweets || data?.data || (Array.isArray(data) ? data : []);
  
  if (!Array.isArray(tweets)) {
    console.warn('⚠️  [Twitter API] No tweets array found in response');
    return [];
  }

  console.log(`✅ [Twitter API] Successfully fetched ${tweets.length} posts`);
  return tweets;
}

export interface Engager {
  username: string;
  displayName: string;
  followers: number;
  profilePicture?: string;
  engagementType: 'like' | 'retweet' | 'reply';
}

/**
 * Fetches users who engaged with a tweet (likers and retweeters)
 * @param tweetId - Twitter tweet ID
 * @returns Array of top 5 engagers sorted by follower count
 */
export async function getTweetEngagers(tweetId: string): Promise<Engager[]> {
  // #region agent log
  try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:275',message:'getTweetEngagers entry',data:{tweetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  const apiKey = process.env.TWITTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWITTER_API_KEY is not set in environment variables');
  }

  const engagers: Engager[] = [];

  try {
    // Fetch likers - try multiple endpoint patterns
    await waitForRateLimit();
    const possibleLikersUrls = [
      `${API_BASE}/twitter/tweet/likers?tweetId=${tweetId}`,
      `${API_BASE}/twitter/tweet/likers?id=${tweetId}`,
      `${API_BASE}/twitter/tweet/${tweetId}/likers`,
      `${API_BASE}/twitter/tweet/get_tweet_likers?id=${tweetId}`,
      `${API_BASE}/twitter/tweet/get_likers?tweetId=${tweetId}`,
    ];

    let likersResponse: Response | null = null;
    let likersUrl = '';
    
    for (const url of possibleLikersUrls) {
      likersUrl = url;
      console.log(`📡 [Twitter API] Trying likers endpoint: ${likersUrl}`);
      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:290',message:'trying likers endpoint',data:{tweetId,url:likersUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion

      likersResponse = await fetch(likersUrl, {
        headers: {
          'X-API-Key': apiKey,
        },
        cache: 'no-store',
      });

      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:300',message:'likers endpoint response',data:{tweetId,url:likersUrl,status:likersResponse.status,ok:likersResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion

      if (likersResponse.ok) {
        console.log(`✅ [Twitter API] Found working likers endpoint: ${likersUrl}`);
        break; // Found working endpoint
      }
      
      if (likersResponse.status !== 404) {
        // If it's not 404, it might be a different error (401, 403, etc.) - log and continue
        console.log(`⚠️  [Twitter API] Endpoint ${likersUrl} returned ${likersResponse.status}`);
      }
    }

    if (!likersResponse || !likersResponse.ok) {
      console.warn(`⚠️  [Twitter API] No working likers endpoint found for tweet ${tweetId}`);
      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:315',message:'no working likers endpoint',data:{tweetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion
    } else {
      // Process successful response
      const responseText = await likersResponse.text();
      console.log(`📡 [Twitter API] Likers response (first 500 chars): ${responseText.substring(0, 500)}`);
      
      let likersData: any;
      try {
        likersData = JSON.parse(responseText);
      } catch (e) {
        console.error(`❌ [Twitter API] Failed to parse likers JSON:`, e);
        throw new Error('Invalid JSON response');
      }

      console.log(`📡 [Twitter API] Likers data keys:`, Object.keys(likersData || {}));
      
      const users = likersData?.data?.users || likersData?.users || likersData?.data || (Array.isArray(likersData) ? likersData : []);
      console.log(`📡 [Twitter API] Found ${users.length} likers`);
      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:330',message:'likers users array',data:{usersLength:users.length,dataKeys:Object.keys(likersData||{}),tweetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})+'\n');}catch(e){}
      // #endregion
      
      for (const user of users) {
        const followers = user.followers_count || user.followers || user.public_metrics?.followers_count || 0;
        engagers.push({
          username: user.username || user.screen_name || user.userName || '',
          displayName: user.name || user.display_name || user.displayName || '',
          followers,
          profilePicture: user.profile_image_url || user.profile_picture || user.profilePicture,
          engagementType: 'like',
        });
      }
    }
  } catch (error: any) {
    console.warn(`⚠️  Error fetching likers for tweet ${tweetId}:`, error);
    // #region agent log
    try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:340',message:'likers fetch exception',data:{tweetId,error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})+'\n');}catch(e){}
    // #endregion
  }

  try {
    // Fetch retweeters - try multiple endpoint patterns
    await waitForRateLimit();
    const possibleRetweetersUrls = [
      `${API_BASE}/twitter/tweet/retweeters?tweetId=${tweetId}`,
      `${API_BASE}/twitter/tweet/retweeters?id=${tweetId}`,
      `${API_BASE}/twitter/tweet/${tweetId}/retweeters`,
      `${API_BASE}/twitter/tweet/get_tweet_retweeters?id=${tweetId}`,
      `${API_BASE}/twitter/tweet/get_retweeters?tweetId=${tweetId}`,
    ];

    let retweetersResponse: Response | null = null;
    let retweetersUrl = '';
    
    for (const url of possibleRetweetersUrls) {
      retweetersUrl = url;
      console.log(`📡 [Twitter API] Trying retweeters endpoint: ${retweetersUrl}`);
      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:360',message:'trying retweeters endpoint',data:{tweetId,url:retweetersUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion

      retweetersResponse = await fetch(retweetersUrl, {
        headers: {
          'X-API-Key': apiKey,
        },
        cache: 'no-store',
      });

      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:370',message:'retweeters endpoint response',data:{tweetId,url:retweetersUrl,status:retweetersResponse.status,ok:retweetersResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion

      if (retweetersResponse.ok) {
        console.log(`✅ [Twitter API] Found working retweeters endpoint: ${retweetersUrl}`);
        break; // Found working endpoint
      }
      
      if (retweetersResponse.status !== 404) {
        console.log(`⚠️  [Twitter API] Endpoint ${retweetersUrl} returned ${retweetersResponse.status}`);
      }
    }

    if (!retweetersResponse || !retweetersResponse.ok) {
      console.warn(`⚠️  [Twitter API] No working retweeters endpoint found for tweet ${tweetId}`);
      // #region agent log
      try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:385',message:'no working retweeters endpoint',data:{tweetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})+'\n');}catch(e){}
      // #endregion
    } else {

      // Process successful response
      const responseText = await retweetersResponse.text();
      console.log(`📡 [Twitter API] Retweeters response (first 500 chars): ${responseText.substring(0, 500)}`);
      
      let retweetersData: any;
      try {
        retweetersData = JSON.parse(responseText);
      } catch (e) {
        console.error(`❌ [Twitter API] Failed to parse retweeters JSON:`, e);
        throw new Error('Invalid JSON response');
      }

      console.log(`📡 [Twitter API] Retweeters data keys:`, Object.keys(retweetersData || {}));
      
      const users = retweetersData?.data?.users || retweetersData?.users || retweetersData?.data || (Array.isArray(retweetersData) ? retweetersData : []);
      console.log(`📡 [Twitter API] Found ${users.length} retweeters`);
      
      for (const user of users) {
        const followers = user.followers_count || user.followers || user.public_metrics?.followers_count || 0;
        engagers.push({
          username: user.username || user.screen_name || user.userName || '',
          displayName: user.name || user.display_name || user.displayName || '',
          followers,
          profilePicture: user.profile_image_url || user.profile_picture || user.profilePicture,
          engagementType: 'retweet',
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error fetching retweeters for tweet ${tweetId}:`, error);
  }

  // Remove duplicates and sort by follower count, return top 5
  const uniqueEngagers = engagers.reduce((acc, engager) => {
    const existing = acc.find(e => e.username === engager.username);
    if (!existing) {
      acc.push(engager);
    } else if (engager.followers > existing.followers) {
      // Update if this one has more followers
      const index = acc.indexOf(existing);
      acc[index] = engager;
    }
    return acc;
  }, [] as Engager[]);

  const result = uniqueEngagers
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 5);

  console.log(`✅ [Twitter API] Returning ${result.length} engagers for tweet ${tweetId}`);
  // #region agent log
  try{const{appendFile}=await import('fs/promises');const{join}=await import('path');await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'client.ts:410',message:'getTweetEngagers exit',data:{tweetId,engagersCount:result.length,engagers:result.map(e=>({username:e.username,followers:e.followers}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  return result;
}
