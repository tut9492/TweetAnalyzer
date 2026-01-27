let lastRequestTime = 0;
const MIN_DELAY = 5000; // 5 seconds for free tier

export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_DELAY) {
    const waitTime = MIN_DELAY - timeSinceLastRequest;
    console.log(`⏱️  Rate limit: waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}




