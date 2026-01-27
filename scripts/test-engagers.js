// Test script to check TwitterAPI.io engagers endpoints
const fs = require('fs');
const path = require('path');

let API_KEY = process.env.TWITTER_API_KEY || 'YOUR_KEY_HERE';

// Try to load from .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/TWITTER_API_KEY=(.+)/);
    if (match && match[1]) {
      API_KEY = match[1].trim();
    }
  }
} catch (e) {}

const API_BASE = 'https://api.twitterapi.io';

async function testEngagersEndpoints(tweetId) {
  console.log(`\n🧪 Testing engagers endpoints for tweet: ${tweetId}\n`);
  console.log(`Using API Key: ${API_KEY.substring(0, 10)}...\n`);

  if (API_KEY === 'YOUR_KEY_HERE' || !API_KEY) {
    console.error('❌ Error: API key not set!');
    return;
  }

  // Try different possible endpoint patterns
  const endpoints = [
    `/twitter/tweet/get_tweet_likers?id=${tweetId}`,
    `/twitter/tweet/get_tweet_retweeters?id=${tweetId}`,
    `/twitter/tweet/likers?tweetId=${tweetId}`,
    `/twitter/tweet/retweeters?tweetId=${tweetId}`,
    `/twitter/tweet/${tweetId}/likers`,
    `/twitter/tweet/${tweetId}/retweeters`,
  ];

  for (const endpoint of endpoints) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`\n=== Testing: ${endpoint} ===`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`✅ SUCCESS! Response (first 1000 chars):`);
        console.log(text.substring(0, 1000));
        
        try {
          const data = JSON.parse(text);
          console.log('\nParsed JSON keys:', Object.keys(data));
          if (data.data) {
            console.log('Data keys:', Object.keys(data.data));
          }
          if (data.users) {
            console.log('Users array length:', data.users.length);
          }
          if (data.data?.users) {
            console.log('Data.users array length:', data.data.users.length);
          }
        } catch (e) {
          console.log('Could not parse as JSON');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }
}

const testTweetId = process.argv[2];
if (!testTweetId) {
  console.log('Usage: node scripts/test-engagers.js <tweet_id>');
  console.log('Example: node scripts/test-engagers.js 1234567890123456789');
} else {
  testEngagersEndpoints(testTweetId);
}




