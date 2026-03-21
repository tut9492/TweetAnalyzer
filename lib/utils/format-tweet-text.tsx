import React from 'react';

/**
 * Formats tweet text so that numbered list items have their number and
 * first sentence rendered in bold, matching X's display style.
 *
 * Detects lines starting with a number + period (e.g. "1.", "2.") and
 * bolds everything up to (and including) the first sentence-ending punctuation.
 */
export function formatTweetText(text: string): React.ReactNode {
  // Split on newlines, preserving them
  const lines = text.split('\n');

  // Regex: line starts with a number and period, capture the number+period+first sentence, then the rest
  // First sentence ends at the first ". " or "." followed by end-of-line, or "!" or "?"
  const numberedLineRegex = /^(\d+\.\s*.+?[.!?])(\s.+)?$/;

  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (i > 0) {
      elements.push('\n');
    }

    const match = line.match(numberedLineRegex);
    if (match) {
      elements.push(
        <strong key={`bold-${i}`} className="font-bold text-white">
          {match[1]}
        </strong>
      );
      if (match[2]) {
        elements.push(match[2]);
      }
    } else {
      elements.push(line);
    }
  });

  return <>{elements}</>;
}
