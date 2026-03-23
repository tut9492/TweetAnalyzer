import { DraftScoreResult } from '../twitter/types';

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
  let length = 7;
  if (charCount < 30) {
    length = 3;
    suggestions.push('Tweet is very short — add more context.');
  } else if (charCount > 280) {
    length = 4;
    suggestions.push('Over 280 characters — trim to fit in a single tweet.');
  } else if (charCount >= 71 && charCount <= 200) {
    length = 10; // sweet spot
  } else if (charCount >= 40 && charCount <= 70) {
    length = 7;
  } else if (charCount > 200 && charCount <= 280) {
    length = 7;
  }

  const overallScore = Math.round(
    (clarity + hook + cta + formatting + length) / 5 * 10
  ) / 10;

  // --- Generate revised tweet ---
  const revised = rewriteDraft(text, suggestions);

  return {
    overallScore,
    scores: { clarity, hook, cta, formatting, length },
    suggestions,
    revised,
  };
}

/**
 * Produce a copy-edited version of the draft based on common best practices.
 */
function rewriteDraft(text: string, suggestions: string[]): string {
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
