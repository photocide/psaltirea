/** A verse together with its source psalm and verse numbers. */
export interface Verse {
  /** One-based source psalm number. */
  psalmNumber: number;
  /** One-based verse number within the source psalm. */
  verseNumber: number;
  /** Original verse text. */
  text: string;
}

/** Checks whether an unknown value has the fields required by {@link Verse}. */
export function isVerse(item: unknown): item is Verse {
  if (typeof item !== "object" || item === null) return false;
  const verse = item as Record<string, unknown>;
  return (
    typeof verse["psalmNumber"] === "number" &&
    typeof verse["verseNumber"] === "number" &&
    typeof verse["text"] === "string"
  );
}
