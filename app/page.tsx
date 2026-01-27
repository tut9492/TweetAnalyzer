'use client';

import { useEffect, useState } from 'react';

interface TopicMetrics {
  rank: number;
  name: string;
  tweetVolume: number;
  totalImpressions: number;
  avgEngagement: number;
}

interface TrendingResponse {
  topics: TopicMetrics[];
  error?: string;
  details?: string;
}

const CARD_GRADIENTS = [
  'from-cyan-500/20 to-pink-500/20',
  'from-pink-500/20 to-purple-500/20',
  'from-purple-500/20 to-blue-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-green-500/20 to-cyan-500/20',
  'from-orange-500/20 to-pink-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-blue-500/20 to-purple-500/20',
  'from-cyan-500/20 to-blue-500/20',
  'from-pink-500/20 to-orange-500/20',
];

export default function Home() {
  const [topics, setTopics] = useState<TopicMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchTrendingTopics = async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('⏸️  [Homepage] Already fetching, skipping...');
      return;
    }
    
    setIsFetching(true);
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/trending', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        const data: TrendingResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to fetch trending topics');
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTopics(data.topics || []);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (err) {
      console.error('Error fetching trending topics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTopics([]); // Clear topics on error
    } finally {
      setLoading(false); // ALWAYS set loading to false
      setIsFetching(false); // ALWAYS clear fetching flag
      console.log('✅ [Homepage] Fetch completed, loading set to false');
    }
  };

  // Fetch on initial load only
  useEffect(() => {
    console.log('🔄 [Homepage] Component mounted, fetching trending topics...');
    fetchTrendingTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount


  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };


  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Static Dark Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Glass Container */}
      <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12 text-center space-y-4 animate-fade-in">
            <h1 className="text-6xl sm:text-7xl font-bold text-white drop-shadow-2xl">
              Top 10 Trending Topics
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 font-light">
              Real-time Twitter insights
            </p>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={fetchTrendingTopics}
                disabled={loading}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 text-gray-200 font-medium shadow-lg hover:bg-white/10 hover:border-purple-500/30 hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
              <a
                href="/analyze"
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 text-gray-200 font-medium shadow-lg hover:bg-white/10 hover:border-purple-500/30 hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300"
              >
                Analyze Any Creator
              </a>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-8 w-16 bg-white/10 rounded-lg mb-4" />
                  <div className="h-6 w-full bg-white/10 rounded-lg mb-2" />
                  <div className="h-4 w-3/4 bg-white/10 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 shadow-2xl mb-8 animate-fade-in">
              <p className="text-gray-200 font-semibold text-lg mb-2">Error:</p>
              <p className="text-gray-300">{error}</p>
            </div>
          )}

          {/* Topics Grid */}
          {!loading && !error && topics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {topics.map((topic, index) => {
                const gradientIndex = index % CARD_GRADIENTS.length;
                return (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${CARD_GRADIENTS[gradientIndex]} bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:scale-105 hover:border-purple-500/30 hover:shadow-purple-500/20 hover:shadow-pink-500/10 transition-all duration-300 animate-fade-in`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Rank Badge */}
                    <div className="mb-4">
                      <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-none">
                        #{topic.rank || index + 1}
                      </div>
                    </div>

                    {/* Topic Name */}
                    <h3 className="text-xl font-bold text-gray-200 mb-4 line-clamp-2">
                      {topic.name}
                    </h3>

                    {/* Metrics */}
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-gray-200 text-sm">
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Tweets</span>
                        <span className="font-semibold">{formatNumber(topic.tweetVolume)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Impressions</span>
                        <span>{formatNumber(topic.totalImpressions)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Engagement</span>
                        <span>{formatNumber(topic.avgEngagement)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && topics.length === 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl animate-fade-in">
              <p className="text-gray-300 text-xl mb-4">No trending topics found.</p>
              <p className="text-gray-400 text-sm">Click "Refresh Now" to load topics</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
