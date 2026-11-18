import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { BackButton } from "../components/back-button";
import { AppIcon } from "../components/app-icon";
import { SavedItemsService } from "../services/saved-items.service";

/** Displays a saved personal psalm and links to its editor. */
@Component({
  selector: "app-saved-personal-psalm",
  imports: [BackButton, AppIcon, RouterLink],
  template: `
    <header class="page-header row">
      <div class="page-title">
        <app-back-button />
        <h1>{{ psalm()?.title || "Psalmul meu" }}</h1>
      </div>
      @if (psalm(); as current) {
        <a
          class="icon-btn"
          aria-label="Editează psalmul"
          title="Editează psalmul"
          [routerLink]="[
            '/psalmul-meu',
            'salvat',
            current.id ?? 'legacy',
            'editare',
          ]"
        >
          <app-icon name="edit" />
        </a>
      }
    </header>

    @if (psalm(); as psalm) {
      <article class="reading">
        @for (verse of psalm.verses; track $index; let index = $index) {
          <p class="verse">
            <span class="verse-number">{{ index + 1 }}</span>
            <span
              class="verse-text"
              [class.is-saved]="
                saved.isPassageSaved(verse.psalmNumber, verse.verseNumber)
              "
            >
              {{ verse.text }}
              <a
                class="personal-reference"
                [routerLink]="['/psalmi', verse.psalmNumber]"
                [fragment]="'verset-' + verse.verseNumber"
                >{{ verse.psalmNumber }}:{{ verse.verseNumber }}</a
              >
            </span>
          </p>
        }
      </article>
    } @else {
      <p class="status">Nu aveți un psalm personal salvat.</p>
    }
  `,
})
export class SavedPersonalPsalmPage {
  /** Saved compositions used to resolve the current psalm. */
  protected readonly saved = inject(SavedItemsService);
  /** Optional route identifier; absent on the legacy route. */
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get("id");
  /** Saved composition matching the route, if available. */
  protected readonly psalm = computed(() =>
    this.id === null
      ? this.saved.personalPsalm()
      : (this.saved
          .psalms()
          .find(
            (psalm) =>
              typeof psalm !== "number" && (psalm.id ?? "legacy") === this.id,
          ) as ReturnType<typeof this.saved.personalPsalm>),
  );
}
