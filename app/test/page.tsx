'use client';

import { useState } from 'react';

interface TopicWithMetrics {
  rank: number;
  name: string;
  tweetVolume: number;
  totalImpressions: number;
  avgEngagement: number;
}

interface ApiResponse {
  topics?: TopicWithMetrics[];
  error?: string;
}

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      console.log('🔄 [Test] Fetching trending topics...');
      const response = await fetch('/api/trending');
      
      console.log('📡 [Test] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData: ApiResponse = await response.json();
      console.log('✅ [Test] Successfully received data:', jsonData);
      setData(jsonData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('❌ [Test] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Twitter API Test Page
          </h1>
          
          <p className="text-gray-600 mb-6">
            Test the connection to TwitterAPI.io and view the raw response data.
          </p>

          <button
            onClick={fetchTrending}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Fetch Trending Topics'}
          </button>

          {loading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">⏳ Fetching data from Twitter API...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">❌ Error:</p>
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
          )}

          {data && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Data:</h2>
              
              {data.error && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">⚠️ Warning:</p>
                  <p className="text-yellow-700">{data.error}</p>
                </div>
              )}

              {data.topics && data.topics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Topics ({data.topics.length}):
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Tweet Volume
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Impressions
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Engagement
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.topics.map((topic) => (
                          <tr key={topic.rank} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              #{topic.rank}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {topic.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {topic.tweetVolume.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {topic.totalImpressions.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {topic.avgEngagement.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw JSON:</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check browser console for detailed logs</li>
              <li>• Check server logs for API call details</li>
              <li>• Ensure TWITTER_API_KEY is set in .env.local</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}






