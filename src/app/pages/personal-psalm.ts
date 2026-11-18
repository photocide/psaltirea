import { Component, computed, inject, signal } from "@angular/core";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { BackButton } from "../components/back-button";
import { AppIcon } from "../components/app-icon";
import { Verse } from "../models/verse";
import { PsalmService } from "../services/psalm.service";
import { SavedItemsService } from "../services/saved-items.service";

/** Editable title and ordered verses for a personal psalm draft. */
interface PersonalPsalm {
  /** Draft title. */
  title: string;
  /** Source verses in the draft's current order. */
  verses: Verse[];
}

/** Creates or edits a personal psalm using verses from the library. */
@Component({
  selector: "app-personal-psalm",
  imports: [
    BackButton,
    AppIcon,
    RouterLink,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  template: `
    <header class="page-header row">
      <div class="page-title">
        <app-back-button />
        <h1>{{ editId === null ? "Psalmul meu" : "Editează psalmul" }}</h1>
      </div>
      <button
        class="icon-btn"
        type="button"
        [class.is-saved]="isSaved()"
        [attr.aria-label]="isSaved() ? 'Psalm salvat' : 'Salvează psalmul'"
        [title]="isSaved() ? 'Psalm salvat' : 'Salvează psalmul'"
        [disabled]="
          !canEdit() ||
          draft().verses.length === 0 ||
          !draft().title.trim() ||
          titleTaken() ||
          isSaved()
        "
        (click)="save()"
      >
        <app-icon name="bookmark" />
      </button>
    </header>

    @if (!canEdit()) {
      <p class="status">Nu am găsit psalmul personal salvat.</p>
    } @else {
      <div class="personal-editor">
        <section class="personal-composition" aria-labelledby="personal-title">
          <div class="personal-heading">
            <h2 id="personal-title">Psalmul meu</h2>
          </div>
          <label class="personal-field">
            <span>Titlu</span>
            <input
              type="text"
              placeholder="Titlul psalmului"
              required
              [attr.aria-invalid]="titleTaken() && !isSaved() ? 'true' : null"
              [attr.aria-describedby]="
                titleTaken() && !isSaved() ? 'title-error' : null
              "
              [value]="draft().title"
              (input)="setTitle($event)"
            />
          </label>
          @if (titleTaken() && !isSaved()) {
            <p id="title-error" class="status error">
              Există deja un psalm cu acest titlu.
            </p>
          }
          @if (draft().verses.length === 0) {
            <p class="status">Nu ați adăugat niciun verset.</p>
          } @else {
            <ol
              class="result-list personal-verses"
              cdkDropList
              (cdkDropListDropped)="drop($event)"
            >
              @for (verse of draft().verses; track $index; let index = $index) {
                <li class="result" cdkDrag>
                  <div class="result-body">
                    <p class="result-ref">
                      <a
                        [routerLink]="['/psalmi', verse.psalmNumber]"
                        [fragment]="'verset-' + verse.verseNumber"
                        >Psalmul {{ verse.psalmNumber }}:{{
                          verse.verseNumber
                        }}</a
                      >
                    </p>
                    <p
                      class="result-text"
                      [class.is-saved]="
                        saved.isPassageSaved(
                          verse.psalmNumber,
                          verse.verseNumber
                        )
                      "
                    >
                      {{ verse.text }}
                    </p>
                  </div>
                  <div class="saved-actions">
                    <button
                      class="icon-btn drag-handle"
                      type="button"
                      cdkDragHandle
                      [attr.aria-label]="'Reordonează versetul ' + (index + 1)"
                      title="Reordonează versetul"
                      (keydown)="moveWithKeyboard($event, index)"
                    >
                      <app-icon name="drag" />
                    </button>
                    <button
                      class="icon-btn"
                      type="button"
                      [attr.aria-label]="'Elimină versetul ' + (index + 1)"
                      title="Elimină versetul"
                      (click)="removeVerse(index)"
                    >
                      <app-icon name="close" />
                    </button>
                  </div>
                </li>
              }
            </ol>
          }
        </section>

        <section class="personal-source" aria-labelledby="source-title">
          <h2 id="source-title">Adaugă versete</h2>
          <label class="personal-source-toggle">
            <input
              type="checkbox"
              [checked]="showSavedVerses()"
              [disabled]="saved.passages().length === 0"
              (change)="setSavedVerseSource($event)"
            />
            <span>Versete salvate</span>
          </label>
          @if (!showSavedVerses()) {
            <div class="personal-field">
              <label for="source-psalm">Psalm</label>
              <div class="psalm-selector">
                <input
                  #sourceInput
                  id="source-psalm"
                  type="text"
                  role="combobox"
                  autocomplete="off"
                  aria-autocomplete="list"
                  aria-controls="source-psalm-options"
                  [attr.aria-expanded]="selectorOpen()"
                  [attr.aria-activedescendant]="
                    selectorOpen() && filteredPsalms().length
                      ? 'source-psalm-' + filteredPsalms()[activeSourceIndex()]
                      : null
                  "
                  [value]="
                    selectorOpen() ? sourceSearch() : 'Psalmul ' + sourcePsalm()
                  "
                  placeholder="Caută psalm"
                  (focus)="openSelector()"
                  (click)="openSelector()"
                  (blur)="selectorOpen.set(false)"
                  (input)="searchSources($event)"
                  (keydown)="sourceKeydown($event)"
                />
                <button
                  class="icon-btn psalm-selector-toggle"
                  type="button"
                  aria-label="Deschide lista de psalmi"
                  (click)="sourceInput.focus()"
                >
                  <app-icon name="chevron-down" />
                </button>
                @if (selectorOpen()) {
                  <ul
                    class="psalm-options"
                    id="source-psalm-options"
                    role="listbox"
                    aria-label="Psalmi"
                  >
                    @for (
                      number of filteredPsalms();
                      track number;
                      let index = $index
                    ) {
                      <li
                        role="option"
                        [id]="'source-psalm-' + number"
                        [attr.aria-selected]="number === sourcePsalm()"
                        [class.active]="index === activeSourceIndex()"
                        (pointerdown)="$event.preventDefault()"
                        (click)="chooseSource(number)"
                      >
                        Psalmul {{ number }}
                      </li>
                    } @empty {
                      <li class="psalm-options-empty" role="presentation">
                        Nu am găsit niciun psalm.
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }
          <ul class="result-list personal-source-list">
            @for (
              verse of sourceVerses();
              track verse.psalmNumber + ":" + verse.verseNumber
            ) {
              <li class="result">
                <div class="result-body">
                  <p class="result-ref">
                    {{ verse.psalmNumber }}:{{ verse.verseNumber }}
                  </p>
                  <p
                    class="result-text"
                    [class.is-saved]="
                      saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
                    "
                  >
                    {{ verse.text }}
                  </p>
                </div>
                <button
                  class="icon-btn"
                  type="button"
                  [attr.aria-label]="
                    'Adaugă versetul ' +
                    verse.psalmNumber +
                    ':' +
                    verse.verseNumber
                  "
                  title="Adaugă versetul"
                  (click)="addVerse(verse)"
                >
                  <app-icon name="plus" />
                </button>
              </li>
            }
          </ul>
        </section>
      </div>
    }
  `,
})
export class PersonalPsalmPage {
  /** Source of available psalms and their verses. */
  protected readonly psalms = inject(PsalmService);
  /** Saved composition storage and title validation. */
  protected readonly saved = inject(SavedItemsService);
  /** Identifier of the composition being edited, or null for a new draft. */
  protected readonly editId =
    inject(ActivatedRoute).snapshot.paramMap.get("id");
  /** Whether the route refers to a new draft or an existing composition. */
  protected readonly canEdit = computed(
    () => this.editId === null || !!this.saved.getPersonalPsalm(this.editId),
  );
  /** Saved composition used to initialize an editing draft. */
  private readonly original =
    this.editId === null ? undefined : this.saved.getPersonalPsalm(this.editId);
  /** Current in-memory composition being edited. */
  protected readonly draft = signal<PersonalPsalm>(
    this.original
      ? { title: this.original.title, verses: [...this.original.verses] }
      : { title: "", verses: [] },
  );
  /** Whether another saved psalm already uses the draft title. */
  protected readonly titleTaken = computed(() =>
    this.saved.isPsalmTitleTaken(this.draft().title, this.editId ?? undefined),
  );
  /** Whether the draft matches an already saved composition. */
  protected readonly isSaved = computed(() => {
    const draft = this.draft();
    return this.saved
      .psalms()
      .some(
        (saved) =>
          typeof saved !== "number" &&
          (this.editId === null || (saved.id ?? "legacy") === this.editId) &&
          saved.title === draft.title.trim() &&
          JSON.stringify(saved.verses) === JSON.stringify(draft.verses),
      );
  });
  /** Psalm selected as the source of verses. */
  protected readonly sourcePsalm = signal(
    this.psalms.availablePsalms()[0] ?? 1,
  );
  /** Whether the verse selector uses the saved-verse collection. */
  protected readonly showSavedVerses = signal(false);
  /** Search text used to filter source psalms. */
  protected readonly sourceSearch = signal("");
  /** Whether the source-psalm selector is open. */
  protected readonly selectorOpen = signal(false);
  /** Keyboard-active option index within the filtered source psalms. */
  protected readonly activeSourceIndex = signal(0);
  /** Available source psalms matching the selector's search text. */
  protected readonly filteredPsalms = computed(() => {
    const query = this.sourceSearch().trim().toLowerCase();
    return this.psalms
      .availablePsalms()
      .filter((number) => `psalmul ${number}`.includes(query));
  });
  /** Verses available from the selected psalm or the saved-verse collection. */
  protected readonly sourceVerses = computed(() =>
    this.showSavedVerses()
      ? this.saved.passages()
      : this.psalms.versesOf(this.sourcePsalm()),
  );

  /** Saves a valid new draft or updates the composition being edited. */
  protected save(): void {
    const draft = this.draft();
    if (
      this.canEdit() &&
      draft.title.trim() &&
      draft.verses.length > 0 &&
      !this.titleTaken() &&
      !this.isSaved()
    ) {
      if (this.editId === null)
        this.saved.savePersonalPsalm(draft.title, draft.verses);
      else
        this.saved.updatePersonalPsalm(this.editId, draft.title, draft.verses);
    }
  }

  /** Updates the draft title from the input event. */
  protected setTitle(event: Event): void {
    const title = (event.target as HTMLInputElement).value;
    this.draft.update((draft) => ({ ...draft, title }));
  }

  /** Switches between saved verses and verses from the selected psalm. */
  protected setSavedVerseSource(event: Event): void {
    this.showSavedVerses.set((event.target as HTMLInputElement).checked);
  }

  /** Opens the source selector with its search and active option reset. */
  protected openSelector(): void {
    if (this.selectorOpen()) return;
    this.sourceSearch.set("");
    this.activeSourceIndex.set(0);
    this.selectorOpen.set(true);
  }

  /** Updates the source-psalm filter from the input event. */
  protected searchSources(event: Event): void {
    this.sourceSearch.set((event.target as HTMLInputElement).value);
    this.activeSourceIndex.set(0);
  }

  /** Selects a source psalm, closes the selector, and removes input focus. */
  protected chooseSource(number: number): void {
    this.sourcePsalm.set(number);
    this.selectorOpen.set(false);
    (
      document.getElementById("source-psalm") as HTMLInputElement | null
    )?.blur();
  }

  /** Handles keyboard navigation and selection in the source-psalm selector. */
  protected sourceKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.selectorOpen.set(false);
      return;
    }
    if (
      !this.selectorOpen() &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      this.openSelector();
      return;
    }
    if (!this.selectorOpen()) return;
    const matches = this.filteredPsalms();
    if (event.key === "Enter" && matches.length > 0) {
      event.preventDefault();
      this.chooseSource(matches[this.activeSourceIndex()]);
    } else if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      matches.length > 0
    ) {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const index = Math.max(
        0,
        Math.min(matches.length - 1, this.activeSourceIndex() + offset),
      );
      this.activeSourceIndex.set(index);
      document
        .getElementById(`source-psalm-${matches[index]}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }

  /** Appends a source verse to the draft. */
  protected addVerse(verse: Verse): void {
    this.draft.update((draft) => ({
      ...draft,
      verses: [...draft.verses, verse],
    }));
  }

  /** Removes the verse at the given draft position. */
  protected removeVerse(index: number): void {
    this.draft.update((draft) => ({
      ...draft,
      verses: draft.verses.filter((_, verseIndex) => verseIndex !== index),
    }));
  }

  /** Reorders a draft verse after it is dropped. */
  protected drop(event: CdkDragDrop<unknown>): void {
    this.moveVerse(event.previousIndex, event.currentIndex);
  }

  /** Moves a draft verse using arrow keys on its drag handle. */
  protected moveWithKeyboard(event: KeyboardEvent, index: number): void {
    const offset =
      event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (offset === 0) return;
    event.preventDefault();
    this.moveVerse(index, index + offset);
  }

  /** Moves a draft verse to a valid zero-based target position. */
  private moveVerse(index: number, target: number): void {
    this.draft.update((draft) => {
      if (target < 0 || target >= draft.verses.length || index === target)
        return draft;
      const verses = [...draft.verses];
      moveItemInArray(verses, index, target);
      return { ...draft, verses };
    });
  }
}
