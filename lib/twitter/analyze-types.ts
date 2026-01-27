export interface Tweet {
  id: string;
  text: string;
  author?: {
    id?: string;
    name?: string;
    username?: string;
  };
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount?: number;
  createdAt: string;
  isReply: boolean;
  conversationId?: string;
  entities?: {
    urls?: Array<{ url: string }>;
    media?: Array<{ type: string }>;
  };
}

export interface UserTweetsResponse {
  tweets?: Tweet[];
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface AccountOverview {
  username: string;
  name: string;
  followers: number;
  bio: string;
  profileImageUrl?: string;
}

export interface PostingStrategy {
  postsPerDay: number;
  repliesPerDay: number;
  threadsPerWeek: number;
  bestPostingTimes: string[];
}

export interface EngagementMetrics {
  avgEngagement: number;
  engagementRate: number;
  bestFormat: string;
  topTopics: string[];
}

export interface ContentBreakdown {
  threads: { percentage: number; note?: string };
  singleTweets: { percentage: number };
  replies: { percentage: number };
  withMedia: { percentage: number; multiplier: string };
  withLinks: { percentage: number; multiplier: string };
}

export interface TopPost {
  id: string;
  text: string;
  totalEngagement: number;
  likes: number;
  retweets: number;
  replies: number;
  type: 'Thread' | 'Single' | 'Reply';
  tweetCount?: number;
  mediaType?: string;
  postedAt: string;
  postedAtDate: Date;
}

export interface AnalysisResponse {
  overview: AccountOverview;
  postingStrategy: PostingStrategy;
  engagementMetrics: EngagementMetrics;
  contentBreakdown: ContentBreakdown;
  topPosts: TopPost[];
}

