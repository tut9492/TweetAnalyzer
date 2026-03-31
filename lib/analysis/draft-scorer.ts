import { DraftScoreResult, RewriteOption } from '../twitter/types';

/**
 * Score a draft tweet on key engagement dimensions and suggest improvements.
 *
 * Scoring dimensions (each 0-10):
 *  - clarity:    Is the message easy to understand at a glance?
 *  - hook:       Does the first line grab attention?
 *  - cta:        Is there a clear call-to-action or reason to engage?
 *  - formatting: Does whitespace / line-breaks aid readability?
 *  - length:     Is the character count in the optimal range?
 */
export function scoreDraft(text: string): DraftScoreResult {
  const suggestions: string[] = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const charCount = text.length;

  // --- Clarity ---
  let clarity = 7;
  // Penalise very long unbroken sentences (>200 chars with no line break)
  const longestLine = Math.max(...lines.map(l => l.length));
  if (longestLine > 200) {
    clarity -= 2;
    suggestions.push('Break up long sentences for easier scanning.');
  }
  // Penalise excessive hashtags
  const hashtags = (text.match(/#\w+/g) || []);
  if (hashtags.length > 3) {
    clarity -= 1;
    suggestions.push('Too many hashtags can reduce clarity — keep to 1-2.');
  }
  // Reward concise text
  if (charCount <= 180 && charCount > 40) clarity = Math.min(clarity + 1, 10);

  // --- Hook ---
  let hook = 5;
  const firstLine = lines[0]?.trim() || '';
  // Strong openers
  if (/^(attention|breaking|unpopular opinion|hot take|stop |here'?s|thread|the secret|nobody)/i.test(firstLine)) {
    hook += 2;
  }
  // Question openers engage readers
  if (firstLine.endsWith('?')) hook += 1;
  // ALL-CAPS words in first line draw eyes
  const capsWords = (firstLine.match(/\b[A-Z]{2,}\b/g) || []).length;
  if (capsWords >= 1 && capsWords <= 3) hook += 1;
  // Numbers / stats hook well
  if (/\d/.test(firstLine)) hook += 1;
  hook = Math.min(hook, 10);

  // --- CTA ---
  let cta = 4;
  const lower = text.toLowerCase();
  if (/\b(apply|check it out|link|sign up|dm me|drop a|comment|retweet|share|tag someone|click|join)\b/.test(lower)) {
    cta += 3;
  }
  if (/@\w+/.test(text)) cta += 1; // mentions encourage interaction
  if (text.includes('?')) cta += 1; // questions invite replies
  cta = Math.min(cta, 10);
  if (cta < 6) {
    suggestions.push('Add a clear call-to-action (e.g. "Apply here", "Tag a creator", "Drop your thoughts below").');
  }

  // --- Formatting ---
  let formatting = 5;
  if (lines.length >= 3) formatting += 2; // multi-line is easier to read
  if (lines.length >= 2 && lines.length <= 6) formatting += 1;
  // Emoji as bullet points
  if (/[\u{1F300}-\u{1FAFF}]/u.test(text)) formatting += 1;
  // Line breaks between ideas
  if (text.includes('\n\n')) formatting += 1;
  formatting = Math.min(formatting, 10);
  if (lines.length <= 2 && charCount > 100) {
    suggestions.push('Use line breaks to separate ideas and improve readability.');
  }

  // --- Length ---
  let lengthScore = 7;
  if (charCount < 30) {
    lengthScore = 3;
    suggestions.push('Tweet is very short — add more context.');
  } else if (charCount > 280) {
    lengthScore = 4;
    suggestions.push('Over 280 characters — trim to fit in a single tweet.');
  } else if (charCount >= 71 && charCount <= 200) {
    lengthScore = 10; // sweet spot
  } else if (charCount >= 40 && charCount <= 70) {
    lengthScore = 7;
  } else if (charCount > 200 && charCount <= 280) {
    lengthScore = 7;
  }

  const overallScore = Math.round(
    (clarity + hook + cta + formatting + lengthScore) / 5 * 10
  ) / 10;

  // --- Generate revised tweet ---
  const revised = rewriteDraft(text, suggestions);

  // --- Generate 3 rewrite options ---
  const options = generateRewriteOptions(text, lines, { clarity, hook, cta, formatting, length: lengthScore });

  return {
    overallScore,
    scores: { clarity, hook, cta, formatting, length: lengthScore },
    suggestions,
    revised,
    options,
  };
}

/**
 * Produce a copy-edited version of the draft based on common best practices.
 */
function rewriteDraft(text: string, _suggestions: string[]): string {
  let draft = text.trim();

  // Ensure line breaks between distinct ideas (split on sentence boundaries if single block)
  const lines = draft.split('\n').filter(l => l.trim().length > 0);
  if (lines.length <= 2 && draft.length > 80) {
    // Try to break into logical sections
    draft = draft
      .replace(/([.!?])\s+/g, '$1\n\n')
      .trim();
  }

  return draft;
}

// --- Hook templates used by the rewrite-options generator ---
// These are standalone openers that replace weak first lines entirely.
const HOOK_TEMPLATES = [
  { label: 'Bold Claim', opener: 'Let me put you on to something.' },
  { label: 'Challenge Frame', opener: 'Everyone\'s talking about this. Nobody\'s actually doing it — except me.' },
  { label: 'First Mover', opener: 'Nobody else is doing this yet.' },
  { label: 'Curiosity Gap', opener: 'Most people are sleeping on this.' },
  { label: 'Contrarian', opener: 'This isn\'t what you think it is.' },
  { label: 'Direct Address', opener: 'You need to see this.' },
];

const CLOSER_TEMPLATES = [
  { label: 'Purpose', pattern: () => 'I wish someone had told me this sooner. So I\'m telling you.' },
  { label: 'Momentum', pattern: () => 'This is just the beginning.' },
  { label: 'Confidence', pattern: () => 'Watch this space.' },
  { label: 'Social Proof', pattern: () => 'The people who get it, get it.' },
  { label: 'Urgency', pattern: () => 'Don\'t sleep on this.' },
];

/**
 * Detect if a line has a weak/soft opener that should be replaced entirely.
 */
function hasWeakOpener(line: string): boolean {
  return /^(so,?\s|okay,?\s|i('m| am) so (excited|happy|thrilled)|I think |I believe |I feel like |I just really )/i.test(line);
}

/**
 * Generate 3 rewrite options with different viral strategies.
 *
 * Each option targets the weakest scoring dimension:
 *  - Weak hook  → swap in a stronger opener
 *  - Weak length → trim the body
 *  - Weak cta   → append a stronger closer
 *
 * Returns exactly 3 options so the user can pick their favourite.
 */
function generateRewriteOptions(
  text: string,
  lines: string[],
  scores: { clarity: number; hook: number; cta: number; formatting: number; length: number },
): RewriteOption[] {
  const body = lines.slice(1).join('\n\n');
  const firstLine = lines[0]?.trim() || '';
  const lastLine = lines[lines.length - 1]?.trim() || '';
  const middleLines = lines.slice(1, -1).join('\n\n');

  const options: RewriteOption[] = [];

  const weak = hasWeakOpener(firstLine);

  // --- Option 1: Punch up the hook ---
  {
    const hookIdx = pickTemplateIndex(HOOK_TEMPLATES.length, firstLine);
    const template = HOOK_TEMPLATES[hookIdx];
    // If the opener is weak, replace it; otherwise prepend the hook
    const newLines = weak
      ? [template.opener, ...lines.slice(1)]
      : [template.opener, ...lines];
    options.push({
      label: `${template.label} Hook`,
      strategy: `Replaces the opener with a "${template.label.toLowerCase()}" frame to grab attention faster.`,
      text: newLines.join('\n\n'),
    });
  }

  // --- Option 2: Tighten + stronger closer ---
  {
    const closerIdx = pickTemplateIndex(CLOSER_TEMPLATES.length, lastLine);
    const closer = CLOSER_TEMPLATES[closerIdx];
    const trimmedBody = lines.slice(0, -1).join('\n\n');
    options.push({
      label: `${closer.label} Closer`,
      strategy: `Keeps the body intact but swaps the closer for a "${closer.label.toLowerCase()}" ending that drives engagement.`,
      text: [trimmedBody, closer.pattern()].join('\n\n'),
    });
  }

  // --- Option 3: Full viral rewrite (new hook + trimmed body + new closer) ---
  {
    const hookIdx = pickTemplateIndex(HOOK_TEMPLATES.length, firstLine, 1);
    const closerIdx = pickTemplateIndex(CLOSER_TEMPLATES.length, lastLine, 1);
    const hookTemplate = HOOK_TEMPLATES[hookIdx];
    const closerTemplate = CLOSER_TEMPLATES[closerIdx];

    // Trim the middle: keep strongest lines, drop overly long ones
    const bodyLines = weak ? lines.slice(1, -1) : lines.slice(0, -1);
    const trimmed = bodyLines
      .filter(l => l.trim().length > 0)
      .filter(l => l.length < 200)
      .slice(0, 4);

    options.push({
      label: 'Full Viral Rewrite',
      strategy: `New "${hookTemplate.label.toLowerCase()}" hook, trimmed body, and "${closerTemplate.label.toLowerCase()}" closer for maximum impact.`,
      text: [hookTemplate.opener, ...trimmed, closerTemplate.pattern()].join('\n\n'),
    });
  }

  return options;
}

/**
 * Pick a template index that produces output different from the original text.
 * Uses a simple hash of the text to get variety, with an optional offset.
 */
function pickTemplateIndex(templateCount: number, originalText: string, offset: number = 0): number {
  let hash = 0;
  for (let i = 0; i < originalText.length; i++) {
    hash = ((hash << 5) - hash + originalText.charCodeAt(i)) | 0;
  }
  return Math.abs((hash + offset * 7) % templateCount);
}
