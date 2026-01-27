'use client';

import { AnalysisResponse } from '@/lib/twitter/analyze-types';

interface AccountAnalysisProps {
  data: AnalysisResponse;
}

export default function AccountAnalysis({ data }: AccountAnalysisProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">ACCOUNT OVERVIEW</h3>
        <div className="flex items-start gap-4">
          {data.overview.profileImageUrl && (
            <img
              src={data.overview.profileImageUrl}
              alt={data.overview.name}
              className="w-16 h-16 rounded-full border border-white/10"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {data.overview.name} (@{data.overview.username})
            </h2>
            <p className="text-gray-400 text-sm mb-2">{formatNumber(data.overview.followers)} followers</p>
            {data.overview.bio && (
              <p className="text-gray-300">{data.overview.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posting Strategy */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">POSTING STRATEGY</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Posts per day</p>
            <p className="text-2xl font-bold text-white">{data.postingStrategy.postsPerDay}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Replies per day</p>
            <p className="text-2xl font-bold text-white">{data.postingStrategy.repliesPerDay}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Threads per week</p>
            <p className="text-2xl font-bold text-white">{data.postingStrategy.threadsPerWeek}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Best posting times</p>
            <p className="text-lg font-semibold text-white">
              {data.postingStrategy.bestPostingTimes.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">ENGAGEMENT METRICS</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Avg engagement</span>
            <span className="text-white font-semibold">{formatNumber(data.engagementMetrics.avgEngagement)} per post</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Engagement rate</span>
            <span className="text-white font-semibold">{formatPercentage(data.engagementMetrics.engagementRate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Best format</span>
            <span className="text-white font-semibold">{data.engagementMetrics.bestFormat}</span>
          </div>
        </div>
      </div>

      {/* Content Breakdown */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">CONTENT BREAKDOWN</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Threads</span>
              <span className="text-white font-semibold">{data.contentBreakdown.threads.percentage}%</span>
            </div>
            {data.contentBreakdown.threads.note && (
              <p className="text-xs text-gray-500">({data.contentBreakdown.threads.note})</p>
            )}
            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                style={{ width: `${data.contentBreakdown.threads.percentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Single tweets</span>
              <span className="text-white font-semibold">{data.contentBreakdown.singleTweets.percentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${data.contentBreakdown.singleTweets.percentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Replies</span>
              <span className="text-white font-semibold">{data.contentBreakdown.replies.percentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full"
                style={{ width: `${data.contentBreakdown.replies.percentage}%` }}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">With media</span>
              <span className="text-white font-semibold">{data.contentBreakdown.withMedia.percentage}%</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">({data.contentBreakdown.withMedia.multiplier})</p>
            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full"
                style={{ width: `${data.contentBreakdown.withMedia.percentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">With links</span>
              <span className="text-white font-semibold">{data.contentBreakdown.withLinks.percentage}%</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">({data.contentBreakdown.withLinks.multiplier})</p>
            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                style={{ width: `${data.contentBreakdown.withLinks.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Performing Posts */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">TOP 5 PERFORMING POSTS (Last 30 days)</h3>
        <div className="space-y-4">
          {data.topPosts.map((post, index) => (
            <div key={post.id} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">
                    {index + 1}. "{post.text}" ({formatNumber(post.totalEngagement)} total engagement)
                  </p>
                  <div className="flex gap-4 text-sm text-gray-400 mb-1">
                    <span>{post.type}</span>
                    {post.tweetCount && <span>• {post.tweetCount} tweets</span>}
                    {post.mediaType && <span>• {post.mediaType}</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mb-1">
                    <span>{formatNumber(post.likes)} likes</span>
                    <span>{formatNumber(post.retweets)} retweets</span>
                    <span>{formatNumber(post.replies)} replies</span>
                  </div>
                  <p className="text-xs text-gray-500">Posted: {post.postedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





