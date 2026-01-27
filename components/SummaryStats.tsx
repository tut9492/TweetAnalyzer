import { AnalysisSummary } from '@/lib/twitter/types';

interface SummaryStatsProps {
  summary: AnalysisSummary;
}

export default function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Posts */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-200">
        <div className="text-gray-400 text-sm mb-2">Total Posts Analyzed</div>
        <div className="text-4xl font-bold text-white">{summary.totalPosts}</div>
      </div>

      {/* Avg Engagement Rate */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-200">
        <div className="text-gray-400 text-sm mb-2">Avg Engagement Rate</div>
        <div className="text-4xl font-bold text-white">
          {summary.avgEngagementRate.toFixed(2)}%
        </div>
      </div>

      {/* Best Performing Type */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-200">
        <div className="text-gray-400 text-sm mb-2">Best Performing Type</div>
        <div className="text-4xl font-bold text-white capitalize">
          {summary.bestPerformingType}
        </div>
      </div>

      {/* Best Day + Time */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-200">
        <div className="text-gray-400 text-sm mb-2">Best Day + Time</div>
        <div className="text-2xl font-bold text-white">{summary.bestDay}</div>
        <div className="text-lg text-gray-300 mt-1">
          {summary.bestHour}:00
        </div>
      </div>
    </div>
  );
}




