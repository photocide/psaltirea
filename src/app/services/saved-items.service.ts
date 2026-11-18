import { computed, effect, Injectable, signal } from "@angular/core";
import { isVerse, Verse } from "../models/verse";

/** Local-storage key for saved verses. */
const PASSAGES_KEY = "psalter.savedPassages";
/** Local-storage key for saved psalms and personal psalms. */
const PSALMS_KEY = "psalter.savedPsalms";

/** Reads a stored array, retaining only entries accepted by the type guard. */
function readStoredList<T>(
  key: string,
  isItem: (item: unknown) => item is T,
): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

/** A saved composition assembled from existing verses. */
export interface PersonalPsalm {
  /** Discriminator distinguishing personal psalms from numbered psalms. */
  type: "personal";
  /** Stable identifier; absent on legacy saved compositions. */
  id?: string;
  /** User-provided title. */
  title: string;
  /** Ordered source verses in the composition. */
  verses: Verse[];
}

/** A numbered psalm reference or a saved personal composition. */
export type SavedPsalm = number | PersonalPsalm;

/** Validates a stored numbered or personal psalm. */
function isSavedPsalm(item: unknown): item is SavedPsalm {
  if (typeof item === "number") return true;
  if (typeof item !== "object" || item === null) return false;
  const psalm = item as Record<string, unknown>;
  return (
    psalm["type"] === "personal" &&
    (psalm["id"] === undefined || typeof psalm["id"] === "string") &&
    typeof psalm["title"] === "string" &&
    Array.isArray(psalm["verses"]) &&
    psalm["verses"].every(isVerse)
  );
}

/** Returns a reordered copy when both indexes are valid, otherwise the original list. */
function moveItem<T>(list: T[], index: number, target: number): T[] {
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(target) ||
    index < 0 ||
    index >= list.length ||
    target < 0 ||
    target >= list.length
  ) {
    return list;
  }
  if (index === target) return list;
  const reordered = [...list];
  const [item] = reordered.splice(index, 1);
  reordered.splice(target, 0, item);
  return reordered;
}

/** Manages ordered saved verses and psalms backed by local storage. */
@Injectable({ providedIn: "root" })
export class SavedItemsService {
  /** Mutable ordered saved-verse state. */
  private readonly passageState = signal<Verse[]>(
    readStoredList(PASSAGES_KEY, isVerse),
  );
  /** Mutable ordered saved-psalm state. */
  private readonly psalmState = signal<SavedPsalm[]>(
    readStoredList(PSALMS_KEY, isSavedPsalm),
  );

  /** Saved verses in their current order. */
  readonly passages = this.passageState.asReadonly();
  /** Saved numbered and personal psalms in their current order. */
  readonly psalms = this.psalmState.asReadonly();
  /** First saved personal psalm, including legacy entries. */
  readonly personalPsalm = computed(() =>
    this.psalmState().find(
      (psalm): psalm is PersonalPsalm => typeof psalm !== "number",
    ),
  );

  /** Persists changes to both saved-item collections. */
  constructor() {
    effect(() =>
      localStorage.setItem(PASSAGES_KEY, JSON.stringify(this.passageState())),
    );
    effect(() =>
      localStorage.setItem(PSALMS_KEY, JSON.stringify(this.psalmState())),
    );
  }

  /** Checks whether a source verse is saved. */
  isPassageSaved(psalmNumber: number, verseNumber: number): boolean {
    return this.passageState().some(
      (p) => p.psalmNumber === psalmNumber && p.verseNumber === verseNumber,
    );
  }

  /** Adds a verse if absent, or removes it if already saved. */
  togglePassage(verse: Verse): void {
    if (this.isPassageSaved(verse.psalmNumber, verse.verseNumber)) {
      this.removePassage(verse.psalmNumber, verse.verseNumber);
    } else {
      this.passageState.update((list) => [...list, verse]);
    }
  }

  /** Removes the saved verse with the given source reference. */
  removePassage(psalmNumber: number, verseNumber: number): void {
    this.passageState.update((list) =>
      list.filter(
        (p) =>
          !(p.psalmNumber === psalmNumber && p.verseNumber === verseNumber),
      ),
    );
  }

