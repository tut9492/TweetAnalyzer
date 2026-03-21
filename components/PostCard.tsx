'use client';

import { useState } from 'react';
import { DeepPostAnalysis } from '@/lib/twitter/types';
import { formatTweetText } from '@/lib/utils/format-tweet-text';

interface PostCardProps {
  post: DeepPostAnalysis;
}

export default function PostCard({ post }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const truncatedText = post.text.length > 200 ? post.text.substring(0, 200) + '...' : post.text;
  const displayText = showFullText ? post.text : truncatedText;

  const performanceColor = post.timing.performanceVsAvg >= 0 
    ? 'text-green-400' 
    : 'text-red-400';

  const typeColors = {
    thread: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    single: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    reply: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    quote: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  };

  return (
    <div 
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${typeColors[post.structure.type]}`}>
            {post.structure.type.toUpperCase()}
            {post.structure.threadLength && ` (${post.structure.threadLength})`}
          </span>
          {post.structure.hasMedia && (
            <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50">
              {post.structure.mediaType?.toUpperCase()}
            </span>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          View on X →
        </a>
      </div>

      {/* Post Text */}
      <div className="mb-4">
        <p className="text-gray-200 leading-relaxed whitespace-pre-line">
          {formatTweetText(displayText)}
        </p>
        {post.text.length > 200 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullText(!showFullText);
            }}
            className="text-purple-400 hover:text-purple-300 text-sm mt-2"
          >
            {showFullText ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-xs mb-1">Likes</div>
          <div className="text-white font-semibold">{post.metrics.likes.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Retweets</div>
          <div className="text-white font-semibold">{post.metrics.retweets.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Replies</div>
          <div className="text-white font-semibold">{post.metrics.replies.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Engagement Rate</div>
          <div className="text-white font-semibold">{post.metrics.engagementRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Structure Info */}
          <div>
            <div className="text-gray-400 text-xs mb-2">Structure</div>
            <div className="flex flex-wrap gap-2">
              <span className="text-gray-300 text-sm">Length: {post.structure.textLength} chars</span>
              {post.structure.hashtags.length > 0 && (
                <span className="text-gray-300 text-sm">
                  Hashtags: {post.structure.hashtags.length}
                </span>
              )}
              {post.structure.mentions.length > 0 && (
                <span className="text-gray-300 text-sm">
                  Mentions: {post.structure.mentions.length}
                </span>
              )}
              {post.structure.linkCount > 0 && (
                <span className="text-gray-300 text-sm">
                  Links: {post.structure.linkCount}
                </span>
              )}
            </div>
          </div>

          {/* Timing Info */}
          <div>
            <div className="text-gray-400 text-xs mb-2">Timing</div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">
                {post.timing.dayOfWeek} at {post.timing.hour}:00 ({post.timing.timeOfDay})
              </span>
              <span className={`text-sm font-semibold ${performanceColor}`}>
                {post.timing.performanceVsAvg >= 0 ? '+' : ''}
                {post.timing.performanceVsAvg.toFixed(1)}% vs avg
              </span>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-xs mb-1">Impressions</div>
              <div className="text-white font-semibold">
                {post.metrics.impressions > 0 ? post.metrics.impressions.toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Total Engagement</div>
              <div className="text-white font-semibold">
                {post.metrics.totalEngagement.toLocaleString()}
              </div>
            </div>
          </div>

          {/* High-Influence Engagers */}
          {post.bigEngagers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-gray-400 text-xs mb-3 font-semibold">
                High-Influence Engagers ({post.bigEngagers.length})
              </div>
              <div className="space-y-2">
                {post.bigEngagers.map((engager, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <a
                        href={engager.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                      >
                        @{engager.username}
                      </a>
                      {engager.displayName && (
                        <span className="text-gray-500 text-xs">
                          {engager.displayName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                        {engager.engagementType}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {engager.followers.toLocaleString()} followers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click hint */}
      {!expanded && (
        <div className="mt-4 text-center text-gray-500 text-xs">
          Click to expand details
        </div>
      )}
    </div>
  );
}

