'use client';

import { useState, useMemo } from 'react';
import { DeepPostAnalysis } from '@/lib/twitter/types';
import PostCard from './PostCard';

interface PostsListProps {
  posts: DeepPostAnalysis[];
}

type SortOption = 'date' | 'likes' | 'engagementRate' | 'impressions';
type FilterOption = 'all' | 'thread' | 'single' | 'reply';

export default function PostsList({ posts }: PostsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [displayCount, setDisplayCount] = useState(20);

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (filterBy === 'all') return posts;
    return posts.filter(p => p.structure.type === filterBy);
  }, [posts, filterBy]);

  // Sort posts
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'likes':
        return sorted.sort((a, b) => b.metrics.likes - a.metrics.likes);
      case 'engagementRate':
        return sorted.sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
      case 'impressions':
        return sorted.sort((a, b) => b.metrics.impressions - a.metrics.impressions);
      default:
        return sorted;
    }
  }, [filteredPosts, sortBy]);

  const displayedPosts = sortedPosts.slice(0, displayCount);
  const hasMore = displayCount < sortedPosts.length;

  return (
    <div>
      {/* Controls */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-gray-300 text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Date (Newest)</option>
              <option value="likes">Likes</option>
              <option value="engagementRate">Engagement Rate</option>
              <option value="impressions">Impressions</option>
            </select>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <label className="text-gray-300 text-sm">Filter:</label>
            <div className="flex gap-2">
              {(['all', 'thread', 'single', 'reply'] as FilterOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filterBy === option
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-gray-400 text-sm">
          Showing {displayedPosts.length} of {sortedPosts.length} posts
        </div>
      </div>

      {/* Posts Grid */}
      {displayedPosts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
          <p className="text-gray-400">No posts found matching the selected filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setDisplayCount(prev => prev + 20)}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-200"
              >
                Load More ({sortedPosts.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}