  /** Moves a saved verse between zero-based positions. */
  movePassage(index: number, target: number): void {
    this.passageState.update((list) => moveItem(list, index, target));
  }

  /** Sorts saved verses by psalm and verse number. */
  sortPassages(): void {
    this.passageState.update((list) =>
      [...list].sort(
        (first, second) =>
          first.psalmNumber - second.psalmNumber ||
          first.verseNumber - second.verseNumber,
      ),
    );
  }

  /** Randomizes the complete saved-verse order. */
  shufflePassages(): void {
    this.passageState.update((list) => {
      const shuffled = [...list];
      for (let index = shuffled.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[target]] = [
          shuffled[target],
          shuffled[index],
        ];
      }
      return shuffled;
    });
  }

  /** Checks whether a numbered psalm is saved. */
  isPsalmSaved(psalmNumber: number): boolean {
    return this.psalmState().includes(psalmNumber);
  }

  /** Adds or removes a numbered psalm from saved items. */
  togglePsalm(psalmNumber: number): void {
    if (this.isPsalmSaved(psalmNumber)) {
      this.removePsalm(psalmNumber);
    } else {
      this.psalmState.update((list) => [...list, psalmNumber]);
    }
  }

  /** Removes a numbered psalm from saved items. */
  removePsalm(psalmNumber: number): void {
    this.psalmState.update((list) => list.filter((n) => n !== psalmNumber));
  }

  /** Finds a saved personal psalm by identifier, including the legacy identifier. */
  getPersonalPsalm(id: string): PersonalPsalm | undefined {
    return this.psalmState().find(
      (psalm): psalm is PersonalPsalm =>
        typeof psalm !== "number" && (psalm.id ?? "legacy") === id,
    );
  }

  /** Checks saved titles case-insensitively, optionally excluding one personal psalm. */
  isPsalmTitleTaken(title: string, exceptId?: string): boolean {
    const normalized = title.trim().toLocaleLowerCase();
    return (
      normalized !== "" &&
      this.psalmState().some(
        (psalm) =>
          (typeof psalm === "number" || (psalm.id ?? "legacy") !== exceptId) &&
          (typeof psalm === "number" ? `Psalmul ${psalm}` : psalm.title)
            .trim()
            .toLocaleLowerCase() === normalized,
      )
    );
  }

  /** Saves a new composition when its title and verses are valid and its title is unique. */
  savePersonalPsalm(title: string, verses: Verse[]): void {
    if (!title.trim() || verses.length === 0 || this.isPsalmTitleTaken(title))
      return;
    const personal: PersonalPsalm = {
      type: "personal",
      id: crypto.randomUUID(),
      title: title.trim(),
      verses: [...verses],
    };
    this.psalmState.update((list) => [...list, personal]);
  }

  /** Updates a saved composition in place when its new content and title are valid. */
  updatePersonalPsalm(id: string, title: string, verses: Verse[]): void {
    if (
      !title.trim() ||
      verses.length === 0 ||
      this.isPsalmTitleTaken(title, id)
    )
      return;
    this.psalmState.update((list) =>
      list.map((psalm) =>
        typeof psalm !== "number" && (psalm.id ?? "legacy") === id
          ? { ...psalm, title: title.trim(), verses: [...verses] }
          : psalm,
      ),
    );
  }

  /** Removes a saved personal psalm by identifier. */
  removePersonalPsalm(id: string): void {
    this.psalmState.update((list) =>
      list.filter(
        (psalm) => typeof psalm === "number" || (psalm.id ?? "legacy") !== id,
      ),
    );
  }

  /** Sorts numbered psalms while preserving personal psalms in place. */
  sortPsalms(): void {
    this.psalmState.update((list) => {
      const numbers = list
        .filter((psalm): psalm is number => typeof psalm === "number")
        .sort((first, second) => first - second);
      let index = 0;
      return list.map((psalm) =>
        typeof psalm === "number" ? numbers[index++] : psalm,
      );
    });
  }

  /** Moves a saved psalm between zero-based positions. */
  movePsalm(index: number, target: number): void {
    this.psalmState.update((list) => moveItem(list, index, target));
  }
}
