'use client';

import { useState } from 'react';

interface DraftCoachReport {
  hookScore: number;
  hookFeedback: string;
  structureType: string;
  structureFeedback: string;
  voiceMatch: number;
  missingElements: string[];
  strengths: string[];
  predictedPercentile: number;
  variants: Array<{ label: string; text: string; why: string }>;
}

export default function DraftCoachPage() {
  const [draft, setDraft] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DraftCoachReport | null>(null);
  const [referenceCount, setReferenceCount] = useState<number | null>(null);

  const handleCoach = async () => {
    if (!draft.trim()) {
      setError('Paste a draft tweet first');
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const resp = await fetch('/api/draft-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draft.trim(), username: username.trim() || undefined }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Request failed');
      setReport(data.report);
      setReferenceCount(data.referenceCount);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold text-white mb-3">Draft Coach</h1>
          <p className="text-gray-300 text-lg">
            Paste a draft. Get a hook score, structure feedback, and rewrites tuned to your voice.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
          <label className="block text-sm text-gray-300 mb-2">Your X handle (used to pull reference posts)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@yourhandle (optional but recommended)"
            className="w-full mb-6 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />

          <label className="block text-sm text-gray-300 mb-2">Draft</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your draft tweet or thread here..."
            rows={12}
            className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            disabled={loading}
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-400">{draft.length} chars</span>
            <button
              onClick={handleCoach}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Coaching...' : 'Coach this draft'}
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center text-gray-300 text-sm">
              <p>Pulling your top posts and asking Claude for honest feedback... ~30s</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200">
              {error}
            </div>
          )}
        </div>

        {report && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard label="Hook" score={report.hookScore} suffix="/10" />
              <ScoreCard label="Voice match" score={report.voiceMatch} suffix="/10" />
              <ScoreCard label="Predicted percentile" score={report.predictedPercentile} suffix="%" />
            </div>

            <Panel title="Hook">
              <p className="text-gray-200">{report.hookFeedback}</p>
            </Panel>

            <Panel title={`Structure: ${report.structureType}`}>
              <p className="text-gray-200">{report.structureFeedback}</p>
            </Panel>

            {report.strengths.length > 0 && (
              <Panel title="What works">
                <ul className="list-disc pl-5 text-gray-200 space-y-1">
                  {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Panel>
            )}

            {report.missingElements.length > 0 && (
              <Panel title="Missing">
                <ul className="list-disc pl-5 text-gray-200 space-y-1">
                  {report.missingElements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Panel>
            )}

            <Panel title="Rewrites">
              <div className="space-y-4">
                {report.variants.map((v, i) => (
                  <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/10">
                    <div className="text-xs uppercase tracking-wider text-purple-300 mb-2">{v.label}</div>
                    <pre className="whitespace-pre-wrap text-white text-sm font-mono mb-3">{v.text}</pre>
                    <p className="text-gray-400 text-xs italic">{v.why}</p>
                    <button
                      className="mt-2 text-xs text-purple-300 hover:text-purple-200"
                      onClick={() => navigator.clipboard.writeText(v.text)}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            {referenceCount !== null && (
              <p className="text-center text-xs text-gray-500">
                Coached against {referenceCount} of your historical posts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, score, suffix }: { label: string; score: number; suffix: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center">
      <div className="text-sm uppercase tracking-wider text-gray-400 mb-2">{label}</div>
      <div className="text-5xl font-bold text-white">{score}{suffix}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}
