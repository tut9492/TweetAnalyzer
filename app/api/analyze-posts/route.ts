import { NextRequest, NextResponse } from 'next/server';
import { getUserPosts, getTweetEngagers } from '@/lib/twitter/client';
import { analyzePosts } from '@/lib/analysis/post-analyzer';
import { extractUsername } from '@/lib/twitter/analyze-client';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, limit, includeEngagers = false } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = extractUsername(username);
    console.log(`📊 [Analyze Posts] Starting analysis for @${cleanUsername}`);

    // Get TweetScout API key if engagers are requested
    const tweetscoutApiKey = includeEngagers 
      ? process.env.TWEETSCOUT_API_KEY 
      : undefined;

    if (includeEngagers && !tweetscoutApiKey) {
      return NextResponse.json(
        { error: 'TWEETSCOUT_API_KEY not configured. Set it in .env.local to use this feature.' },
        { status: 400 }
      );
    }

    // Fetch posts
    const tweets = await getUserPosts(cleanUsername, limit || 100);

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: `No posts found for @${cleanUsername}` },
        { status: 404 }
      );
    }

    // Analyze posts (now async)
    const analysis = await analyzePosts(tweets, tweetscoutApiKey, true); // true = only top 10 posts get engagers

    // Identify top 10 posts by total engagement
    const topPosts = [...analysis.posts]
      .sort((a, b) => b.metrics.totalEngagement - a.metrics.totalEngagement)
      .slice(0, 10);

    console.log(`📊 [Analyze Posts] Fetching engagers for top 10 posts...`);
    // #region agent log
    try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:52',message:'starting engagers fetch',data:{topPostsCount:topPosts.length,firstPostId:topPosts[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})+'\n');}catch(e){}
    // #endregion

    // Fetch engagers for top 10 posts
    for (let i = 0; i < topPosts.length; i++) {
      const post = topPosts[i];
      try {
        console.log(`📊 [Analyze Posts] Fetching engagers for post ${i + 1}/10: ${post.id}`);
        // #region agent log
        try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:61',message:'before getTweetEngagers call',data:{postId:post.id,index:i},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
        const engagers = await getTweetEngagers(post.id);
        console.log(`📊 [Analyze Posts] Got ${engagers.length} engagers for post ${post.id}`);
        // #region agent log
        try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:66',message:'after getTweetEngagers call',data:{postId:post.id,engagersCount:engagers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
        
        // Find the post in analysis and add engagers
        const postIndex = analysis.posts.findIndex(p => p.id === post.id);
        // #region agent log
        try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:73',message:'before attaching engagers',data:{postId:post.id,postIndex,engagersCount:engagers.length,postsLength:analysis.posts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})+'\n');}catch(e){}
        // #endregion
        if (postIndex !== -1) {
          analysis.posts[postIndex].engagers = engagers;
          console.log(`✅ [Analyze Posts] Added engagers to post at index ${postIndex}`);
          // #region agent log
          try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:78',message:'after attaching engagers',data:{postId:post.id,postIndex,engagersCount:engagers.length,hasEngagers:!!analysis.posts[postIndex].engagers},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})+'\n');}catch(e){}
          // #endregion
        } else {
          console.warn(`⚠️  Could not find post ${post.id} in analysis.posts`);
        }
      } catch (error: any) {
        console.error(`❌ Could not fetch engagers for post ${post.id}:`, error?.message || error);
      }
    }

    console.log(`✅ [Analyze Posts] Analysis complete: ${analysis.posts.length} posts analyzed`);
    // #region agent log
    const postsWithEngagers = analysis.posts.filter(p => p.engagers && p.engagers.length > 0);
    try{await appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'route.ts:91',message:'before sending response',data:{totalPosts:analysis.posts.length,postsWithEngagers:postsWithEngagers.length,engagersSample:postsWithEngagers.slice(0,2).map(p=>({id:p.id,engagersCount:p.engagers?.length||0}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})+'\n');}catch(e){}
    // #endregion

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('❌ [Analyze Posts] Error:', error);

    if (error.statusCode === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 5 seconds and try again.' },
        { status: 429 }
      );
    }

    if (error.statusCode === 404 || error.isNotFound) {
      return NextResponse.json(
        { error: error.message || 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze posts' },
      { status: 500 }
    );
  }
}

