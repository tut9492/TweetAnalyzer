import React, { useState, useEffect, useCallback } from 'react';

// Algorithm weights from X's Phoenix algorithm
const ALGORITHM_WEIGHTS = {
  replyWithEngagement: 75.0,
  reply: 13.5,
  profileClick: 12.0,
  goodClick: 11.0,
  dwellTime: 10.0,
  bookmark: 2.0,
  retweet: 1.0,
  quote: 1.0,
  like: 0.5,
  negativeFeedback: -74.0,
  report: -369.0,
};

// Content type multipliers
const CONTENT_MULTIPLIERS = {
  video: 1.5,
  thread: 1.4,
  poll: 1.3,
  image: 1.2,
  gif: 1.15,
  link: 0.7,
};

// Style profiles with adjustments
const STYLE_PROFILES = {
  general: { name: 'General', adjustments: {} },
  satirical: {
    name: 'Satirical',
    adjustments: { quote: 2, reply: 1, bookmark: -1 },
    riskAdjustments: { block: 1 },
    patterns: ['satire', 'ironic', 'sarcasm', '/s', 'imagine'],
  },
  quoteTweet: {
    name: 'Quote Tweet',
    adjustments: { quote: 2, profileClick: 2 },
    baseMultiplier: 1.5,
    patterns: ['this', 'exactly', 'perfectly', 'wrong', 'disagree'],
  },
  technical: {
    name: 'Technical',
    adjustments: { bookmark: 3, retweet: 2, dwellTime: 2, follow: 2, quote: -1 },
    patterns: ['how to', 'tutorial', 'guide', 'tip:', 'thread:', 'learn', 'api', 'code'],
  },
  longform: {
    name: 'Long-form',
    adjustments: { dwellTime: 4, bookmark: 3, profileClick: 2, follow: 3, reply: -1 },
    patterns: ['thread', '1/', '/1', 'story time', 'let me explain'],
  },
  personal: {
    name: 'Personal',
    adjustments: { reply: 3, quote: 2, profileClick: 3, follow: 3, dwellTime: 2 },
    patterns: ['i ', 'my ', 'me ', 'personal', 'learned', 'realized', 'confession'],
  },
};

// Design system colors
const COLORS = {
  primary: '#DF5830',
  background: '#F5F3F0',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
};

