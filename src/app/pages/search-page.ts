import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { debounceTime } from "rxjs";
import { PsalmService } from "../services/psalm.service";
import { SearchStateService } from "../services/search-state.service";
import { SavedItemsService } from "../services/saved-items.service";
import { splitForHighlight, TextSegment } from "../utils/text";
import { BackButton } from "../components/back-button";
import { Paginator } from "../components/paginator";
import { AppIcon } from "../components/app-icon";

/** Displays debounced search results with highlighting and pagination. */
@Component({
  selector: "app-search-page",
  imports: [RouterLink, BackButton, Paginator, AppIcon],
  template: `
    <header class="page-header">
      <div class="page-title">
        <app-back-button />
        <h1>Căutare</h1>
      </div>
      <p class="muted">
        Scrieți în bara de sus un cuvânt (ex. pace), mai multe cuvinte, sau un
        pasaj (ex. 23:1 sau psalmul 1).
      </p>
    </header>

    @if (query().trim() === "") {
      <p class="status">
        Începeți să scrieți în bara de sus pentru a vedea rezultatele.
      </p>
    } @else {
      <p class="muted results-count">{{ resultsLabel() }}</p>
      <ul class="result-list">
        @for (
          verse of pageResults();
          track verse.psalmNumber + ":" + verse.verseNumber
        ) {
          <li class="result">
            <div class="result-body">
              <p class="result-ref">
                <a
                  [routerLink]="['/psalmi', verse.psalmNumber]"
                  [fragment]="'verset-' + verse.verseNumber"
                  >Psalmul {{ verse.psalmNumber }}:{{ verse.verseNumber }}</a
                >
              </p>
              <p
                class="result-text"
                [class.is-saved]="
                  saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
                "
              >
                <a
                  [routerLink]="['/psalmi', verse.psalmNumber]"
                  [fragment]="'verset-' + verse.verseNumber"
                >
                  @for (segment of segmentsOf(verse.text); track $index) {
                    @if (segment.highlight) {
                      <mark>{{ segment.text }}</mark>
                    } @else {
                      <span>{{ segment.text }}</span>
                    }
                  }
                </a>
              </p>
            </div>
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
              (click)="saved.togglePassage(verse)"
            >
              <app-icon name="bookmark" />
            </button>
          </li>
        }
      </ul>
      @if (results().length > 0) {
        <app-paginator
          ariaLabel="Paginarea rezultatelor"
          pageSizeLabel="Rezultate pe pagină"
          storageKey="psalter.pageSize.search"
          [page]="page()"
          [pageCount]="pageCount()"
          [pageSize]="pageSize()"
          (pageChange)="changePage($event)"
          (pageSizeChange)="setPageSize($event)"
        />
      }
    }
  `,
})
export class SearchPage {
  /** Source of search results and highlight terms. */
  protected readonly psalms = inject(PsalmService);
  /** Saved-verse state and actions. */
  protected readonly saved = inject(SavedItemsService);
  /** Shared global search input and remembered query. */
  private readonly searchState = inject(SearchStateService);
  /** Search query delayed until typing pauses. */
  protected readonly query = toSignal(
    toObservable(this.searchState.query).pipe(debounceTime(180)),
    { initialValue: "" },
  );
  /** Maximum number of results shown per page. */
  protected readonly pageSize = signal(12);
  /** All matches for the debounced query. */
  protected readonly results = computed(() => this.psalms.search(this.query()));
  /** Zero-based page, reset when the query changes. */
  protected readonly page = linkedSignal(() => {
    this.query();
    this.pageSize();
    return 0;
  });
  /** Number of result pages. */
  protected readonly pageCount = computed(() =>
    Math.ceil(this.results().length / this.pageSize()),
  );
  /** Results displayed on the current page. */
  protected readonly pageResults = computed(() => {
    const start = this.page() * this.pageSize();
    return this.results().slice(start, start + this.pageSize());
  });
  /** Normalized terms to highlight in result text. */
  private readonly highlights = computed(() =>
    this.psalms.highlightWords(this.query()),
  );
  /** Localized label describing the total number of matches. */
  protected readonly resultsLabel = computed(() => {
    const count = this.results().length;
    if (count === 0) return "Nu am găsit niciun rezultat.";
    return count === 1 ? "Un rezultat găsit." : `${count} rezultate găsite.`;
  });

  /** Restores the remembered query when the page is opened. */
  constructor() {
    this.searchState.restoreQuery();
  }

  /** Splits result text into segments for highlighting the current query. */
  protected segmentsOf(text: string): TextSegment[] {
    return splitForHighlight(text, this.highlights());
  }

  /** Changes the result page and scrolls to the top. */
  protected changePage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0 });
  }

  /** Selects a supported page size and returns to the first page. */
  protected setPageSize(pageSize: number): void {
    if ([12, 24, 50, 100, 150].includes(pageSize)) {
      this.pageSize.set(pageSize);
    }
  }

  /** Clears the global input while retaining the remembered query. */
  ngOnDestroy(): void {
    this.searchState.clearInput();
  }
}
