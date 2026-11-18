/** A contiguous portion of text and whether it should be highlighted. */
export interface TextSegment {
  /** Original text in this segment. */
  text: string;
  /** Whether the segment matches a search term. */
  highlight: boolean;
}

/** Lowercases text and removes combining marks for accent-insensitive matching. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Extracts normalized letter and number tokens from text. */
export function wordsOf(value: string): string[] {
  return normalizeText(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
}

/** Matches text tokens while retaining combining marks in the original text. */
const TOKEN_PATTERN = /[\p{L}\p{N}\p{M}]+/gu;

/** Maps normalized word matches back to positions in an original token. */
function matchedCharacters(token: string, words: string[]): boolean[] {
  const characters = Array.from(token);
  const folded = characters
    .map((character) => normalizeText(character))
    .join("");
  const owners: number[] = [];
  characters.forEach((character, index) => {
    for (let unit = 0; unit < normalizeText(character).length; unit++)
      owners.push(index);
  });

  const matched = characters.map(() => false);
  for (const word of words) {
    let from = folded.indexOf(word);
    while (from !== -1) {
      for (let unit = from; unit < from + word.length; unit++)
        matched[owners[unit]] = true;
      from = folded.indexOf(word, from + word.length);
    }
  }
  return matched;
}

/** Splits original text into adjacent highlighted and unhighlighted segments. */
export function splitForHighlight(
  text: string,
  words: string[],
): TextSegment[] {
  const segments: TextSegment[] = [];
  const append = (value: string, highlight: boolean) => {
    const last = segments[segments.length - 1];
    if (last && last.highlight === highlight) {
      last.text += value;
    } else {
      segments.push({ text: value, highlight });
    }
  };

  let lastIndex = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      append(text.slice(lastIndex, start), false);
    }
    const token = match[0];
    const matched = matchedCharacters(token, words);
    Array.from(token).forEach((character, index) =>
      append(character, matched[index]),
    );
    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    append(text.slice(lastIndex), false);
  }
  return segments;
}