// Shared styles
const STYLES = {
  button: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  inactiveButton: {
    background: COLORS.white,
    color: COLORS.text,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  activeButton: {
    background: COLORS.primary,
    color: COLORS.white,
    boxShadow: '0 4px 14px rgba(223, 88, 48, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  ctaButton: {
    background: COLORS.primary,
    color: COLORS.white,
    boxShadow: '0 6px 24px rgba(223, 88, 48, 0.4), 0 2px 8px rgba(223, 88, 48, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  card: {
    background: COLORS.white,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
};

// Utility functions
function analyzeTweetText(text) {
  const analysis = {
    charCount: text.length,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    hashtagCount: (text.match(/#\w+/g) || []).length,
    mentionCount: (text.match(/@\w+/g) || []).length,
    hasAllCaps: /[A-Z]{4,}/.test(text),
    hasExcessivePunctuation: /[!?]{2,}/.test(text),
    lineBreaks: (text.match(/\n/g) || []).length,
    isChoppy: text.split('\n').filter(l => l.trim()).every(l => l.length < 50),
  };

  return analysis;
}

function calculateSignals(text, style, contentTypes) {
  const textAnalysis = analyzeTweetText(text);
  const styleProfile = STYLE_PROFILES[style] || STYLE_PROFILES.general;

  // Base signals
  let signals = {
    reply: 5,
    retweet: 5,
    quote: 5,
    dwellTime: 5,
    profileClick: 5,
    bookmark: 5,
    follow: 5,
  };

  // Apply style adjustments
  Object.entries(styleProfile.adjustments || {}).forEach(([signal, adjustment]) => {
    if (signals[signal] !== undefined) {
      signals[signal] = Math.max(0, Math.min(10, signals[signal] + adjustment));
    }
  });

  // Apply text quality adjustments
  if (textAnalysis.hasAllCaps) {
    Object.keys(signals).forEach(k => signals[k] *= 0.8);
  }
  if (textAnalysis.hasExcessivePunctuation) {
    Object.keys(signals).forEach(k => signals[k] *= 0.9);
  }
  if (textAnalysis.hashtagCount > 1) {
    Object.keys(signals).forEach(k => signals[k] *= 0.6);
  }

  // Content length bonus
  if (textAnalysis.charCount > 200) {
    signals.dwellTime = Math.min(10, signals.dwellTime + 2);
    signals.bookmark = Math.min(10, signals.bookmark + 1);
  }

  return signals;
}

function calculateRisks(text, style) {
  const styleProfile = STYLE_PROFILES[style] || STYLE_PROFILES.general;

  let risks = {
    block: 2,
    report: 1,
    notInterested: 3,
    offNiche: 2,
  };

  // Apply style risk adjustments
  Object.entries(styleProfile.riskAdjustments || {}).forEach(([risk, adjustment]) => {
    if (risks[risk] !== undefined) {
      risks[risk] = Math.max(0, Math.min(10, risks[risk] + adjustment));
    }
  });

  // Check for risky patterns
  const lowerText = text.toLowerCase();
  if (lowerText.includes('controversial') || lowerText.includes('unpopular opinion')) {
    risks.block += 2;
    risks.report += 1;
  }

  return risks;
}

function calculateCompositeScore(signals, contentTypes) {
  let baseScore = Object.values(signals).reduce((a, b) => a + b, 0) / Object.keys(signals).length;

  // Apply content multipliers
  let multiplier = 1;
  contentTypes.forEach(type => {
    if (CONTENT_MULTIPLIERS[type]) {
      multiplier = Math.max(multiplier, CONTENT_MULTIPLIERS[type]);
    }
  });

  // BUG: Link penalty should subtract, not multiply incorrectly
  if (contentTypes.includes('link')) {
    multiplier = multiplier * CONTENT_MULTIPLIERS.link;
  }

  return Math.min(10, baseScore * multiplier);
}

function generateSuggestions(text, signals, risks, style) {
  const suggestions = [];
  const textAnalysis = analyzeTweetText(text);

  if (textAnalysis.hashtagCount > 1) {
    suggestions.push('Reduce hashtags to 1 or none - multiple hashtags trigger -40% penalty');
  }
  if (textAnalysis.hasAllCaps) {
    suggestions.push('Avoid ALL CAPS words - they trigger deboosts');
  }
  if (textAnalysis.hasExcessivePunctuation) {
    suggestions.push('Reduce excessive punctuation (!!, ??) - triggers deboosts');
  }
  if (signals.dwellTime < 5 && textAnalysis.charCount < 100) {
    suggestions.push('Consider longer content for better dwell time signals');
  }
  if (risks.block > 4) {
    suggestions.push('Content may be too controversial - consider softening language');
  }
  if (textAnalysis.mentionCount > 2) {
    suggestions.push('Too many mentions can look spammy - reduce to 1-2');
  }

  return suggestions;
}

function generatePlaybook(style) {
  const playbooks = {
    general: [
      'Post during peak hours (8-10am, 12-1pm, 7-9pm)',
      'Reply to early comments within first 30 minutes',
      'Avoid editing for first 2 hours',
    ],
    satirical: [
      'Be prepared for misinterpretation - satirical posts have higher block risk',
      'Engage with replies to clarify intent if needed',
      'Consider adding context in a follow-up reply',
      'Best performed when you have established audience trust',
    ],
    quoteTweet: [
      'Add genuine insight, not just agreement',
      'Controversial takes get more quotes but higher risk',
      'Reply to the original author if they engage',
    ],
    technical: [
      'Format with clear structure and spacing',
      'Include actionable takeaways',
      'Reply to questions thoroughly - builds authority',
      'Consider creating a thread for complex topics',
    ],
    longform: [
      'Hook must be compelling in first line',
      'Use line breaks strategically for readability',
      'Number your points for easy reference',
      'Summarize key points at the end',
    ],
    personal: [
      'Authenticity resonates - be genuine',
      'Vulnerability often performs well',
      'Reply thoughtfully to personal responses',
      'Share lessons learned, not just experiences',
    ],
  };

  return playbooks[style] || playbooks.general;
}

function detectStyle(text) {
  const lowerText = text.toLowerCase();

  for (const [key, profile] of Object.entries(STYLE_PROFILES)) {
    if (profile.patterns) {
      const matches = profile.patterns.filter(p => lowerText.includes(p));
      if (matches.length >= 2) {
        return key;
      }
    }
  }

  return 'general';
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

function getTimerColor(seconds) {
  const minutes = seconds / 60;
  if (minutes >= 120) return COLORS.success;
  if (minutes >= 90) return COLORS.warning;
  return COLORS.danger;
}

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('draft');
  const [tweetText, setTweetText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('general');
  const [contentTypes, setContentTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [postTimer, setPostTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Post Analyzer state
  const [metrics, setMetrics] = useState({
    impressions: '',
    likes: '',
    retweets: '',
    replies: '',
    quotes: '',
    bookmarks: '',
    profileVisits: '',
    yourReplies: '',
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  const [fetchingPost, setFetchingPost] = useState(false);
  const [postFetchError, setPostFetchError] = useState('');

  // Analyze Others state
  const [otherTweetText, setOtherTweetText] = useState('');
  const [otherContentTypes, setOtherContentTypes] = useState([]);
  const [otherAnalysis, setOtherAnalysis] = useState(null);
  const [tweetUrl, setTweetUrl] = useState('');
  const [fetchingTweet, setFetchingTweet] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchedMetrics, setFetchedMetrics] = useState(null);


  // History filters
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySort, setHistorySort] = useState('date');

  // Load from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tweetHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedTimer = localStorage.getItem('postTimer');
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      setPostTimer(timer);
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      setTimerSeconds(elapsed);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('tweetHistory', JSON.stringify(history));
  }, [history]);

  // Timer interval - uses functional update to avoid stale closure
  useEffect(() => {
    if (!postTimer) return;

    const interval = setInterval(() => {
      // Use functional update to get current state value
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [postTimer]);

  // Save timer to localStorage
  useEffect(() => {
    if (postTimer) {
      localStorage.setItem('postTimer', JSON.stringify(postTimer));
    } else {
      localStorage.removeItem('postTimer');
    }
  }, [postTimer]);

  const toggleContentType = (type) => {
    setContentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleOtherContentType = (type) => {
    setOtherContentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handlePostThis = () => {
    const timer = {
      startTime: Date.now(),
      tweetText: tweetText,
      style: selectedStyle,
    };
    setPostTimer(timer);
    setTimerSeconds(0);
  };

  const resetTimer = () => {
    setPostTimer(null);
    setTimerSeconds(0);
    localStorage.removeItem('postTimer');
  };

  const analyzePerformance = () => {
    const impressions = parseInt(metrics.impressions) || 0;
    const likes = parseInt(metrics.likes) || 0;
    const retweets = parseInt(metrics.retweets) || 0;
    const replies = parseInt(metrics.replies) || 0;
    const quotes = parseInt(metrics.quotes) || 0;
    const bookmarks = parseInt(metrics.bookmarks) || 0;
    const yourReplies = parseInt(metrics.yourReplies) || 0;

    // === ENGAGEMENT RATES ===
    const engagementRate = impressions > 0
      ? ((likes + retweets + replies + quotes + bookmarks) / impressions * 100)
      : 0;

    const replyRate = impressions > 0 ? (replies / impressions * 100) : 0;
    const retweetRate = impressions > 0 ? (retweets / impressions * 100) : 0;
    const bookmarkRate = impressions > 0 ? (bookmarks / impressions * 100) : 0;
    const quoteRate = impressions > 0 ? (quotes / impressions * 100) : 0;
    const likeRate = impressions > 0 ? (likes / impressions * 100) : 0;

    // === BENCHMARKS (industry averages) ===
    const benchmarks = {
      replyRate: { poor: 0.5, good: 1.0, great: 2.0 },
      retweetRate: { poor: 0.25, good: 0.5, great: 1.0 },
      bookmarkRate: { poor: 0.1, good: 0.2, great: 0.5 },
      quoteRate: { poor: 0.1, good: 0.2, great: 0.4 },
      likeRate: { poor: 1.0, good: 2.0, great: 4.0 },
      engagementRate: { poor: 2.0, good: 4.0, great: 6.0 },
    };

    const getRating = (value, benchmark) => {
      if (value >= benchmark.great) return { label: 'Excellent', color: COLORS.success };
      if (value >= benchmark.good) return { label: 'Good', color: COLORS.primary };
      if (value >= benchmark.poor) return { label: 'Average', color: COLORS.warning };
      return { label: 'Below Avg', color: COLORS.danger };
    };

    const rateBreakdown = {
      replies: { rate: replyRate, rating: getRating(replyRate, benchmarks.replyRate) },
      retweets: { rate: retweetRate, rating: getRating(retweetRate, benchmarks.retweetRate) },
      bookmarks: { rate: bookmarkRate, rating: getRating(bookmarkRate, benchmarks.bookmarkRate) },
      quotes: { rate: quoteRate, rating: getRating(quoteRate, benchmarks.quoteRate) },
      likes: { rate: likeRate, rating: getRating(likeRate, benchmarks.likeRate) },
      overall: { rate: engagementRate, rating: getRating(engagementRate, benchmarks.engagementRate) },
    };

    // === ALGORITHM SCORE BREAKDOWN ===
    const scoreBreakdown = {
      replyEngaged: yourReplies > 0 ? Math.min(replies, yourReplies) * ALGORITHM_WEIGHTS.replyWithEngagement : 0,
      replies: replies * ALGORITHM_WEIGHTS.reply,
      retweets: retweets * ALGORITHM_WEIGHTS.retweet,
      quotes: quotes * ALGORITHM_WEIGHTS.quote,
      likes: likes * ALGORITHM_WEIGHTS.like,
      bookmarks: bookmarks * ALGORITHM_WEIGHTS.bookmark,
    };

    const totalAlgoScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
    const normalizedScore = impressions > 0
      ? Math.min(10, totalAlgoScore / impressions * 100).toFixed(1)
      : '0.0';

    // Calculate percentage contribution of each signal
    const scoreContributions = {};
    Object.entries(scoreBreakdown).forEach(([key, value]) => {
      scoreContributions[key] = totalAlgoScore > 0 ? ((value / totalAlgoScore) * 100).toFixed(1) : 0;
    });

    // === VIRALITY METRICS ===
    const viralityScore = impressions > 0
      ? ((retweets + quotes) / impressions * 1000).toFixed(2)
      : 0;
    const shareability = retweets + quotes;
    const conversationRatio = replies > 0 ? (yourReplies / replies * 100).toFixed(0) : 0;

    // === CONTENT ANALYSIS ===
    const contentInsights = [];
    const textAnalysis = analyzeTweetText(tweetText);

    if (textAnalysis.charCount > 200) contentInsights.push({ text: 'Long-form content boosts dwell time', positive: true });
    if (textAnalysis.charCount < 100) contentInsights.push({ text: 'Short tweet - may lack substance for saves', positive: false });
    if (tweetText.includes('?')) contentInsights.push({ text: 'Question detected - good for replies', positive: true });
    if (!tweetText.includes('?') && replyRate < 1) contentInsights.push({ text: 'No question - try asking to boost replies', positive: false });
    if (textAnalysis.hashtagCount > 1) contentInsights.push({ text: 'Multiple hashtags hurt reach (-40% penalty)', positive: false });
    if (textAnalysis.hashtagCount === 0) contentInsights.push({ text: 'No hashtags - good for algorithm', positive: true });
    if (tweetText.includes('http')) contentInsights.push({ text: 'External link detected (-30-50% penalty)', positive: false });
    if (textAnalysis.lineBreaks > 2) contentInsights.push({ text: 'Good formatting with line breaks', positive: true });
    if (textAnalysis.isChoppy) contentInsights.push({ text: 'Choppy format - easy to read', positive: true });
    if (textAnalysis.hasAllCaps) contentInsights.push({ text: 'ALL CAPS detected - triggers deboost', positive: false });

    // === WHAT WORKED / DIDN'T ===
    const whatWorked = [];
    const whatDidnt = [];

    if (rateBreakdown.replies.rating.label === 'Excellent' || rateBreakdown.replies.rating.label === 'Good') {
      whatWorked.push(`Strong reply rate (${replyRate.toFixed(2)}%) - content sparks conversation`);
    } else {
      whatDidnt.push(`Low reply rate (${replyRate.toFixed(2)}%) - add questions or hot takes`);
    }

    if (rateBreakdown.retweets.rating.label === 'Excellent' || rateBreakdown.retweets.rating.label === 'Good') {
      whatWorked.push(`Good RT rate (${retweetRate.toFixed(2)}%) - shareable content`);
    } else {
      whatDidnt.push(`Low RT rate (${retweetRate.toFixed(2)}%) - make it more quotable/shareable`);
    }

    if (rateBreakdown.bookmarks.rating.label === 'Excellent' || rateBreakdown.bookmarks.rating.label === 'Good') {
      whatWorked.push(`High save rate (${bookmarkRate.toFixed(2)}%) - valuable/actionable`);
    } else {
      whatDidnt.push(`Low save rate (${bookmarkRate.toFixed(2)}%) - add actionable insights`);
    }

    if (yourReplies > 0 && conversationRatio >= 50) {
      whatWorked.push(`Great author engagement (${conversationRatio}% reply rate) - 75x algo boost`);
    } else if (replies > 5 && yourReplies === 0) {
      whatDidnt.push('No author replies - missing 75x engagement multiplier!');
    }

    if (quotes > retweets * 0.3) {
      whatWorked.push('High quote ratio - content drives discussion');
    }

    // === RECOMMENDATIONS ===
    const recommendations = [];

    if (replyRate < 1 && !tweetText.includes('?')) {
      recommendations.push({
        priority: 'high',
        text: 'Add a question to future tweets to boost reply rate',
        impact: '+75x algorithm weight per reply you respond to'
      });
    }

    if (yourReplies === 0 && replies > 0) {
      recommendations.push({
        priority: 'critical',
        text: 'Reply to comments on this tweet NOW',
        impact: 'Each reply you make = 75x algorithm boost (vs 13.5x for their reply)'
      });
    }

    if (bookmarkRate < 0.2) {
      recommendations.push({
        priority: 'medium',
        text: 'Add more actionable value (tips, frameworks, resources)',
        impact: 'Bookmarks signal high-value content to the algorithm'
      });
    }

    if (retweetRate < 0.5) {
      recommendations.push({
        priority: 'medium',
        text: 'Make content more identity-reinforcing for shares',
        impact: 'People RT what makes them look smart/informed'
      });
    }

    if (textAnalysis.hashtagCount > 1) {
      recommendations.push({
        priority: 'high',
        text: 'Use max 1 hashtag in future tweets',
        impact: 'Multiple hashtags trigger -40% reach penalty'
      });
    }

    // === HISTORICAL COMPARISON ===
    let historicalComparison = null;
    if (history.length >= 3) {
      const pastEngagements = history
        .filter(h => h.analysis?.engagementRate)
        .map(h => parseFloat(h.analysis.engagementRate));

      if (pastEngagements.length > 0) {
        const avgEngagement = pastEngagements.reduce((a, b) => a + b, 0) / pastEngagements.length;
        const percentDiff = ((engagementRate - avgEngagement) / avgEngagement * 100).toFixed(0);
        historicalComparison = {
          avgEngagement: avgEngagement.toFixed(2),
          currentEngagement: engagementRate.toFixed(2),
          percentDiff,
          better: engagementRate > avgEngagement
        };
      }
    }

    // === OVERALL GRADE ===
    let grade = 'C';
    let gradeColor = COLORS.warning;
    if (engagementRate >= 6 && replyRate >= 2) { grade = 'A+'; gradeColor = COLORS.success; }
    else if (engagementRate >= 4 && replyRate >= 1) { grade = 'A'; gradeColor = COLORS.success; }
    else if (engagementRate >= 3) { grade = 'B+'; gradeColor = COLORS.primary; }
    else if (engagementRate >= 2) { grade = 'B'; gradeColor = COLORS.primary; }
    else if (engagementRate >= 1) { grade = 'C'; gradeColor = COLORS.warning; }
    else { grade = 'D'; gradeColor = COLORS.danger; }

    setAnalysisResult({
      engagementRate: engagementRate.toFixed(2),
      algorithmScore: normalizedScore,
      grade,
      gradeColor,
      rateBreakdown,
      scoreBreakdown,
      scoreContributions,
      viralityScore,
      conversationRatio,
      contentInsights,
      whatWorked,
      whatDidnt,
      recommendations,
      historicalComparison,
    });
  };

  const saveToHistory = () => {
    const entry = {
      id: Date.now(),
      text: tweetText,
      style: selectedStyle,
      contentTypes,
      metrics: { ...metrics },
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [entry, ...prev]);
  };

  // Extract tweet ID from URL
  const extractTweetId = (url) => {
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch tweet from backend API (proxies to twitterapi.io)
  const fetchTweet = async () => {
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) {
      setFetchError('Invalid tweet URL. Use format: https://x.com/user/status/123456');
      return;
    }

    setFetchingTweet(true);
    setFetchError('');
    setFetchedMetrics(null);

    try {
      const response = await fetch(`/api/tweet?tweet_ids=${tweetId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.tweets || data.tweets.length === 0) {
        throw new Error('Tweet not found');
      }

      const tweet = data.tweets[0];

      // Set tweet text
      setOtherTweetText(tweet.text || '');

      // Auto-detect content types from tweet
      const detectedTypes = [];
      if (tweet.media?.some(m => m.type === 'video')) detectedTypes.push('video');
      if (tweet.media?.some(m => m.type === 'photo')) detectedTypes.push('image');
      if (tweet.media?.some(m => m.type === 'animated_gif')) detectedTypes.push('gif');
      if (tweet.text?.includes('https://') || tweet.text?.includes('http://')) detectedTypes.push('link');
      if (tweet.isThread) detectedTypes.push('thread');
      setOtherContentTypes(detectedTypes);

      // Store fetched metrics for display
      setFetchedMetrics({
        likes: tweet.likeCount || 0,
        retweets: tweet.retweetCount || 0,
        replies: tweet.replyCount || 0,
        quotes: tweet.quoteCount || 0,
        bookmarks: tweet.bookmarkCount || 0,
        views: tweet.viewCount || 0,
        author: tweet.author?.userName || 'Unknown',
        createdAt: tweet.createdAt,
      });

    } catch (error) {
      setFetchError(error.message || 'Failed to fetch tweet');
    } finally {
      setFetchingTweet(false);
    }
  };

  // Fetch post metrics for Post Analyzer tab
  const fetchPostMetrics = async () => {
    const tweetId = extractTweetId(postUrl);
    if (!tweetId) {
      setPostFetchError('Invalid tweet URL. Use format: https://x.com/user/status/123456');
      return;
    }

    setFetchingPost(true);
    setPostFetchError('');

    try {
      const response = await fetch(`/api/tweet?tweet_ids=${tweetId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.tweets || data.tweets.length === 0) {
        throw new Error('Tweet not found');
      }

      const tweet = data.tweets[0];

      // Set tweet text
      setTweetText(tweet.text || '');

      // Auto-detect content types
      const detectedTypes = [];
      if (tweet.media?.some(m => m.type === 'video')) detectedTypes.push('video');
      if (tweet.media?.some(m => m.type === 'photo')) detectedTypes.push('image');
      if (tweet.media?.some(m => m.type === 'animated_gif')) detectedTypes.push('gif');
      if (tweet.text?.includes('https://') || tweet.text?.includes('http://')) detectedTypes.push('link');
      if (tweet.isThread) detectedTypes.push('thread');
      setContentTypes(detectedTypes);

      // Auto-populate metrics
      setMetrics({
        impressions: String(tweet.viewCount || 0),
        likes: String(tweet.likeCount || 0),
        retweets: String(tweet.retweetCount || 0),
        replies: String(tweet.replyCount || 0),
        quotes: String(tweet.quoteCount || 0),
        bookmarks: String(tweet.bookmarkCount || 0),
        profileVisits: '',
        yourReplies: '',
      });

    } catch (error) {
      setPostFetchError(error.message || 'Failed to fetch tweet');
    } finally {
      setFetchingPost(false);
    }
  };

  const analyzeOtherTweet = () => {
    const detectedStyle = detectStyle(otherTweetText);
    const signals = calculateSignals(otherTweetText, detectedStyle, otherContentTypes);
    const score = calculateCompositeScore(signals, otherContentTypes);

    // Generate "Why This Worked" analysis
    const whyItWorked = [];
    if (signals.dwellTime > 6) whyItWorked.push('Long-form content encourages dwell time');
    if (signals.reply > 6) whyItWorked.push('Conversational style invites replies');
    if (signals.bookmark > 6) whyItWorked.push('Actionable content gets saved');
    if (signals.quote > 6) whyItWorked.push('Hot take encourages quote tweets');
    if (otherContentTypes.includes('video')) whyItWorked.push('Video content gets 50% boost');
    if (otherContentTypes.includes('image')) whyItWorked.push('Visual content increases engagement');

    // Generate template
    const template = generateTemplate(otherTweetText, detectedStyle);

    setOtherAnalysis({
      detectedStyle,
      signals,
      score,
      whyItWorked,
      template,
    });
  };

  const generateTemplate = (text, style) => {
    const lines = text.split('\n').filter(l => l.trim());
    const structure = lines.map((line, i) => {
      if (i === 0) return '[Hook/Opening statement]';
      if (line.match(/^\d+\./)) return '[Numbered point]';
      if (line.length < 50) return '[Short punchy line]';
      return '[Supporting detail/expansion]';
    });
    return structure.join('\n');
  };

  // Grammar and spelling fixes
  const fixGrammarAndSpelling = () => {
    let text = tweetText;

    // Common spelling fixes
    const spellingFixes = {
      'teh': 'the', 'thier': 'their', 'recieve': 'receive', 'occured': 'occurred',
      'seperate': 'separate', 'definately': 'definitely', 'occassion': 'occasion',
      'untill': 'until', 'wierd': 'weird', 'acheive': 'achieve', 'beleive': 'believe',
      'concious': 'conscious', 'enviroment': 'environment', 'goverment': 'government',
      'immedietly': 'immediately', 'neccessary': 'necessary', 'occurence': 'occurrence',
      'posession': 'possession', 'recomend': 'recommend', 'succesful': 'successful',
      'tommorow': 'tomorrow', 'truely': 'truly', 'accomodate': 'accommodate',
      'apparantly': 'apparently', 'begining': 'beginning', 'calender': 'calendar',
      'collegue': 'colleague', 'commited': 'committed', 'dont': "don't", 'doesnt': "doesn't",
      'didnt': "didn't", 'cant': "can't", 'wont': "won't", 'im': "I'm", 'ive': "I've",
      'youre': "you're", 'theyre': "they're", 'its a': "it's a", 'alot': 'a lot',
    };

    // Apply spelling fixes (case-insensitive)
    Object.entries(spellingFixes).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        // Preserve original case for first letter
        if (match[0] === match[0].toUpperCase()) {
          return right.charAt(0).toUpperCase() + right.slice(1);
        }
        return right;
      });
    });

    // Capitalize first letter of sentences
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

    // Capitalize 'I' when standalone
    text = text.replace(/\bi\b/g, 'I');

    // Fix double spaces
    text = text.replace(/  +/g, ' ');

    // Fix space before punctuation
    text = text.replace(/\s+([.,!?])/g, '$1');

    setTweetText(text);
  };

  // Rewrite for maximum engagement (based on X algorithm)
  const rewriteForEngagement = () => {
    let text = tweetText;

    // Remove excess hashtags (keep max 1)
    const hashtags = text.match(/#\w+/g) || [];
    if (hashtags.length > 1) {
      hashtags.slice(1).forEach(tag => {
        text = text.replace(tag, '').trim();
      });
    }

    // Remove external links (30-50% penalty)
    text = text.replace(/https?:\/\/\S+/g, '[link in bio]');

    // Add line breaks for readability (choppy format performs better)
    if (!text.includes('\n') && text.length > 100) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      if (sentences.length > 1) {
        text = sentences.map(s => s.trim()).join('\n\n');
      }
    }

    // If no question, add engagement hook at end
    if (!text.includes('?')) {
      const hooks = [
        '\n\nThoughts?',
        '\n\nAgree or disagree?',
        '\n\nWhat would you add?',
        '\n\nDoes this resonate?',
      ];
      const hook = hooks[Math.floor(Math.random() * hooks.length)];
      if (text.length + hook.length <= 280) {
        text = text.trim() + hook;
      }
    }

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    setTweetText(text);
  };

  // Super risky rewrite for virality
  const rewriteForVirality = () => {
    let text = tweetText;

    // Remove all hashtags (they don't help virality)
    text = text.replace(/#\w+/g, '').trim();

    // Remove links
    text = text.replace(/https?:\/\/\S+/g, '').trim();

    // Add provocative hook at start if not present
    const hasStrongOpen = /^(Hot take|Unpopular opinion|Controversial|Truth bomb|Hard truth|Nobody talks about|The real reason|Stop |Here's what|Most people|I'm convinced)/i.test(text);

    if (!hasStrongOpen && text.length < 240) {
      const hooks = [
        'Hot take: ',
        'Unpopular opinion: ',
        'Hard truth: ',
        'Nobody talks about this but ',
        'The real reason ',
        'Most people get this wrong: ',
      ];
      const hook = hooks[Math.floor(Math.random() * hooks.length)];
      text = hook + text.charAt(0).toLowerCase() + text.slice(1);
    }

    // Make it more direct/choppy
    if (!text.includes('\n')) {
      text = text.replace(/\. /g, '.\n\n');
    }

    // Add controversial closer if room
    if (!text.includes('?') && text.length < 250) {
      const closers = [
        '\n\nChange my mind.',
        '\n\nProve me wrong.',
        '\n\nFight me.',
        '\n\nIf you disagree, you\'re not paying attention.',
      ];
      const closer = closers[Math.floor(Math.random() * closers.length)];
      text = text.trim() + closer;
    }

    // Clean up
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // Truncate if over limit
    if (text.length > 280) {
      text = text.substring(0, 277) + '...';
    }

    setTweetText(text);
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tweet-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredHistory = () => {
    let filtered = history;

    if (historyFilter !== 'all') {
      filtered = filtered.filter(item => item.style === historyFilter);
    }

    if (historySort === 'date') {
      filtered = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (historySort === 'score') {
      filtered = [...filtered].sort((a, b) =>
        (parseFloat(b.analysis?.algorithmScore) || 0) - (parseFloat(a.analysis?.algorithmScore) || 0)
      );
    } else if (historySort === 'engagement') {
      filtered = [...filtered].sort((a, b) =>
        (parseFloat(b.analysis?.engagementRate) || 0) - (parseFloat(a.analysis?.engagementRate) || 0)
      );
    }

    return filtered;
  };

  const getPatternInsights = () => {
    if (history.length < 3) return null;

    const stylePerformance = {};
    history.forEach(item => {
      if (!stylePerformance[item.style]) {
        stylePerformance[item.style] = { total: 0, count: 0 };
      }
      stylePerformance[item.style].total += parseFloat(item.analysis?.engagementRate) || 0;
      stylePerformance[item.style].count += 1;
    });

    const averages = Object.entries(stylePerformance).map(([style, data]) => ({
      style,
      average: data.total / data.count,
    }));

    averages.sort((a, b) => b.average - a.average);

    return averages;
  };

  // Calculate live analysis for Draft Scorer
  const signals = calculateSignals(tweetText, selectedStyle, contentTypes);
  const risks = calculateRisks(tweetText, selectedStyle);
  const compositeScore = calculateCompositeScore(signals, contentTypes);
  const suggestions = generateSuggestions(tweetText, signals, risks, selectedStyle);
  const playbook = generatePlaybook(selectedStyle);
  const textAnalysis = analyzeTweetText(tweetText);

  const contentTypeOptions = ['video', 'image', 'poll', 'thread', 'gif', 'link'];

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.background,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: COLORS.primary, fontSize: '28px', marginBottom: '8px' }}>
            X Algorithm Analyzer
          </h1>
          <p style={{ color: COLORS.textLight }}>
            Optimize your tweets for maximum reach
          </p>
        </div>

        {/* Post Timer */}
        {postTimer && (
          <div style={{
            ...STYLES.card,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '14px', color: COLORS.textLight, marginBottom: '4px' }}>
                Time since posting
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getTimerColor(timerSeconds),
              }}>
                {formatTime(timerSeconds)}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textLight, marginTop: '4px' }}>
                {timerSeconds < 5400 ? 'Wait before engaging' :
                 timerSeconds < 7200 ? 'Approaching safe zone' :
                 'Safe to engage normally'}
              </div>
            </div>
            <button
              onClick={resetTimer}
              style={{
                ...STYLES.button,
                ...STYLES.inactiveButton,
                color: COLORS.danger,
              }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          {[
            { id: 'draft', label: 'Draft Scorer' },
            { id: 'post', label: 'Post Analyzer' },
            { id: 'others', label: 'Analyze Others' },
            { id: 'history', label: 'History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...STYLES.button,
                ...(activeTab === tab.id ? STYLES.activeButton : STYLES.inactiveButton),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Draft Scorer Tab */}
        {activeTab === 'draft' && (
          <div>
            <div style={STYLES.card}>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                placeholder="Write your tweet draft here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                color: COLORS.textLight,
                fontSize: '14px',
              }}>
                <span>{tweetText.length}/280</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span>{textAnalysis.wordCount} words</span>
                  {tweetText && (
                    <button
                      onClick={() => setTweetText('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: COLORS.danger,
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 8px',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Rewrite Buttons */}
              {tweetText && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: COLORS.text,
                  }}>
                    Rewrite
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      onClick={fixGrammarAndSpelling}
                      style={{
                        ...STYLES.button,
                        ...STYLES.inactiveButton,
                        padding: '8px 16px',
                      }}
                    >
                      Fix Grammar
                    </button>
                    <button
                      onClick={rewriteForEngagement}
                      style={{
                        ...STYLES.button,
                        ...STYLES.inactiveButton,
                        padding: '8px 16px',
                        borderColor: COLORS.success,
                        color: COLORS.success,
                      }}
                    >
                      Max Engagement
                    </button>
                    <button
                      onClick={rewriteForVirality}
                      style={{
                        ...STYLES.button,
                        ...STYLES.inactiveButton,
                        padding: '8px 16px',
                        borderColor: COLORS.danger,
                        color: COLORS.danger,
                      }}
                    >
                      Risky Viral
                    </button>
                  </div>
                </div>
              )}

              {/* Style Selector */}
              <div style={{ marginTop: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: COLORS.text,
                }}>
                  Style
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(STYLE_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStyle(key)}
                      style={{
                        ...STYLES.button,
                        padding: '8px 16px',
                        ...(selectedStyle === key ? STYLES.activeButton : STYLES.inactiveButton),
                      }}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Type Toggles */}
              <div style={{ marginTop: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: COLORS.text,
                }}>
                  Content Type
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {contentTypeOptions.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleContentType(type)}
                      style={{
                        ...STYLES.button,
                        padding: '8px 16px',
                        ...(contentTypes.includes(type) ? STYLES.activeButton : STYLES.inactiveButton),
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {tweetText && (
              <div style={{ marginTop: '20px' }}>
                {/* Composite Score */}
                <div style={STYLES.card}>
                  <h3 style={{ color: COLORS.textLight, fontSize: '14px', marginBottom: '8px' }}>
                    Composite Score
                  </h3>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: compositeScore >= 7 ? COLORS.success :
                           compositeScore >= 4 ? COLORS.warning : COLORS.danger,
                  }}>
                    {compositeScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.textLight }}>out of 10</div>
                </div>

                {/* Signal Breakdown */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Signal Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    {Object.entries(signals).map(([signal, value]) => (
                      <div key={signal}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}>
                          <span style={{ color: COLORS.textLight, textTransform: 'capitalize' }}>
                            {signal.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span style={{ fontWeight: '600' }}>{value.toFixed(1)}</span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#E0E0E0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${value * 10}%`,
                            background: COLORS.primary,
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Assessment */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Risk Assessment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    {Object.entries(risks).map(([risk, value]) => (
                      <div key={risk}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}>
                          <span style={{ color: COLORS.textLight, textTransform: 'capitalize' }}>
                            {risk.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span style={{
                            fontWeight: '600',
                            color: value > 5 ? COLORS.danger : COLORS.text,
                          }}>
                            {value.toFixed(1)}
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#E0E0E0',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${value * 10}%`,
                            background: value > 5 ? COLORS.danger : COLORS.warning,
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formatting Analysis */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Formatting Analysis</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{
                      padding: '6px 12px',
                      background: textAnalysis.isChoppy ? COLORS.success + '20' : '#E0E0E0',
                      color: textAnalysis.isChoppy ? COLORS.success : COLORS.textLight,
                      borderRadius: '20px',
                      fontSize: '14px',
                    }}>
                      {textAnalysis.isChoppy ? 'Choppy (Good)' : 'Blocky'}
                    </span>
                    <span style={{
                      padding: '6px 12px',
                      background: '#E0E0E0',
                      borderRadius: '20px',
                      fontSize: '14px',
                    }}>
                      {textAnalysis.lineBreaks} line breaks
                    </span>
                    {textAnalysis.hasAllCaps && (
                      <span style={{
                        padding: '6px 12px',
                        background: COLORS.danger + '20',
                        color: COLORS.danger,
                        borderRadius: '20px',
                        fontSize: '14px',
                      }}>
                        ALL CAPS detected
                      </span>
                    )}
                    {textAnalysis.hashtagCount > 0 && (
                      <span style={{
                        padding: '6px 12px',
                        background: textAnalysis.hashtagCount > 1 ? COLORS.danger + '20' : '#E0E0E0',
                        color: textAnalysis.hashtagCount > 1 ? COLORS.danger : COLORS.textLight,
                        borderRadius: '20px',
                        fontSize: '14px',
                      }}>
                        {textAnalysis.hashtagCount} hashtag{textAnalysis.hashtagCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div style={{ ...STYLES.card, marginTop: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Suggestions</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {suggestions.map((suggestion, i) => (
                        <li key={i} style={{
                          color: COLORS.textLight,
                          marginBottom: '8px',
                        }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Playbook */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>
                    Post-Publish Playbook ({STYLE_PROFILES[selectedStyle].name})
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {playbook.map((tip, i) => (
                      <li key={i} style={{
                        color: COLORS.textLight,
                        marginBottom: '8px',
                      }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Post This Button */}
                <button
                  onClick={handlePostThis}
                  disabled={!!postTimer}
                  style={{
                    ...STYLES.button,
                    ...STYLES.ctaButton,
                    width: '100%',
                    marginTop: '20px',
                    padding: '16px',
                    fontSize: '16px',
                    opacity: postTimer ? 0.6 : 1,
                  }}
                >
                  I'm Posting This
                </button>
              </div>
            )}
          </div>
        )}

        {/* Post Analyzer Tab */}
        {activeTab === 'post' && (
          <div>
            {/* URL Fetch Section */}
            <div style={{ ...STYLES.card, marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.text }}>
                Fetch Your Tweet
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://x.com/you/status/123456789"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={fetchPostMetrics}
                  disabled={fetchingPost || !postUrl}
                  style={{
                    ...STYLES.button,
                    ...STYLES.activeButton,
                    opacity: fetchingPost || !postUrl ? 0.6 : 1,
                  }}
                >
                  {fetchingPost ? 'Fetching...' : 'Fetch'}
                </button>
                <button
                  onClick={() => {
                    setPostUrl('');
                    setTweetText('');
                    setContentTypes([]);
                    setMetrics({
                      impressions: '',
                      likes: '',
                      retweets: '',
                      replies: '',
                      quotes: '',
                      bookmarks: '',
                      profileVisits: '',
                      yourReplies: '',
                    });
                    setAnalysisResult(null);
                    setPostFetchError('');
                  }}
                  style={{
                    ...STYLES.button,
                    ...STYLES.inactiveButton,
                    color: COLORS.danger,
                  }}
                >
                  Clear
                </button>
              </div>
              {postFetchError && (
                <div style={{ marginTop: '10px', color: COLORS.danger, fontSize: '14px' }}>
                  {postFetchError}
                </div>
              )}
            </div>

            <div style={STYLES.card}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.text }}>
                Tweet Text
              </label>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                placeholder="Paste your posted tweet here, or fetch from URL above..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '16px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />

              {/* Style and Content Type Selectors */}
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Style
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(STYLE_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStyle(key)}
                      style={{
                        ...STYLES.button,
                        padding: '8px 16px',
                        ...(selectedStyle === key ? STYLES.activeButton : STYLES.inactiveButton),
                      }}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Content Type
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {contentTypeOptions.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleContentType(type)}
                      style={{
                        ...STYLES.button,
                        padding: '8px 16px',
                        ...(contentTypes.includes(type) ? STYLES.activeButton : STYLES.inactiveButton),
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics Input */}
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Metrics
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key}>
                      <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '14px',
                        color: COLORS.textLight,
                        textTransform: 'capitalize',
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setMetrics(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={analyzePerformance}
                style={{
                  ...STYLES.button,
                  ...STYLES.ctaButton,
                  width: '100%',
                  marginTop: '20px',
                }}
              >
                Analyze Performance
              </button>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div style={{ marginTop: '20px' }}>
                {/* Top Stats Row */}
                <div style={{ ...STYLES.card, display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: analysisResult.gradeColor }}>
                      {analysisResult.grade}
                    </div>
                    <div style={{ color: COLORS.textLight, fontSize: '12px' }}>Overall Grade</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: analysisResult.rateBreakdown.overall.rating.color }}>
                      {analysisResult.engagementRate}%
                    </div>
                    <div style={{ color: COLORS.textLight, fontSize: '12px' }}>Engagement Rate</div>
                    <div style={{ fontSize: '11px', color: analysisResult.rateBreakdown.overall.rating.color }}>
                      {analysisResult.rateBreakdown.overall.rating.label}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.primary }}>
                      {analysisResult.algorithmScore}
                    </div>
                    <div style={{ color: COLORS.textLight, fontSize: '12px' }}>Algorithm Score</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.text }}>
                      {analysisResult.viralityScore}
                    </div>
                    <div style={{ color: COLORS.textLight, fontSize: '12px' }}>Virality Index</div>
                  </div>
                </div>

                {/* Historical Comparison */}
                {analysisResult.historicalComparison && (
                  <div style={{
                    ...STYLES.card,
                    marginTop: '15px',
                    background: analysisResult.historicalComparison.better ? COLORS.success + '10' : COLORS.danger + '10',
                    border: `1px solid ${analysisResult.historicalComparison.better ? COLORS.success : COLORS.danger}20`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: COLORS.textLight }}>vs Your Average ({analysisResult.historicalComparison.avgEngagement}%)</span>
                      <span style={{
                        fontWeight: 'bold',
                        color: analysisResult.historicalComparison.better ? COLORS.success : COLORS.danger,
                      }}>
                        {analysisResult.historicalComparison.better ? '+' : ''}{analysisResult.historicalComparison.percentDiff}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Rate Breakdown */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Engagement Breakdown vs Benchmarks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    {Object.entries(analysisResult.rateBreakdown).filter(([k]) => k !== 'overall').map(([key, data]) => (
                      <div key={key} style={{
                        padding: '12px',
                        background: '#F9F9F9',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${data.rating.color}`,
                      }}>
                        <div style={{ fontSize: '12px', color: COLORS.textLight, textTransform: 'capitalize' }}>{key}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.text }}>{data.rate.toFixed(2)}%</div>
                        <div style={{ fontSize: '11px', color: data.rating.color, fontWeight: '600' }}>{data.rating.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Algorithm Score Breakdown */}
                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Algorithm Score Breakdown</h3>
                  <div style={{ fontSize: '12px', color: COLORS.textLight, marginBottom: '10px' }}>
                    What contributed to your algorithm score (based on X's actual weights)
                  </div>
                  {Object.entries(analysisResult.scoreBreakdown)
                    .filter(([_, value]) => value > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', color: COLORS.text, textTransform: 'capitalize' }}>
                            {key === 'replyEngaged' ? 'Your Replies (75x)' :
                             key === 'replies' ? 'Replies (13.5x)' :
                             key === 'retweets' ? 'Retweets (1x)' :
                             key === 'quotes' ? 'Quotes (1x)' :
                             key === 'likes' ? 'Likes (0.5x)' :
                             key === 'bookmarks' ? 'Bookmarks (2x)' : key}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            {analysisResult.scoreContributions[key]}%
                          </span>
                        </div>
                        <div style={{ height: '6px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${analysisResult.scoreContributions[key]}%`,
                            background: key === 'replyEngaged' ? COLORS.success : COLORS.primary,
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Content Insights */}
                {analysisResult.contentInsights.length > 0 && (
                  <div style={{ ...STYLES.card, marginTop: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Content Analysis</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysisResult.contentInsights.map((insight, i) => (
                        <span key={i} style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          background: insight.positive ? COLORS.success + '15' : COLORS.danger + '15',
                          color: insight.positive ? COLORS.success : COLORS.danger,
                          border: `1px solid ${insight.positive ? COLORS.success : COLORS.danger}30`,
                        }}>
                          {insight.positive ? '+' : '-'} {insight.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* What Worked / Didn't */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div style={STYLES.card}>
                    <h3 style={{ color: COLORS.success, marginBottom: '10px' }}>What Worked</h3>
                    {analysisResult.whatWorked.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {analysisResult.whatWorked.map((item, i) => (
                          <li key={i} style={{ color: COLORS.textLight, marginBottom: '6px', fontSize: '13px' }}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: COLORS.textLight, fontSize: '13px' }}>Keep experimenting to find what works</p>
                    )}
                  </div>
                  <div style={STYLES.card}>
                    <h3 style={{ color: COLORS.danger, marginBottom: '10px' }}>What Didn't</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {analysisResult.whatDidnt.map((item, i) => (
                        <li key={i} style={{ color: COLORS.textLight, marginBottom: '6px', fontSize: '13px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div style={{ ...STYLES.card, marginTop: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Action Items</h3>
                    {analysisResult.recommendations.map((rec, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        background: rec.priority === 'critical' ? COLORS.danger + '10' :
                                   rec.priority === 'high' ? COLORS.warning + '10' : '#F5F5F5',
                        borderLeft: `3px solid ${
                          rec.priority === 'critical' ? COLORS.danger :
                          rec.priority === 'high' ? COLORS.warning : COLORS.textLight
                        }`,
                      }}>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          color: rec.priority === 'critical' ? COLORS.danger :
                                 rec.priority === 'high' ? COLORS.warning : COLORS.textLight,
                          marginBottom: '4px',
                        }}>
                          {rec.priority} priority
                        </div>
                        <div style={{ fontWeight: '600', color: COLORS.text, marginBottom: '4px' }}>{rec.text}</div>
                        <div style={{ fontSize: '12px', color: COLORS.textLight }}>{rec.impact}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Author Engagement Reminder */}
                {parseInt(metrics.replies) > 0 && parseInt(metrics.yourReplies) === 0 && (
                  <div style={{
                    ...STYLES.card,
                    marginTop: '15px',
                    background: COLORS.danger + '10',
                    border: `2px solid ${COLORS.danger}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>!</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: COLORS.danger }}>
                          You have {metrics.replies} replies but haven't responded!
                        </div>
                        <div style={{ fontSize: '13px', color: COLORS.textLight }}>
                          Each reply you make gives a 75x algorithm boost. Go engage now!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={saveToHistory}
                  style={{
                    ...STYLES.button,
                    ...STYLES.activeButton,
                    width: '100%',
                    marginTop: '20px',
                  }}
                >
                  Save to History
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analyze Others Tab */}
        {activeTab === 'others' && (
          <div>
            {/* URL Fetch Section */}
            <div style={{ ...STYLES.card, marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.text }}>
                Fetch from URL
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/user/status/123456789"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={fetchTweet}
                  disabled={fetchingTweet || !tweetUrl}
                  style={{
                    ...STYLES.button,
                    ...STYLES.activeButton,
                    opacity: fetchingTweet || !tweetUrl ? 0.6 : 1,
                  }}
                >
                  {fetchingTweet ? 'Fetching...' : 'Fetch'}
                </button>
                <button
                  onClick={() => {
                    setTweetUrl('');
                    setOtherTweetText('');
                    setOtherContentTypes([]);
                    setOtherAnalysis(null);
                    setFetchedMetrics(null);
                    setFetchError('');
                  }}
                  style={{
                    ...STYLES.button,
                    ...STYLES.inactiveButton,
                    color: COLORS.danger,
                  }}
                >
                  Clear
                </button>
              </div>

              {fetchError && (
                <div style={{ marginTop: '10px', color: COLORS.danger, fontSize: '14px' }}>
                  {fetchError}
                </div>
              )}

              {fetchedMetrics && (
                <div style={{ marginTop: '15px', padding: '12px', background: '#F5F5F5', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: COLORS.textLight, marginBottom: '8px' }}>
                    @{fetchedMetrics.author} - {new Date(fetchedMetrics.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px' }}>
                    <span>{fetchedMetrics.views.toLocaleString()} views</span>
                    <span>{fetchedMetrics.likes.toLocaleString()} likes</span>
                    <span>{fetchedMetrics.retweets.toLocaleString()} RTs</span>
                    <span>{fetchedMetrics.replies.toLocaleString()} replies</span>
                    <span>{fetchedMetrics.quotes.toLocaleString()} quotes</span>
                    <span>{fetchedMetrics.bookmarks.toLocaleString()} bookmarks</span>
                  </div>
                </div>
              )}
            </div>

            <div style={STYLES.card}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.text }}>
                Tweet Text
              </label>
              <textarea
                value={otherTweetText}
                onChange={(e) => setOtherTweetText(e.target.value)}
                placeholder="Paste a viral tweet to analyze, or fetch from URL above..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Content Type
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {contentTypeOptions.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleOtherContentType(type)}
                      style={{
                        ...STYLES.button,
                        padding: '8px 16px',
                        ...(otherContentTypes.includes(type) ? STYLES.activeButton : STYLES.inactiveButton),
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={analyzeOtherTweet}
                style={{
                  ...STYLES.button,
                  ...STYLES.ctaButton,
                  width: '100%',
                  marginTop: '20px',
                }}
              >
                Analyze Tweet
              </button>
            </div>

            {otherAnalysis && (
              <div style={{ marginTop: '20px' }}>
                <div style={STYLES.card}>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: COLORS.textLight }}>Detected Style: </span>
                    <span style={{
                      fontWeight: '600',
                      color: COLORS.primary,
                    }}>
                      {STYLE_PROFILES[otherAnalysis.detectedStyle].name}
                    </span>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: COLORS.textLight }}>Predicted Score: </span>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: otherAnalysis.score >= 7 ? COLORS.success : COLORS.warning,
                    }}>
                      {otherAnalysis.score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Why This Worked</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {otherAnalysis.whyItWorked.map((reason, i) => (
                      <li key={i} style={{ color: COLORS.textLight, marginBottom: '8px' }}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ ...STYLES.card, marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ color: COLORS.text, margin: 0 }}>Steal This Structure</h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(otherAnalysis.template)}
                      style={{
                        ...STYLES.button,
                        ...STYLES.inactiveButton,
                        padding: '6px 12px',
                        fontSize: '12px',
                      }}
                    >
                      Copy Template
                    </button>
                  </div>
                  <pre style={{
                    background: '#F5F5F5',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                  }}>
                    {otherAnalysis.template}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{ ...STYLES.card, marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Filter by Style
                  </label>
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    style={{
                      padding: '10px 15px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Styles</option>
                    {Object.entries(STYLE_PROFILES).map(([key, profile]) => (
                      <option key={key} value={key}>{profile.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Sort by
                  </label>
                  <select
                    value={historySort}
                    onChange={(e) => setHistorySort(e.target.value)}
                    style={{
                      padding: '10px 15px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px',
                    }}
                  >
                    <option value="date">Date</option>
                    <option value="score">Score</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </div>

                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                  <button
                    onClick={exportHistory}
                    style={{
                      ...STYLES.button,
                      ...STYLES.inactiveButton,
                    }}
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Pattern Insights */}
            {getPatternInsights() && (
              <div style={{ ...STYLES.card, marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px', color: COLORS.text }}>Pattern Insights</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {getPatternInsights().map((item, i) => (
                    <div key={item.style} style={{
                      padding: '10px 15px',
                      background: i === 0 ? COLORS.primary + '15' : '#F5F5F5',
                      borderRadius: '8px',
                    }}>
                      <div style={{ fontWeight: '600', color: i === 0 ? COLORS.primary : COLORS.text }}>
                        {STYLE_PROFILES[item.style]?.name || item.style}
                      </div>
                      <div style={{ fontSize: '14px', color: COLORS.textLight }}>
                        Avg: {item.average.toFixed(2)}% engagement
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Items */}
            {getFilteredHistory().length === 0 ? (
              <div style={{ ...STYLES.card, textAlign: 'center', color: COLORS.textLight }}>
                No posts tracked yet. Use the Post Analyzer to save posts.
              </div>
            ) : (
              getFilteredHistory().map(item => (
                <div key={item.id} style={{ ...STYLES.card, marginBottom: '15px' }}>
                  <div style={{ marginBottom: '10px', color: COLORS.text }}>
                    {item.text.substring(0, 140)}
                    {item.text.length > 140 && '...'}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}>
                    <div style={{ display: 'flex', gap: '15px', color: COLORS.textLight, fontSize: '14px' }}>
                      <span>{STYLE_PROFILES[item.style]?.name}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      {item.analysis && (
                        <>
                          <span>Score: {item.analysis.algorithmScore}</span>
                          <span>Engagement: {item.analysis.engagementRate}%</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      style={{
                        ...STYLES.button,
                        ...STYLES.inactiveButton,
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: COLORS.danger,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
