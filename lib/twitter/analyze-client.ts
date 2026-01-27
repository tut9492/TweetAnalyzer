import { Tweet, UserTweetsResponse, UserProfile } from './analyze-types';

const API_BASE = 'https://api.twitterapi.io';
const RATE_LIMIT_DELAY = 5500; // 5.5 seconds between requests (slightly more than 5 to be safe)

/**
 * Sleep/delay function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extracts username from URL or returns username if already clean
 */
export function extractUsername(input: string): string {
  // Remove @ if present
  let username = input.replace('@', '').trim();
  
  // Extract from URL if it's a full URL
  const urlMatch = username.match(/twitter\.com\/([^\/\?]+)/i) || 
                   username.match(/x\.com\/([^\/\?]+)/i);
  if (urlMatch) {
    username = urlMatch[1];
  }
  
  return username;
}

/**
 * Fetches user profile information with rate limit handling
 */
export async function getUserProfile(username: string, retryCount: number = 0): Promise<UserProfile> {
  const apiKey = process.env.TWITTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWITTER_API_KEY is not set');
  }

  const url = `${API_BASE}/twitter/user/info?userName=${username}`;
  console.log('Fetching user profile from:', url);

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
      // Not JSON, that's fine
    }

    // Handle rate limit (429) with retry
    if (response.status === 429 && retryCount < 2) {
      const waitTime = RATE_LIMIT_DELAY * (retryCount + 1);
      console.log(`⏱️  Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}...`);
      await sleep(waitTime);
      return getUserProfile(username, retryCount + 1);
    }

    if (response.status === 429) {
      const error = new Error(
        'Rate limit exceeded. Free tier allows 1 request every 5 seconds. Please wait a moment and try again.'
      );
      (error as any).statusCode = 429;
      (error as any).isRateLimit = true;
      throw error;
    }

    throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Fetches user's last tweets with rate limit handling
 */
export async function getUserTweets(username: string, count: number = 100, retryCount: number = 0): Promise<Tweet[]> {
  const apiKey = process.env.TWITTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWITTER_API_KEY is not set');
  }

  const url = `${API_BASE}/twitter/user/last_tweets?userName=${username}&count=${count}`;
  console.log('Fetching user tweets from:', url);

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
      // Not JSON, that's fine
    }

    // Handle rate limit (429) with retry
    if (response.status === 429 && retryCount < 2) {
      const waitTime = RATE_LIMIT_DELAY * (retryCount + 1);
      console.log(`⏱️  Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}...`);
      await sleep(waitTime);
      return getUserTweets(username, count, retryCount + 1);
    }

    if (response.status === 429) {
      const error = new Error(
        'Rate limit exceeded. Free tier allows 1 request every 5 seconds. Please wait a moment and try again.'
      );
      (error as any).statusCode = 429;
      (error as any).isRateLimit = true;
      throw error;
    }

    throw new Error(`Failed to fetch user tweets: ${response.status} ${errorText}`);
  }

  const responseText = await response.text();
  console.log('📄 [Twitter API] Raw response text:', responseText.substring(0, 500));
  
  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ [Twitter API] Failed to parse JSON:', e);
    throw new Error('Invalid JSON response from API');
  }
  
  console.log('===== API RESPONSE (getUserTweets) =====');
  console.log('Status:', response.status);
  console.log('Status OK:', response.ok);
  console.log('Data type:', typeof data);
  console.log('Data keys:', Object.keys(data || {}));
  console.log('Data.data exists:', !!data?.data);
  console.log('Data.data.tweets exists:', !!data?.data?.tweets);
  console.log('Data.tweets exists:', !!data?.tweets);
  console.log('Is data an array?', Array.isArray(data));
  console.log('Data.data.tweets length:', data?.data?.tweets?.length);
  console.log('Data.tweets length:', data?.tweets?.length);
  if (data?.data?.tweets?.[0]) {
    console.log('First tweet (from data.data.tweets):', JSON.stringify(data.data.tweets[0], null, 2).substring(0, 500));
  } else if (data?.tweets?.[0]) {
    console.log('First tweet (from data.tweets):', JSON.stringify(data.tweets[0], null, 2).substring(0, 500));
  } else if (data?.data?.[0]) {
    console.log('First tweet (from data.data):', JSON.stringify(data.data[0], null, 2).substring(0, 500));
  } else if (Array.isArray(data) && data[0]) {
    console.log('First tweet (from array):', JSON.stringify(data[0], null, 2).substring(0, 500));
  }
  console.log('Full response structure (keys only):', JSON.stringify(Object.keys(data || {}), null, 2));
  if (data?.data) {
    console.log('Data.data keys:', Object.keys(data.data));
  }
  console.log('=======================');
  
  // Try different ways to access the tweets (API returns: { status, data: { tweets: [...] } })
  const tweets = data?.data?.tweets || data?.tweets || data?.data || (Array.isArray(data) ? data : []);
  
  // Check if tweets exists and is an array
  if (!tweets || !Array.isArray(tweets)) {
    console.warn('⚠️  [Twitter API] No tweets array found in response');
    console.warn('Available keys:', Object.keys(data || {}));
    return [];
  }
  
  console.log(`✅ [Twitter API] Successfully extracted ${tweets.length} tweets`);
  return tweets;
}

