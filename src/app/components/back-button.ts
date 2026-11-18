import { Location } from "@angular/common";
import { Component, inject } from "@angular/core";
import { AppIcon } from "./app-icon";

/** Button that navigates back through the browser's history. */
@Component({
  selector: "app-back-button",
  imports: [AppIcon],
  template: `
    <button
      class="icon-btn"
      type="button"
      aria-label="Înapoi"
      title="Înapoi"
      (click)="location.back()"
    >
      <app-icon name="arrow-left" />
    </button>
  `,
})
export class BackButton {
  /** Angular location service used for history navigation. */
  protected readonly location = inject(Location);
}
