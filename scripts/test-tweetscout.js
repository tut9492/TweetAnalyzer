// Test script to discover TweetScout API endpoint structure
const fs = require('fs');
const path = require('path');

let TWEETSCOUT_API_KEY = process.env.TWEETSCOUT_API_KEY || 'YOUR_KEY_HERE';

// Try to load from .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/TWEETSCOUT_API_KEY=(.+)/);
    if (match && match[1]) {
      TWEETSCOUT_API_KEY = match[1].trim();
    }
  }
} catch (e) {
  console.log('Note: Could not read .env.local');
}

async function testTweetScoutEndpoint(tweetId) {
  const baseUrl = 'https://api.tweetscout.io/v2';
  const endpoints = [
    `/tweets/${tweetId}/engagers`,
    `/tweets/${tweetId}/engagement`,
    `/tweets/${tweetId}/analytics`,
    `/tweet/${tweetId}/engagers`,
    `/engagement/${tweetId}`,
  ];

  console.log(`\n🧪 Testing TweetScout API for tweet: ${tweetId}\n`);
  console.log(`Using API Key: ${TWEETSCOUT_API_KEY.substring(0, 10)}...\n`);

  if (TWEETSCOUT_API_KEY === 'YOUR_KEY_HERE' || !TWEETSCOUT_API_KEY) {
    console.error('❌ Error: TweetScout API key not set!');
    console.error('Please set TWEETSCOUT_API_KEY in .env.local');
    return;
  }

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`\n=== Testing: ${endpoint} ===`);
    
    // Try Bearer token first
    try {
      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TWEETSCOUT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      // If 401, try X-API-Key
      if (response.status === 401) {
        console.log('Bearer token failed, trying X-API-Key...');
        response = await fetch(url, {
          headers: {
            'X-API-Key': TWEETSCOUT_API_KEY,
            'Content-Type': 'application/json',
          },
        });
      }

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS! Response structure:');
        console.log(JSON.stringify(data, null, 2).substring(0, 2000));
        console.log('\nKeys:', Object.keys(data));
        if (data.data) {
          console.log('Data keys:', Object.keys(data.data));
        }
        return data; // Found working endpoint!
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }

  console.log('\n❌ No working endpoint found. Check TweetScout API documentation.');
  console.log('Visit: https://api.tweetscout.io/v2/docs/');
}

// Test with a known tweet ID
const testTweetId = process.argv[2] || '1234567890';
if (testTweetId === '1234567890') {
  console.log('⚠️  Please provide a tweet ID as an argument:');
  console.log('   node scripts/test-tweetscout.js <tweet_id>');
  console.log('\nExample:');
  console.log('   node scripts/test-tweetscout.js 1234567890123456789');
} else {
  testTweetScoutEndpoint(testTweetId);
}




