import { Component, inject, signal } from "@angular/core";
import { CdkMenu, CdkMenuTrigger } from "@angular/cdk/menu";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { SearchStateService } from "./services/search-state.service";
import { SettingsService } from "./services/settings.service";
import { PsalmService } from "./services/psalm.service";
import { AppIcon } from "./components/app-icon";

/** Root shell containing global navigation, search, and display controls. */
@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AppIcon,
    CdkMenu,
    CdkMenuTrigger,
  ],
  host: {
    "(document:keydown.escape)": "menuOpen.set(false)",
    "(window:scroll)": "updateScrollTopVisibility()",
  },
  template: `
    <header class="topbar">
      <div class="nav-brand">
        <button
          class="icon-btn"
          type="button"
          aria-label="Deschide meniul"
          (click)="menuOpen.set(true)"
        >
          <app-icon name="menu" />
        </button>

        <a class="brand" routerLink="/psalmi">Psaltirea</a>
      </div>

      <label class="nav-search">
        <app-icon name="search" />
        <input
          type="search"
          placeholder="Caută cuvânt sau pasaj"
          aria-label="Caută în psalmi"
          [value]="search.query()"
          (input)="onSearchInput($event)"
        />
      </label>

      <div class="nav-actions">
        <button
          class="icon-btn"
          type="button"
          aria-label="Psalm aleatoriu"
          title="Psalm aleatoriu"
          [disabled]="psalms.availablePsalms().length === 0"
          (click)="goToRandomPsalm()"
        >
          <app-icon name="shuffle" [size]="20" />
        </button>
        <button
          class="icon-btn"
          type="button"
          aria-label="Setări de afișare"
          title="Setări de afișare"
          [cdkMenuTriggerFor]="displaySettingsMenu"
        >
          <app-icon name="settings" />
        </button>
        <button
          class="icon-btn"
          type="button"
          [attr.aria-label]="
            settings.darkMode()
              ? 'Activează modul luminos'
              : 'Activează modul întunecat'
          "
          (click)="settings.toggleDarkMode()"
        >
          @if (settings.darkMode()) {
            <app-icon name="sun" />
          } @else {
            <app-icon name="moon" />
          }
        </button>
      </div>

      <ng-template #displaySettingsMenu>
        <div class="display-settings-menu" cdkMenu>
          <button
            class="display-settings-item"
            type="button"
            role="menuitem"
            [disabled]="!settings.canDecreaseFont()"
            (click)="settings.decreaseFont()"
          >
            <span class="text-icon">A−</span>
            <span>Micșorează textul</span>
          </button>
          <button
            class="display-settings-item"
            type="button"
            role="menuitem"
            [disabled]="!settings.canIncreaseFont()"
            (click)="settings.increaseFont()"
          >
            <span class="text-icon">A+</span>
            <span>Mărește textul</span>
          </button>
          <label
            class="display-settings-item theme-picker"
            role="menuitem"
            title="Alege culoarea temei"
          >
            <app-icon name="theme" />
            <span>Alege culoarea temei</span>
            <input
              type="color"
              aria-label="Alege culoarea temei"
              [value]="settings.themeColor()"
              (input)="settings.setThemeColor($any($event.target).value)"
            />
          </label>
        </div>
      </ng-template>
    </header>

    <div
      class="backdrop"
      [class.visible]="menuOpen()"
      (click)="menuOpen.set(false)"
    ></div>

    <aside
      class="drawer"
      [class.open]="menuOpen()"
      [attr.aria-hidden]="!menuOpen()"
    >
      <div class="drawer-head">
        <span class="drawer-title">Meniu</span>
        <button
          class="icon-btn"
          type="button"
          aria-label="Închide meniul"
          (click)="menuOpen.set(false)"
        >
          <app-icon name="close" />
        </button>
      </div>

      <nav class="drawer-nav" (click)="menuOpen.set(false)">
        <a routerLink="/psalmi" routerLinkActive="active">Psalmi</a>
        <a routerLink="/psalmul-meu" routerLinkActive="active">Psalmul meu</a>
        <a routerLink="/salvate/psalmi" routerLinkActive="active"
          >Psalmi salvați</a
        >
        <a routerLink="/salvate/versete" routerLinkActive="active"
          >Versete salvate</a
        >
      </nav>
    </aside>

    <main class="content">
      <router-outlet />
    </main>

    @if (showScrollTop() && !menuOpen()) {
      <button
        class="icon-btn scroll-top"
        type="button"
        aria-label="Înapoi la începutul paginii"
        title="Înapoi la începutul paginii"
        (click)="scrollToTop()"
      >
        <app-icon name="arrow-up" />
      </button>
    }
  `,
})
export class App {
  /** Whether the navigation drawer is open. */
  protected readonly menuOpen = signal(false);
  /** Whether the page is far enough down to offer a return to the top. */
  protected readonly showScrollTop = signal(false);
  /** Shared display preferences used by the header controls. */
  protected readonly settings = inject(SettingsService);
  /** Shared state for the global search input. */
  protected readonly search = inject(SearchStateService);
  /** Available psalms and randomized psalm queue. */
  protected readonly psalms = inject(PsalmService);
  /** Router used for global navigation actions. */
  private readonly router = inject(Router);

  /** Updates the scroll-to-top button when the window scrolls. */
  protected updateScrollTopVisibility(): void {
    this.showScrollTop.set(window.scrollY > 300);
  }

  /** Returns to the top while respecting reduced-motion preferences. */
  protected scrollToTop(): void {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" });
  }

  /** Opens the next unique psalm from the randomized queue. */
  protected goToRandomPsalm(): void {
    const number = this.psalms.nextRandomPsalm();
    if (number === null) return;

    void this.router.navigate(["/psalmi", number]).then((navigated) => {
      if (navigated) window.scrollTo({ top: 0 });
    });
  }

  /** Updates the global query and opens the search page for nonblank input. */
  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.setQuery(value);
    if (value.trim() !== "" && !this.router.url.startsWith("/cautare")) {
      void this.router.navigateByUrl("/cautare");
    }
  }
}
