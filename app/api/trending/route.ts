import { NextResponse } from 'next/server';
import { getTrendingTopics } from '@/lib/twitter/client';

export interface TopicWithMetrics {
  rank: number;
  name: string;
  tweetVolume: number;
  totalImpressions: number;
  avgEngagement: number;
}

export interface TrendingApiResponse {
  topics: TopicWithMetrics[];
}

/**
 * GET /api/trending
 * Returns top 10 trending topics with metrics
 */
export async function GET() {
  console.log('🚀 [API] /api/trending endpoint called');
  console.log('⏰ [API] Timestamp:', new Date().toISOString());
  
  // Comprehensive debugging before API call
  console.log('=== API CALL DEBUG ===');
  const apiKey = process.env.TWITTER_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  console.log('Full URL:', 'https://api.twitterapi.io/twitter/trends?woeid=1');
  console.log('API Key first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
  
  if (apiKey) {
    const keyPreview = apiKey.length >= 10 ? apiKey.substring(0, 10) + '...' : '***';
    console.log('✅ [API] TWITTER_API_KEY is loaded:', keyPreview);
    console.log('📏 [API] API key length:', apiKey.length);
  } else {
    console.error('❌ [API] TWITTER_API_KEY is NOT loaded from environment');
    console.log('🔍 [API] All env vars starting with TWITTER:', 
      Object.keys(process.env).filter(k => k.startsWith('TWITTER'))
    );
  }
  
  try {
    // 2. Inside try block - log fetch attempt
    console.log('Fetching from TwitterAPI.io...');
    console.log('📞 [API] Calling getTrendingTopics()...');
    const rawData = await getTrendingTopics();
    console.log('✅ [API] getTrendingTopics() completed successfully');
    
    if (!rawData) {
      console.error('❌ [API] rawData is null or undefined');
      return NextResponse.json(
        { error: 'No data returned from Twitter API', topics: [] },
        { status: 500 }
      );
    }
    
    console.log('📦 [API] rawData structure:', {
      hasTrends: !!rawData.trends,
      isArray: Array.isArray(rawData.trends),
      trendsLength: rawData.trends?.length || 0,
      status: rawData.status,
      keys: Object.keys(rawData),
    });
    
    if (!rawData.trends || !Array.isArray(rawData.trends)) {
      console.warn('⚠️  [API] Invalid response structure from Twitter API');
      console.log('📄 [API] Full rawData:', JSON.stringify(rawData, null, 2));
      return NextResponse.json(
        { error: 'Invalid response structure from Twitter API', topics: [] },
        { status: 500 }
      );
    }

    // Log the first trend to see the structure
    if (rawData.trends && rawData.trends.length > 0) {
      console.log('📋 [API] Sample trend structure (first item):');
      console.log(JSON.stringify(rawData.trends[0], null, 2));
      console.log('📋 [API] Available fields in first trend:', Object.keys(rawData.trends[0]));
    }
    
    // Sort by rank and limit to top 10
    const sortedTrends = [...rawData.trends].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const top10Trends = sortedTrends.slice(0, 10);
    console.log(`📊 [API] Processing ${top10Trends.length} trends (limited to top 10)`);
    
    // Map the response correctly according to TwitterAPI.io structure
    const topics: TopicWithMetrics[] = top10Trends.map((trend, index) => {
      // Use the rank from API response, or fallback to index + 1
      const rank = trend.rank || (index + 1);
      
      // Extract topic name from trend.name (as per TwitterAPI.io docs)
      const topicName = trend.name || 'Unknown';
      
      console.log(`📝 [API] Trend #${rank}: name="${trend.name}", target.query="${trend.target?.query || 'N/A'}", meta_description="${trend.meta_description?.substring(0, 50) || 'N/A'}..."`);
      
      // Mock tweet volume (API doesn't provide this in the response)
      // Using a more realistic range based on rank
      const baseVolume = 10000 - (rank * 500);
      const tweetVolume = Math.max(1000, baseVolume + Math.floor(Math.random() * 5000));
      
      // Mock calculations for impressions and engagement
      const totalImpressions = tweetVolume * 500; // Estimate: 500 impressions per tweet
      const avgEngagement = Math.floor(tweetVolume * 0.1) + Math.floor(Math.random() * 1000); // Estimate: 10% engagement rate
      
      return {
        rank: rank,
        name: topicName,
        tweetVolume,
        totalImpressions,
        avgEngagement,
      };
    });

    console.log(`✅ [API] Returning ${topics.length} trending topics`);
    
    const response: TrendingApiResponse = {
      topics,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Detailed error logging
    console.error('❌ [API] Error in /api/trending');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error,
      errorType: error?.constructor?.name || typeof error,
    });
    
    if (error instanceof Error) {
      console.error('📚 [API] Error stack:', error.stack);
      
      // Check if it's a fetch error
      if (error.message.includes('fetch')) {
        console.error('🌐 [API] This appears to be a network/fetch error');
      }
      
      // Check if it's an API key error
      if (error.message.includes('TWITTER_API_KEY')) {
        console.error('🔑 [API] API key related error detected');
      }
    }
    
    // Try to extract more details if it's a response error
    if (error && typeof error === 'object' && 'response' in error) {
      const responseError = error as any;
      console.error('📡 [API] Response error details:', {
        status: responseError.response?.status,
        statusText: responseError.response?.statusText,
        body: responseError.response?.body,
      });
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error) || 'Failed to fetch trending topics';
    
    console.error('📤 [API] Returning error response:', errorMessage);
    
    // Return detailed error to frontend
    return NextResponse.json(
      { 
        error: 'Fetch failed',
        details: errorMessage,
        topics: [],
        debug: {
          timestamp: new Date().toISOString(),
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
          errorType: error?.constructor?.name || typeof error,
        }
      },
      { status: 500 }
    );
  }
}
