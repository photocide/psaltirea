import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PsalmService } from "../services/psalm.service";
import { SavedItemsService } from "../services/saved-items.service";
import { AppIcon } from "../components/app-icon";

/** Lists available psalms and indicates which ones are saved. */
@Component({
  selector: "app-psalm-index",
  imports: [RouterLink, AppIcon],
  template: `
    <header class="page-header">
      <div class="page-title">
        <h1>Psalmi</h1>
      </div>
      <p class="muted">Alegeți un psalm pentru a-l citi.</p>
    </header>

    <ul class="psalm-grid">
      @for (number of psalms.availablePsalms(); track number) {
        @let savedVerseCount = savedVerseCounts().get(number) ?? 0;
        <li>
          <a
            class="psalm-card"
            [class.is-saved]="saved.isPsalmSaved(number)"
            [routerLink]="['/psalmi', number]"
          >
            <span class="psalm-index-label">
              <span class="psalm-title">Psalmul {{ number }}</span>
              @if (savedVerseCount > 0) {
                <span
                  class="verse-count-badge"
                  role="img"
                  [attr.aria-label]="
                    savedVerseCount +
                    (savedVerseCount === 1
                      ? ' verset salvat'
                      : ' versete salvate')
                  "
                  [title]="
                    savedVerseCount +
                    (savedVerseCount === 1
                      ? ' verset salvat'
                      : ' versete salvate')
                  "
                  >{{ savedVerseCount }}</span
                >
              }
            </span>
            @if (saved.isPsalmSaved(number)) {
              <app-icon
                class="saved-bookmark"
                name="bookmark"
                [size]="20"
                aria-label="Salvat"
              />
            }
          </a>
        </li>
      } @empty {
        <li class="status">Nu există încă psalmi în bibliotecă.</li>
      }
    </ul>
  `,
})
export class PsalmIndex {
  /** Source of available psalm numbers. */
  protected readonly psalms = inject(PsalmService);
  /** Saved-item state used for psalm badges. */
  protected readonly saved = inject(SavedItemsService);
  /** Number of saved verses grouped by their source psalm. */
  protected readonly savedVerseCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const verse of this.saved.passages()) {
      counts.set(verse.psalmNumber, (counts.get(verse.psalmNumber) ?? 0) + 1);
    }
    return counts;
  });
}
