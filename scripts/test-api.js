/**
 * Simple test script to test TwitterAPI.io directly
 * Usage: node scripts/test-api.js
 * 
 * Make sure to set your API key in .env.local first, or replace YOUR_API_KEY_HERE below
 */

// Try to load from .env.local if dotenv is available
let API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual key

// Try to read from .env.local manually (simple approach)
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
      console.log('🔑 API key preview:', API_KEY.substring(0, 10) + '...');
    } else {
      console.log('⚠️  .env.local exists but TWITTER_API_KEY not found');
      console.log('💡 Please set YOUR_API_KEY_HERE in this file or add TWITTER_API_KEY to .env.local');
    }
  } else {
    console.log('⚠️  .env.local not found');
    console.log('💡 Please set YOUR_API_KEY_HERE in this file or create .env.local');
  }
} catch (error) {
  console.log('⚠️  Could not read .env.local:', error.message);
  console.log('💡 Please set YOUR_API_KEY_HERE in this file');
}

async function testAPI() {
  // WOEID (Where On Earth ID) - 1 = Worldwide, 23424977 = United States
  // See: https://gist.github.com/tedyblood/5bb5a9f78314cc1f478b3dd7cde790b9
  const WOEID = process.env.TWITTER_WOEID || '1'; // Default to Worldwide
  
  console.log('\n🧪 Testing TwitterAPI.io...\n');
  console.log('📡 URL: https://api.twitterapi.io/twitter/trends?woeid=' + WOEID);
  console.log('🌍 WOEID:', WOEID, WOEID === '1' ? '(Worldwide)' : WOEID === '23424977' ? '(United States)' : '');
  console.log('🔑 API Key:', API_KEY === 'YOUR_API_KEY_HERE' ? 'NOT SET' : API_KEY.substring(0, 10) + '...');
  console.log('📋 Header: X-API-Key\n');
  
  if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
    console.error('❌ Error: API key not set!');
    console.log('\nTo fix:');
    console.log('1. Open scripts/test-api.js');
    console.log('2. Replace YOUR_API_KEY_HERE with your actual API key');
    console.log('OR');
    console.log('1. Add TWITTER_API_KEY=your_key to .env.local');
    return;
  }

  try {
    const startTime = Date.now();
    
    console.log('⏳ Making request...\n');
    
    const response = await fetch(`https://api.twitterapi.io/twitter/trends?woeid=${WOEID}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });

    const duration = Date.now() - startTime;
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);
    console.log('⏱️  Request Duration:', duration + 'ms');
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request Failed!');
      console.error('📄 Error Response Body:', errorText);
      
      // Try to parse as JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('📄 Error Response (JSON):', JSON.stringify(errorJson, null, 2));
      } catch {
        // Not JSON, that's fine
      }
      
      return;
    }

    const data = await response.json();
    
    console.log('✅ Request Successful!\n');
    console.log('📦 Response Data Structure:');
    console.log('   - Type:', typeof data);
    console.log('   - Is Array:', Array.isArray(data));
    console.log('   - Keys:', Object.keys(data));
    console.log('');
    
    // Handle different response formats
    let trends = [];
    if (data.data && Array.isArray(data.data)) {
      trends = data.data;
      console.log('📊 Found trends in data.data:', trends.length);
    } else if (Array.isArray(data)) {
      trends = data;
      console.log('📊 Found trends as direct array:', trends.length);
    } else if (data.trends && Array.isArray(data.trends)) {
      trends = data.trends;
      console.log('📊 Found trends in data.trends:', trends.length);
    } else {
      console.log('⚠️  Unexpected response format');
    }
    
    if (trends.length > 0) {
      console.log('\n🔝 Top 5 Trends:');
      trends.slice(0, 5).forEach((trend, index) => {
        console.log(`   ${index + 1}. ${trend.name || trend.trend || 'Unknown'}`);
        if (trend.tweet_count) console.log(`      Tweet Count: ${trend.tweet_count}`);
        if (trend.tweet_volume) console.log(`      Tweet Volume: ${trend.tweet_volume}`);
      });
    }
    
    console.log('\n📄 Full Response (first 2000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
    if (JSON.stringify(data, null, 2).length > 2000) {
      console.log('... (truncated)');
    }
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('   Type:', error?.constructor?.name || typeof error);
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    
    // Check for common issues
    if (error.message.includes('fetch')) {
      console.error('\n💡 This might be a network error. Check your internet connection.');
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 DNS or connection error. Check if the API endpoint is correct.');
    }
  }
}

// Run the test
testAPI();

