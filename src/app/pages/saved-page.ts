import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from "@angular/core";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from "@angular/cdk/drag-drop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { SavedItemsService } from "../services/saved-items.service";
import { BackButton } from "../components/back-button";
import { Paginator } from "../components/paginator";
import { AppIcon } from "../components/app-icon";

/** Displays and reorders paginated saved psalms or verses. */
@Component({
  selector: "app-saved-page",
  imports: [
    RouterLink,
    BackButton,
    Paginator,
    AppIcon,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  template: `
    <header class="page-header row">
      <div class="page-title">
        <app-back-button />
        <h1>{{ kind === "psalms" ? "Psalmi salvați" : "Versete salvate" }}</h1>
      </div>
      @if (kind === "verses") {
        <div class="saved-header-actions">
          <button
            class="icon-btn"
            type="button"
            aria-label="Amestecă versetele"
            title="Amestecă versetele"
            [disabled]="saved.passages().length < 2"
            (click)="shufflePassages()"
          >
            <app-icon name="shuffle" [size]="20" />
          </button>
          <button
            class="icon-btn"
            type="button"
            aria-label="Sortează versetele numeric"
            title="Sortează versetele numeric"
            [disabled]="saved.passages().length < 2"
            (click)="sortPassages()"
          >
            <app-icon name="sort" [size]="20" />
          </button>
        </div>
      }
    </header>

    @if (kind === "verses") {
      <section>
        @if (saved.passages().length === 0) {
          <p class="status">
            Nu aveți versete salvate. Apăsați pe iconița de marcaj lângă un
            verset.
          </p>
        } @else {
          <ul
            class="result-list"
            cdkDropList
            (cdkDropListDropped)="drop($event)"
          >
            @for (
              verse of pagePassages();
              track verse.psalmNumber + ":" + verse.verseNumber;
              let index = $index
            ) {
              <li class="result saved-result" cdkDrag>
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
                  <p class="result-text">{{ verse.text }}</p>
                </div>
                <div class="saved-actions">
                  <button
                    class="icon-btn drag-handle"
                    type="button"
                    cdkDragHandle
                    [attr.aria-label]="
                      'Reordonează versetul ' +
                      verse.psalmNumber +
                      ':' +
                      verse.verseNumber
                    "
                    title="Reordonează versetul"
                    (keydown)="moveWithKeyboard($event, index)"
                  >
                    <app-icon name="drag" />
                  </button>
                  <button
                    class="icon-btn"
                    type="button"
                    aria-label="Șterge versetul din salvate"
                    (click)="
                      removePassage(verse.psalmNumber, verse.verseNumber)
                    "
                  >
                    <app-icon name="close" />
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </section>
    } @else {
      @for (
        group of [psalmGroups()[1], psalmGroups()[0]];
        track group.personal
      ) {
        <section class="saved-psalm-section">
          <div class="saved-psalm-heading">
            <h2>{{ group.personal ? "Psalmi personali" : "Psalmi" }}</h2>
            @if (!group.personal) {
              <button
                class="icon-btn"
                type="button"
                aria-label="Sortează psalmii numeric"
                title="Sortează psalmii numeric"
                [disabled]="group.items.length < 2"
                (click)="sortPsalms()"
              >
                <app-icon name="sort" [size]="20" />
              </button>
            }
          </div>
          @if (group.items.length === 0) {
            <p class="status">
              {{
                group.personal
                  ? "Nu aveți psalmi personali salvați."
                  : "Nu aveți psalmi salvați."
              }}
            </p>
          } @else {
            <ul
              class="psalm-grid saved-psalm-grid"
              cdkDropList
              cdkDropListOrientation="mixed"
              [cdkDropListConnectedTo]="
                group.pageCount > 1
                  ? [
                      group.personal ? 'personal-previous' : 'psalm-previous',
                      group.personal ? 'personal-next' : 'psalm-next',
                    ]
                  : []
              "
              (cdkDropListDropped)="dropPsalm(group.personal, $event)"
            >
              @for (
                item of group.pageItems;
                track item.id;
                let index = $index
              ) {
                <li
                  class="psalm-card psalm-card-row"
                  [class.personal-psalm-card]="item.number === null"
                  cdkDrag
                  [cdkDragData]="item.id"
                  (cdkDragStarted)="draggingPsalm.set(group.personal)"
                  (cdkDragEnded)="draggingPsalm.set(null)"
                >
                  <a [routerLink]="item.link">
                    <span class="psalm-title">{{ item.title }}</span>
                  </a>
                  <div class="saved-actions">
                    <button
                      class="icon-btn drag-handle"
                      type="button"
                      cdkDragHandle
                      [attr.aria-label]="'Reordonează ' + item.title"
                      title="Reordonează psalmul"
                      (keydown)="
                        movePsalmWithKeyboard($event, group.personal, index)
                      "
                    >
                      <app-icon name="drag" />
                    </button>
                    <button
                      class="icon-btn"
                      type="button"
                      aria-label="Șterge psalmul din salvate"
                      (click)="removePsalm(item.number, item.id, item.title)"
                    >
                      <app-icon name="close" />
                    </button>
                  </div>
                </li>
              }
            </ul>
            @if (group.items.length > 0) {
              <app-paginator
                [ariaLabel]="
                  group.personal
                    ? 'Paginarea psalmilor personali'
                    : 'Paginarea psalmilor'
                "
                [page]="group.page"
                [pageCount]="group.pageCount"
                [pageSize]="group.pageSize"
                [storageKey]="
                  group.personal
                    ? 'psalter.pageSize.savedPersonalPsalms'
                    : 'psalter.pageSize.savedPsalms'
                "
                [previousDropListId]="
                  group.personal ? 'personal-previous' : 'psalm-previous'
                "
                [nextDropListId]="
                  group.personal ? 'personal-next' : 'psalm-next'
                "
                [dropActivePrevious]="
                  draggingPsalm() === group.personal && group.page > 0
                "
                [dropActiveNext]="
                  draggingPsalm() === group.personal &&
                  group.page + 1 < group.pageCount
                "
                (pageChange)="changePsalmPage(group.personal, $event)"
                (pageSizeChange)="setPsalmPageSize(group.personal, $event)"
                (previousDrop)="dropPsalmOnPage(group.personal, $event, -1)"
                (nextDrop)="dropPsalmOnPage(group.personal, $event, 1)"
              />
            }
          }
        </section>
      }
    }

    @if (kind === "verses" && saved.passages().length > 0) {
      <app-paginator
        ariaLabel="Paginarea elementelor salvate"
        storageKey="psalter.pageSize.savedVerses"
        [page]="page()"
        [pageCount]="pageCount()"
        [pageSize]="pageSize()"
        (pageChange)="changePage($event)"
        (pageSizeChange)="setPageSize($event)"
      />
    }
  `,
})
export class SavedPage {
  /** Shared saved-item collections and actions. */
  protected readonly saved = inject(SavedItemsService);
  /** Type of the psalm currently being dragged. */
  protected readonly draggingPsalm = signal<boolean | null>(null);
  /** Saved-item collection selected by route data. */
  protected readonly kind = inject(ActivatedRoute).snapshot.data["kind"];
  /** Number of saved verses shown per page. */
  protected readonly pageSize = signal(12);
  /** Page sizes for numbered and personal saved psalms. */
  private readonly psalmPageSizes = signal<[number, number]>([12, 12]);
  /** Number of pages in the selected collection. */
  protected readonly pageCount = computed(() =>
    Math.ceil(this.saved.passages().length / this.pageSize()),
  );
  /** Zero-based current page, clamped when the collection shrinks. */
  protected readonly page = linkedSignal<number, number>({
    source: this.pageCount,
    computation: (count, previous) =>
      Math.min(previous?.value ?? 0, Math.max(0, count - 1)),
  });
  /** Saved verses on the current page. */
  protected readonly pagePassages = computed(() => {
    const start = this.page() * this.pageSize();
    return this.saved.passages().slice(start, start + this.pageSize());
  });
  /** Saved psalms mapped to display, navigation, and stored positions. */
  private readonly psalmItems = computed(() =>
    this.saved.psalms().map((psalm, index) =>
      typeof psalm === "number"
        ? {
            id: String(psalm),
            title: `Psalmul ${psalm}`,
            link: ["/psalmi", psalm],
            number: psalm,
            index,
          }
        : {
            id: `personal-${psalm.id ?? "legacy"}`,
            title: psalm.title || "Psalmul meu",
            link: ["/psalmul-meu", "salvat", psalm.id ?? "legacy"],
            number: null,
            index,
          },
    ),
  );
  /** Separate page positions for numbered and personal psalms. */
  protected readonly psalmPages = linkedSignal<number[], number[]>({
    source: () => {
      const items = this.psalmItems();
      const pageSizes = this.psalmPageSizes();
      return [false, true].map((personal, index) =>
        Math.ceil(
          items.filter((item) => (item.number === null) === personal).length /
            pageSizes[index],
        ),
      );
    },
    computation: (counts, previous) =>
      counts.map((count, index) =>
        Math.min(previous?.value[index] ?? 0, Math.max(0, count - 1)),
      ),
  });
  /** Separate paginated lists for numbered and personal psalms. */
  protected readonly psalmGroups = computed(() =>
    [false, true].map((personal, index) => {
      const items = this.psalmItems().filter(
        (item) => (item.number === null) === personal,
      );
      const page = this.psalmPages()[index];
      const pageSize = this.psalmPageSizes()[index];
      return {
        personal,
        items,
        page,
        pageSize,
        pageCount: Math.ceil(items.length / pageSize),
        pageItems: items.slice(page * pageSize, (page + 1) * pageSize),
      };
    }),
  );

  /** Confirms and removes a saved verse. */
  protected removePassage(psalmNumber: number, verseNumber: number): void {
    if (
      window.confirm(
        `Scoateți versetul ${psalmNumber}:${verseNumber} din salvate?`,
      )
    ) {
      this.saved.removePassage(psalmNumber, verseNumber);
    }
  }

  /** Confirms and removes a saved numbered or personal psalm. */
  protected removePsalm(
    number: number | null,
    id: string,
    title: string,
  ): void {
    if (!window.confirm(`Scoateți „${title}” din salvate?`)) return;
    if (number === null)
      this.saved.removePersonalPsalm(id.slice("personal-".length));
    else this.saved.removePsalm(number);
  }

  /** Shuffles all saved verses and displays the first page. */
  protected shufflePassages(): void {
    this.saved.shufflePassages();
    this.page.set(0);
  }

  /** Confirms before sorting saved verses. */
  protected sortPassages(): void {
    if (window.confirm("Sortați numeric versetele salvate?")) {
      this.saved.sortPassages();
    }
  }

  /** Confirms before sorting saved numbered psalms. */
  protected sortPsalms(): void {
    if (window.confirm("Sortați numeric psalmii salvați?")) {
      this.saved.sortPsalms();
    }
  }

  /** Changes the current page and scrolls to the top. */
  protected changePage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0 });
  }

  /** Selects the saved-verse page size and returns to page one. */
  protected setPageSize(pageSize: number): void {
    if (![12, 24, 50, 100, 150].includes(pageSize)) return;
    this.pageSize.set(pageSize);
    this.page.set(0);
  }

  /** Changes only one saved-psalm section's page size. */
  protected setPsalmPageSize(personal: boolean, pageSize: number): void {
    if (![12, 24, 50, 100, 150].includes(pageSize)) return;
    const index = Number(personal);
    this.psalmPageSizes.update((sizes) => {
      const updated: [number, number] = [...sizes];
      updated[index] = pageSize;
      return updated;
    });
    this.changePsalmPage(personal, 0);
  }

  /** Changes the page of one saved psalm list. */
  protected changePsalmPage(personal: boolean, page: number): void {
    this.psalmPages.update((pages) =>
      pages.map((value, index) => (index === Number(personal) ? page : value)),
    );
    window.scrollTo({ top: 0 });
  }

  /** Moves an item within its displayed psalm list. */
  protected movePsalmInGroup(
    personal: boolean,
    index: number,
    target: number,
  ): void {
    const items = this.psalmGroups()[Number(personal)].pageItems;
    if (!items[index] || !items[target]) return;
    this.saved.movePsalm(items[index].index, items[target].index);
  }

  /** Reorders a psalm dropped within its current page. */
  protected dropPsalm(personal: boolean, event: CdkDragDrop<unknown>): void {
    if (event.previousContainer === event.container) {
      this.movePsalmInGroup(personal, event.previousIndex, event.currentIndex);
    }
  }

  /** Moves a dragged psalm to the adjacent page. */
  protected dropPsalmOnPage(
    personal: boolean,
    event: CdkDragDrop<unknown>,
    direction: number,
  ): void {
    if (event.previousContainer === event.container) return;
    const group = this.psalmGroups()[Number(personal)];
    const source = group.items.find((item) => item.id === event.item.data);
    const targetPage = group.page + direction;
    const targetIndex =
      direction < 0
        ? group.page * group.pageSize - 1
        : targetPage * group.pageSize;
    const target = group.items[targetIndex];
    if (!source || !target) return;
    this.saved.movePsalm(source.index, target.index);
  }

  /** Moves a saved psalm with the keyboard within its list. */
  protected movePsalmWithKeyboard(
    event: KeyboardEvent,
    personal: boolean,
    index: number,
  ): void {
    const offset =
      event.key === "ArrowUp" || event.key === "ArrowLeft"
        ? -1
        : event.key === "ArrowDown" || event.key === "ArrowRight"
          ? 1
          : 0;
    if (offset === 0) return;
    event.preventDefault();
    const group = this.psalmGroups()[Number(personal)];
    const source = group.page * group.pageSize + index;
    const target = source + offset;
    if (!group.items[target]) return;
    this.saved.movePsalm(group.items[source].index, group.items[target].index);
    const targetPage = Math.floor(target / group.pageSize);
    if (targetPage !== group.page) this.changePsalmPage(personal, targetPage);
  }

  /** Moves an item after a drag-and-drop operation. */
  protected drop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  /** Moves an item in response to an arrow key on its drag handle. */
  protected moveWithKeyboard(event: KeyboardEvent, index: number): void {
    const offset =
      event.key === "ArrowUp" || event.key === "ArrowLeft"
        ? -1
        : event.key === "ArrowDown" || event.key === "ArrowRight"
          ? 1
          : 0;
    if (offset === 0) return;
    event.preventDefault();
    this.move(index, index + offset);
  }

  /** Translates page-relative positions to positions in the saved collection. */
  private move(index: number, target: number): void {
    const start = this.page() * this.pageSize();
    if (this.kind === "verses") {
      this.saved.movePassage(start + index, start + target);
    } else {
      this.saved.movePsalm(start + index, start + target);
    }
  }
}
