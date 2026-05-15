import { NextRequest, NextResponse } from 'next/server';
import { getUserPosts } from '@/lib/twitter/client';
import { extractUsername } from '@/lib/twitter/analyze-client';
import { coachDraft } from '@/lib/claude/draft-coach';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const draft: string = body.draft;
    const usernameRaw: string | undefined = body.username;

    if (!draft || typeof draft !== 'string' || !draft.trim()) {
      return NextResponse.json({ error: 'Missing draft' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 },
      );
    }

    const username = usernameRaw ? extractUsername(usernameRaw) : undefined;
    const historicalTweets = username ? await getUserPosts(username, 50) : [];

    const report = await coachDraft({
      draft,
      historicalTweets,
      username,
    });

    return NextResponse.json({ report, referenceCount: historicalTweets.length });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[draft-coach] error', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
