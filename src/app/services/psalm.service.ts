import { computed, Injectable } from "@angular/core";
import psalmsData from "../data/psalms.json";
import { Verse } from "../models/verse";
import { normalizeText, wordsOf } from "../utils/text";

/** Recognizes a psalm number with an optional verse number. */
const REFERENCE_PATTERN =
  /^(?:psalmul|psalmii|psalm|ps)?\s*(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?$/;

/** Psalm text indexed by zero-based psalm and verse positions. */
const PSALMS: string[][] = psalmsData;

/** Flattened verse records with one-based source references. */
const VERSE_LIST: Verse[] = PSALMS.flatMap((verses, psalmIndex) =>
  verses.map((text, verseIndex) => ({
    psalmNumber: psalmIndex + 1,
    verseNumber: verseIndex + 1,
    text,
  })),
);

/** Numbers of psalms with at least one available verse. */
const AVAILABLE_PSALMS: number[] = PSALMS.flatMap((verses, psalmIndex) =>
  verses.length > 0 ? [psalmIndex + 1] : [],
);

/** Provides psalm text, reference lookup, and normalized text search. */
@Injectable({ providedIn: "root" })
export class PsalmService {
  /** Psalm numbers for which text is available. */
  readonly availablePsalms = computed(() => AVAILABLE_PSALMS);
  /** Remaining psalms in the current randomized pass. */
  private randomPsalmQueue: number[] = [];
  /** Most recently returned random psalm. */
  private lastRandomPsalm: number | null = null;

  /** Returns a new random psalm, exhausting the collection before repeating. */
  nextRandomPsalm(): number | null {
    if (this.randomPsalmQueue.length === 0) {
      this.randomPsalmQueue = [...AVAILABLE_PSALMS];
      for (let index = this.randomPsalmQueue.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [this.randomPsalmQueue[index], this.randomPsalmQueue[target]] = [
          this.randomPsalmQueue[target],
          this.randomPsalmQueue[index],
        ];
      }
      if (
        this.randomPsalmQueue.length > 1 &&
        this.randomPsalmQueue[this.randomPsalmQueue.length - 1] ===
          this.lastRandomPsalm
      ) {
        [
          this.randomPsalmQueue[0],
          this.randomPsalmQueue[this.randomPsalmQueue.length - 1],
        ] = [
          this.randomPsalmQueue[this.randomPsalmQueue.length - 1],
          this.randomPsalmQueue[0],
        ];
      }
    }

    const number = this.randomPsalmQueue.pop();
    if (number === undefined) return null;
    this.lastRandomPsalm = number;
    return number;
  }

  /** Returns all verses belonging to a one-based psalm number. */
  versesOf(psalmNumber: number): Verse[] {
    return VERSE_LIST.filter((v) => v.psalmNumber === psalmNumber);
  }

  /** Returns normalized highlight terms, or none for a reference query. */
  highlightWords(query: string): string[] {
    return REFERENCE_PATTERN.test(normalizeText(query.trim()))
      ? []
      : wordsOf(query);
  }

  /** Finds verses by reference or by matching every normalized query word. */
  search(query: string): Verse[] {
    const normalized = normalizeText(query.trim());
    if (!normalized) return [];

    const reference = REFERENCE_PATTERN.exec(normalized);
    if (reference) {
      const psalmNumber = Number(reference[1]);
      const verseNumber = reference[2] ? Number(reference[2]) : null;
      return VERSE_LIST.filter(
        (v) =>
          v.psalmNumber === psalmNumber &&
          (verseNumber === null || v.verseNumber === verseNumber),
      );
    }

    const queryWords = wordsOf(query);
    if (queryWords.length === 0) return [];
    return VERSE_LIST.filter((v) => {
      const verseWords = wordsOf(v.text);
      return queryWords.every((queryWord) =>
        verseWords.some((word) => word.includes(queryWord)),
      );
    });
  }
}
