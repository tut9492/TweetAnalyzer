'use client';

import { useState, useMemo } from 'react';
import { DeepPostAnalysis } from '@/lib/twitter/types';

interface PostsTableProps {
  posts: DeepPostAnalysis[];
  avgEngagement: number;
}

type SortField = 'date' | 'impressions' | 'likes' | 'replies' | 'retweets' | 'score';
type SortDirection = 'asc' | 'desc';

export default function PostsTable({ posts, avgEngagement }: PostsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    
    sorted.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'impressions':
          aValue = a.metrics.impressions || 0;
          bValue = b.metrics.impressions || 0;
          break;
        case 'likes':
          aValue = a.metrics.likes;
          bValue = b.metrics.likes;
          break;
        case 'replies':
          aValue = a.metrics.replies;
          bValue = b.metrics.replies;
          break;
        case 'retweets':
          aValue = a.metrics.retweets;
          bValue = b.metrics.retweets;
          break;
        case 'score':
          aValue = a.metrics.weightedScore;
          bValue = b.metrics.weightedScore;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [posts, sortField, sortDirection]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getMetricColor = (value: number, avg: number): string => {
    if (value > avg * 1.2) return 'text-green-400';
    if (value < avg * 0.8) return 'text-red-400';
    return 'text-white';
  };

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-500 ml-1">↕</span>;
    }
    return (
      <span className="text-white ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-black border-b border-white/10 sticky top-0 z-10">
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  <SortArrow field="date" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Post Preview
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('impressions')}
              >
                <div className="flex items-center justify-end">
                  Impressions
                  <SortArrow field="impressions" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('likes')}
              >
                <div className="flex items-center justify-end">
                  Likes
                  <SortArrow field="likes" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('replies')}
              >
                <div className="flex items-center justify-end">
                  Replies
                  <SortArrow field="replies" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('retweets')}
              >
                <div className="flex items-center justify-end">
                  Reposts
                  <SortArrow field="retweets" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('score')}
                title="Weighted score using the new X algorithm formula"
              >
                <div className="flex items-center justify-end">
                  Score
                  <SortArrow field="score" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Top Engagers
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedPosts.map((post) => {
              const previewText = post.text.length > 100 
                ? post.text.substring(0, 100) + '...' 
                : post.text;
              
              // Extract username from URL
              const urlMatch = post.url.match(/twitter\.com\/([^\/]+)/);
              const username = urlMatch ? urlMatch[1] : 'user';
              
              const engagers = post.engagers || post.bigEngagers?.slice(0, 5).map(e => ({
                username: e.username,
                displayName: e.displayName,
                followers: e.followers,
                profilePicture: e.profilePicture,
                engagementType: e.engagementType === 'quote' ? 'retweet' : e.engagementType as 'like' | 'retweet' | 'reply',
              })) || [];

              // Debug logging
              if (post.id === posts[0]?.id) {
                console.log(`[PostsTable] Post ${post.id} engagers:`, engagers);
                console.log(`[PostsTable] Post ${post.id} has engagers field:`, !!post.engagers);
                console.log(`[PostsTable] Post ${post.id} has bigEngagers:`, !!post.bigEngagers);
                // #region agent log
                fetch('http://127.0.0.1:7244/ingest/62c95353-fd7f-4ebb-9ac6-070c00f19df8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PostsTable.tsx:192',message:'frontend engagers check',data:{postId:post.id,hasEngagersField:!!post.engagers,hasBigEngagers:!!post.bigEngagers,engagersLength:engagers.length,engagersSample:engagers.slice(0,2)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
              }

              return (
                <tr
                  key={post.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => window.open(post.url, '_blank')}
                >
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white" title={getDayOfWeek(post.createdAt)}>
                      {formatDate(post.createdAt)}
                    </div>
                  </td>

                  {/* Post Preview */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-2 leading-relaxed">
                          {previewText}
                        </p>
                        {post.structure.hasMedia && (
                          <div className="mt-2 w-16 h-16 rounded bg-white/10 border border-white/20 flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                            {post.structure.mediaType === 'image' && 'IMG'}
                            {post.structure.mediaType === 'video' && 'VID'}
                            {post.structure.mediaType === 'gif' && 'GIF'}
                            {!post.structure.mediaType && 'Media'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Impressions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${getMetricColor(post.metrics.impressions || 0, avgEngagement * 10)}`}>
                      {post.metrics.impressions > 0 ? formatNumber(post.metrics.impressions) : 'N/A'}
                    </div>
                  </td>

                  {/* Likes */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${getMetricColor(post.metrics.likes, avgEngagement)}`}>
                      {formatNumber(post.metrics.likes)}
                    </div>
                  </td>

                  {/* Replies */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${getMetricColor(post.metrics.replies, avgEngagement)}`}>
                      {formatNumber(post.metrics.replies)}
                    </div>
                  </td>

                  {/* Reposts */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${getMetricColor(post.metrics.retweets, avgEngagement)}`}>
                      {formatNumber(post.metrics.retweets)}
                    </div>
                  </td>

                  {/* Weighted Score */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-white">
                      {formatNumber(Math.round(post.metrics.weightedScore))}
                    </div>
                  </td>

                  {/* Top Engagers */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {engagers.length > 0 ? (
                        engagers.map((engager, idx) => (
                          <div
                            key={idx}
                            className="relative group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {engager.profilePicture ? (
                              <img
                                src={engager.profilePicture}
                                alt={engager.username}
                                className="w-8 h-8 rounded-full border border-white/20"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-gray-400">
                                {engager.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-white/20 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              <div className="font-semibold">@{engager.username}</div>
                              <div className="text-gray-400">{engager.displayName}</div>
                              <div className="text-gray-400">{formatNumber(engager.followers)} followers</div>
                              <div className="text-gray-400 capitalize">{engager.engagementType}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

