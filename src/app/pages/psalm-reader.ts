import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { PsalmService } from "../services/psalm.service";
import { SavedItemsService } from "../services/saved-items.service";
import { Verse } from "../models/verse";
import { BackButton } from "../components/back-button";
import { AppIcon } from "../components/app-icon";

/** Displays a numbered psalm with saving and adjacent-psalm navigation. */
@Component({
  selector: "app-psalm-reader",
  imports: [RouterLink, BackButton, AppIcon],
  template: `
    <header class="page-header row">
      <div class="page-title">
        <app-back-button />
        <h1 [class.is-saved]="saved.isPsalmSaved(psalmNumber())">
          Psalmul {{ psalmNumber() }}
        </h1>
      </div>
      @if (verses().length > 0) {
        <button
          class="icon-btn"
          type="button"
          [class.is-saved]="saved.isPsalmSaved(psalmNumber())"
          [attr.aria-label]="
            saved.isPsalmSaved(psalmNumber())
              ? 'Scoate psalmul din salvate'
              : 'Salvează psalmul'
          "
          [title]="
            saved.isPsalmSaved(psalmNumber())
              ? 'Psalm salvat'
              : 'Salvează psalmul'
          "
          (click)="saved.togglePsalm(psalmNumber())"
        >
          <app-icon name="bookmark" />
        </button>
      }
    </header>

    @if (verses().length === 0) {
      <p class="status">
        Textul psalmului {{ number() }} nu este disponibil încă.
      </p>
    } @else {
      <article class="reading">
        @for (verse of verses(); track verse.verseNumber) {
          <p class="verse" [id]="'verset-' + verse.verseNumber">
            <span class="verse-number">{{ verse.verseNumber }}</span>
            <span
              class="verse-text"
              [class.is-saved]="
                saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
              "
              >{{ verse.text }}</span
            >
            <button
              class="icon-btn"
              type="button"
              [class.is-saved]="
                saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
              "
              [attr.aria-label]="
                saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
                  ? 'Scoate pasajul din salvate'
                  : 'Salvează pasajul'
              "
              (click)="toggleVerse(verse)"
            >
              <app-icon name="bookmark" />
            </button>
          </p>
        }
      </article>

      <nav class="pager">
        @if (previousPsalm(); as previous) {
          <a
            class="btn"
            [routerLink]="['/psalmi', previous]"
            (click)="scrollToTop($event)"
            >← Psalmul {{ previous }}</a
          >
        } @else {
          <span></span>
        }
        @if (nextPsalm(); as next) {
          <a
            class="btn"
            [routerLink]="['/psalmi', next]"
            (click)="scrollToTop($event)"
            >Psalmul {{ next }} →</a
          >
        }
      </nav>
    }
  `,
})
export class PsalmReader {
  /** Psalm number supplied by the route. */
  readonly number = input.required<string>();

  /** Source of psalm and verse data. */
  protected readonly psalms = inject(PsalmService);
  /** Saved-psalm and verse actions. */
  protected readonly saved = inject(SavedItemsService);
  /** Injector used to schedule scrolling after the reader renders. */
  private readonly injector = inject(Injector);
  /** Requested verse fragment from the current route. */
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment, {
    initialValue: null,
  });

  /** Numeric form of the route's psalm number. */
  protected readonly psalmNumber = computed(() => Number(this.number()));
  /** Verses for the current psalm. */
  protected readonly verses = computed(() =>
    this.psalms.versesOf(this.psalmNumber()),
  );

  /** Previous available psalm number, if one exists. */
  protected readonly previousPsalm = computed(() => {
    const list = this.psalms.availablePsalms();
    const index = list.indexOf(this.psalmNumber());
    return index > 0 ? list[index - 1] : null;
  });

  /** Next available psalm number, if one exists. */
  protected readonly nextPsalm = computed(() => {
    const list = this.psalms.availablePsalms();
    const index = list.indexOf(this.psalmNumber());
    return index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  });

  /** Scrolls to a linked verse after the current psalm has rendered. */
  constructor() {
    effect(() => {
      const fragment = this.fragment();
      const psalmNumber = this.psalmNumber();
      if (!fragment || !/^verset-\d+$/.test(fragment)) return;
      afterNextRender(
        () => {
          if (
            this.fragment() === fragment &&
            this.psalmNumber() === psalmNumber
          ) {
            document
              .getElementById(fragment)
              ?.scrollIntoView({ block: "start" });
          }
        },
        { injector: this.injector },
      );
    });
  }

  /** Resets the scroll position for navigation in the current tab. */
  protected scrollToTop(event: MouseEvent): void {
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      window.scrollTo({ top: 0 });
    }
  }

  /** Toggles whether the given verse is saved. */
  protected toggleVerse(verse: Verse): void {
    this.saved.togglePassage(verse);
  }
}
