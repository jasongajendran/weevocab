import React from 'react';

/**
 * Escapes regex special characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightedTextProps {
  text: string;
  targetWord: string;
  colorClass?: string;
}

/**
 * Renders text with targetWord (and case-insensitive/stem variants) highlighted
 * in a clean, snug inline highlighter style that fits the word perfectly.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  targetWord,
  colorClass,
}) => {
  if (!text || !targetWord) return <>{text}</>;

  const cleanWord = targetWord.trim().replace(/[^\w'-]/g, '');
  if (!cleanWord) return <>{text}</>;

  const escaped = escapeRegExp(cleanWord);
  // Match target word, optional plural or common suffixes
  const pattern = `\\b(${escaped}(?:s|ed|ing|ly|es|y|ness|'s)?)\\b`;
  const regex = new RegExp(pattern, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Snug, natural highlighter themes that fit closely around words
  const colorThemes = [
    'bg-amber-200/90 text-amber-950 font-bold px-1 py-0.5 rounded-sm',
    'bg-yellow-200/90 text-yellow-950 font-bold px-1 py-0.5 rounded-sm',
    'bg-sky-200/90 text-sky-950 font-bold px-1 py-0.5 rounded-sm',
    'bg-emerald-200/90 text-emerald-950 font-bold px-1 py-0.5 rounded-sm',
    'bg-pink-200/90 text-pink-950 font-bold px-1 py-0.5 rounded-sm',
    'bg-purple-200/90 text-purple-950 font-bold px-1 py-0.5 rounded-sm',
  ];

  const defaultTheme = colorThemes[cleanWord.length % colorThemes.length];
  const chosenClass = colorClass || defaultTheme;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    parts.push(
      <mark
        key={match.index}
        className={`inline ${chosenClass} not-italic`}
      >
        {match[0]}
      </mark>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
};

