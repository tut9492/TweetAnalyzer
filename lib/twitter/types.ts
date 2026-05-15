export interface Trend {
  name: string;
  target: {
    query: string;
  };
  rank: number;
  meta_description: string;
}

export interface TrendResponse {
  trends: Trend[];
  status: string;
  msg: string;
}

export interface DeepPostAnalysis {
  id: string;
  text: string;
  createdAt: string;
  url: string;
  metrics: {
    likes: number;
    retweets: number;
    quotes: number;
    replies: number;
    impressions: number;
    engagementRate: number;
    totalEngagement: number;
    weightedScore: number;
  };
  structure: {
    type: 'single' | 'thread' | 'reply' | 'quote';
    threadLength?: number;
    hasMedia: boolean;
    mediaType?: 'image' | 'video' | 'gif' | 'none';
    textLength: number;
    hashtags: string[];
    mentions: string[];
    linkCount: number;
  };
  timing: {
    dayOfWeek: string;
    hour: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    performanceVsAvg: number;
  };
  bigEngagers: Array<{
    username: string;
    displayName: string;
    followers: number;
    engagementType: 'like' | 'retweet' | 'reply' | 'quote';
    profileUrl: string;
    profilePicture?: string;
  }>;
  engagers?: Array<{
    username: string;
    displayName: string;
    followers: number;
    profilePicture?: string;
    engagementType: 'like' | 'retweet' | 'reply';
  }>;
}

export interface AnalysisSummary {
  totalPosts: number;
  avgEngagement: number;
  avgEngagementRate: number;
  bestPerformingType: 'thread' | 'single' | 'reply' | 'quote';
  bestDay: string;
  bestHour: number;
  totalEngagement: number;
}

export interface PostAnalysisResponse {
  posts: DeepPostAnalysis[];
  summary: AnalysisSummary;
}

