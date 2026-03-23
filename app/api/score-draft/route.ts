import { NextResponse } from 'next/server';
import { scoreDraft } from '@/lib/analysis/draft-scorer';

/**
 * POST /api/score-draft
 * Scores a draft tweet and returns suggestions + a revised version.
 *
 * Body: { text: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const result = scoreDraft(text);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to score draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
