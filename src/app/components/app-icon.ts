import { Component, input } from "@angular/core";

export type AppIconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "bookmark"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "drag"
  | "edit"
  | "menu"
  | "moon"
  | "plus"
  | "search"
  | "settings"
  | "shuffle"
  | "sort"
  | "sun"
  | "theme";

/** Shared line icons whose color follows the surrounding control. */
@Component({
  selector: "app-icon",
  host: { style: "display: inline-flex" },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.fill]="name() === 'drag' ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ("arrow-down") {
          <path d="M12 5v14M5 12l7 7 7-7" />
        }
        @case ("arrow-left") {
          <path d="M19 12H5M12 19l-7-7 7-7" />
        }
        @case ("arrow-right") {
          <path d="M5 12h14M12 5l7 7-7 7" />
        }
        @case ("arrow-up") {
          <path d="M12 19V5M5 12l7-7 7 7" />
        }
        @case ("bookmark") {
          <path d="M6 3h12v18l-6-4-6 4z" />
        }
        @case ("chevron-down") {
          <path d="m6 9 6 6 6-6" />
        }
        @case ("chevron-left") {
          <path d="m15 18-6-6 6-6" />
        }
        @case ("chevron-right") {
          <path d="m9 18 6-6-6-6" />
        }
        @case ("close") {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ("drag") {
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        }
        @case ("edit") {
          <path d="m15 5 4 4M4 20l4-1 11-11-4-4L4 15v5Z" />
        }
        @case ("menu") {
          <path d="M3 6h18M3 12h18M3 18h18" />
        }
        @case ("moon") {
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        }
        @case ("plus") {
          <path d="M12 5v14M5 12h14" />
        }
        @case ("search") {
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        }
        @case ("settings") {
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
        }
        @case ("shuffle") {
          <path
            d="M18 14l4 4-4 4M18 2l4 4-4 4M2 18h2.5c6.5 0 8.5-12 15-12H22M2 6h2.5c2.5 0 4.3 1.8 5.8 4M14 15c1.4 1.8 3.1 3 5.5 3H22"
          />
        }
        @case ("sort") {
          <path d="M4 7h12M4 12h8M4 17h4M19 4v16m-3-3 3 3 3-3" />
        }
        @case ("sun") {
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        }
        @case ("theme") {
          <path
            d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-.5a1.5 1.5 0 0 1 0-3H15a6 6 0 0 0 6-6c0-3-4-5-9-5Z"
          />
          <circle cx="7.5" cy="10" r=".5" />
          <circle cx="10" cy="6.5" r=".5" />
          <circle cx="14" cy="6.5" r=".5" />
          <circle cx="17" cy="9" r=".5" />
        }
      }
    </svg>
  `,
})
export class AppIcon {
  readonly name = input.required<AppIconName>();
  readonly size = input(24);
}
