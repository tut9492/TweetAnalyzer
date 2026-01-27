// Try to read from .env.local manually (simple approach)
let API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual key

try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/TWITTER_API_KEY=(.+)/);
    if (match && match[1]) {
      API_KEY = match[1].trim();
      console.log('✅ Loaded API key from .env.local');
    }
  }
} catch (e) {
  console.log('Note: Could not read .env.local, using default or process.env');
}

// Override with process.env if available
API_KEY = process.env.TWITTER_API_KEY || API_KEY;

async function testUserTweets(username) {
  console.log(`\n=== Testing user: ${username} ===`);
  
  if (API_KEY === 'YOUR_KEY_HERE' || !API_KEY) {
    console.error('❌ Error: API key not set!');
    console.error('Please set TWITTER_API_KEY in .env.local');
    return;
  }
  
  try {
    const url = `https://api.twitterapi.io/twitter/user/last_tweets?userName=${username}`;
    console.log('URL:', url);
    console.log('API Key:', API_KEY.substring(0, 10) + '...');
    
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: { 'X-API-Key': API_KEY }
    });
    const duration = Date.now() - startTime;
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Time:', duration + 'ms');
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\n=== Raw Response (first 2000 chars) ===');
    console.log(text.substring(0, 2000));
    if (text.length > 2000) {
      console.log(`\n... (truncated, total length: ${text.length} chars)`);
    }
    
    if (!response.ok) {
      console.error('\n❌ Request failed!');
      console.error('Error response:', text);
      return;
    }
    
    try {
      const data = JSON.parse(text);
      console.log('\n=== Parsed JSON Structure ===');
      console.log('Type:', typeof data);
      console.log('Is Array?', Array.isArray(data));
      console.log('Keys:', Object.keys(data));
      
      // Check different possible structures
      console.log('\n=== Structure Check ===');
      console.log('data.tweets exists?', !!data.tweets);
      console.log('data.tweets is array?', Array.isArray(data.tweets));
      console.log('data.tweets length:', data.tweets?.length);
      
      console.log('data.data exists?', !!data.data);
      console.log('data.data is array?', Array.isArray(data.data));
      console.log('data.data length:', data.data?.length);
      
      console.log('data.result exists?', !!data.result);
      console.log('data.result is array?', Array.isArray(data.result));
      console.log('data.result length:', data.result?.length);
      
      // Show first tweet if available
      const firstTweet = data.tweets?.[0] || data.data?.[0] || data.result?.[0] || (Array.isArray(data) ? data[0] : null);
      
      if (firstTweet) {
        console.log('\n=== First Tweet Sample ===');
        console.log(JSON.stringify(firstTweet, null, 2));
        console.log('\nFirst tweet keys:', Object.keys(firstTweet));
      } else {
        console.log('\n⚠️  No tweets found in any expected location');
      }
      
      // Show full structure (limited)
      console.log('\n=== Full Response Structure (limited) ===');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000));
      if (JSON.stringify(data, null, 2).length > 2000) {
        console.log(`\n... (truncated)`);
      }
      
    } catch (e) {
      console.error('\n❌ JSON parse error:', e.message);
      console.error('Response might not be valid JSON');
    }
    
  } catch (error) {
    console.error('\n❌ Fetch error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test with a known active account
console.log('🧪 Testing TwitterAPI.io User Tweets Endpoint\n');
console.log('Make sure TWITTER_API_KEY is set in .env.local\n');

const testUsername = process.argv[2] || 'elonmusk';
testUserTweets(testUsername);

