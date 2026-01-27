'use client';

import { useState } from 'react';
import { PostAnalysisResponse } from '@/lib/twitter/types';
import SummaryStats from '@/components/SummaryStats';
import PostsTable from '@/components/PostsTable';

export default function AnalyzePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PostAnalysisResponse | null>(null);

  const handleAnalyze = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/analyze-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          limit: 100
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze posts');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Deep Post Analysis
          </h1>
          <p className="text-gray-300 text-lg">
            Analyze Twitter/X posts with detailed metrics and insights
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Enter username (e.g., elonmusk or @elonmusk)"
              className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Posts'}
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center text-gray-300">
              <p>Analyzing posts and fetching engagers... this may take 1-2 minutes</p>
              <div className="mt-2 w-full bg-white/5 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <div className="space-y-8">
            <SummaryStats summary={data.summary} />
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Posts</h2>
              {loading ? (
                <div className="bg-black rounded-lg border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-black border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Post Preview</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Impressions</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Likes</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Replies</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Reposts</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Top Engagers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-64 bg-white/10 rounded"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-white/10 rounded ml-auto"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-white/10 rounded ml-auto"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-white/10 rounded ml-auto"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-white/10 rounded ml-auto"></div></td>
                            <td className="px-6 py-4"><div className="h-8 w-32 bg-white/10 rounded"></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <PostsTable posts={data.posts} avgEngagement={data.summary.avgEngagement} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
