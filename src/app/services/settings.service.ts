import { computed, effect, Injectable, signal } from "@angular/core";

/** Local-storage key for the color mode. */
const DARK_MODE_KEY = "psalter.darkMode";
/** Local-storage key for the custom theme color. */
const THEME_COLOR_KEY = "psalter.themeColor";
/** Local-storage key for the reading font size. */
const FONT_SIZE_KEY = "psalter.fontSize";
/** Smallest supported reading font size in pixels. */
const MIN_FONT_SIZE = 14;
/** Largest supported reading font size in pixels. */
const MAX_FONT_SIZE = 32;
/** Reading font size adjustment in pixels. */
const FONT_SIZE_STEP = 2;
/** Reading font size used when no valid preference exists. */
const DEFAULT_FONT_SIZE = 18;

/** Reads a valid custom color, if one has been chosen. */
function readThemeColor(): string | null {
  const stored = localStorage.getItem(THEME_COLOR_KEY);
  return stored && /^#[0-9a-f]{6}$/i.test(stored) ? stored : null;
}

/** Chooses black or white text for a custom-colored background. */
function colorText(color: string): string {
  const channels = [1, 3, 5].map((index) => {
    const channel = parseInt(color.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

/** Reads the saved color mode or falls back to the system preference. */
function readDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  return stored === null
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : stored === "true";
}

/** Reads a valid stored reading font size or the default. */
function readFontSize(): number {
  const stored = Number(localStorage.getItem(FONT_SIZE_KEY));
  return Number.isInteger(stored) &&
    stored >= MIN_FONT_SIZE &&
    stored <= MAX_FONT_SIZE
    ? stored
    : DEFAULT_FONT_SIZE;
}

/** Maintains and persists the app's color mode and reading font size. */
@Injectable({ providedIn: "root" })
export class SettingsService {
  /** Mutable color-mode preference. */
  private readonly darkModeState = signal(readDarkMode());
  /** Mutable custom color preference. */
  private readonly themeColorState = signal<string | null>(readThemeColor());
  /** Mutable reading font size in pixels. */
  private readonly fontSizeState = signal(readFontSize());

  /** Whether dark mode is enabled. */
  readonly darkMode = this.darkModeState.asReadonly();
  /** Selected color, or the default starting color for the picker. */
  readonly themeColor = computed(() => this.themeColorState() ?? "#3b6945");
  /** Current reading font size in pixels. */
  readonly fontSize = this.fontSizeState.asReadonly();
  /** Whether the reading font size can be increased. */
  readonly canIncreaseFont = computed(
    () => this.fontSizeState() < MAX_FONT_SIZE,
  );
  /** Whether the reading font size can be decreased. */
  readonly canDecreaseFont = computed(
    () => this.fontSizeState() > MIN_FONT_SIZE,
  );

  /** Synchronizes settings to the document and local storage. */
  constructor() {
    effect(() => {
      const dark = this.darkModeState();
      document.documentElement.classList.toggle("dark", dark);
      localStorage.setItem(DARK_MODE_KEY, String(dark));
    });
    effect(() => {
      const color = this.themeColorState();
      if (color) {
        document.documentElement.style.setProperty("--theme-color", color);
        document.documentElement.style.setProperty(
          "--on-theme-color",
          colorText(color),
        );
        document.documentElement.setAttribute("data-custom-color", "");
        localStorage.setItem(THEME_COLOR_KEY, color);
      }
    });
    effect(() => {
      const size = this.fontSizeState();
      document.documentElement.style.setProperty(
        "--reading-font-size",
        `${size}px`,
      );
      localStorage.setItem(FONT_SIZE_KEY, String(size));
    });
  }

  /** Switches between light and dark color modes. */
  toggleDarkMode(): void {
    this.darkModeState.update((dark) => !dark);
  }

  /** Selects a custom color for the application palette. */
  setThemeColor(color: string): void {
    if (/^#[0-9a-f]{6}$/i.test(color)) this.themeColorState.set(color);
  }

  /** Increases the reading font size up to its supported maximum. */
  increaseFont(): void {
    this.fontSizeState.update((size) =>
      Math.min(MAX_FONT_SIZE, size + FONT_SIZE_STEP),
    );
  }

  /** Decreases the reading font size down to its supported minimum. */
  decreaseFont(): void {
    this.fontSizeState.update((size) =>
      Math.max(MIN_FONT_SIZE, size - FONT_SIZE_STEP),
    );
  }
}
