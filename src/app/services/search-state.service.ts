import { Injectable, signal } from "@angular/core";

/** Session-storage key for the most recent search. */
const SEARCH_QUERY_KEY = "psalter.searchQuery";

/** Reads the previous query, returning an empty string when storage is unavailable. */
function readStoredQuery(): string {
  try {
    return sessionStorage.getItem(SEARCH_QUERY_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Shares the current search input and remembers the most recent query per tab. */
@Injectable({ providedIn: "root" })
export class SearchStateService {
  /** Last entered query, retained when the visible input is cleared. */
  private lastQuery = readStoredQuery();
  /** Mutable state for the visible search input. */
  private readonly queryState = signal("");
  /** Current visible input value. */
  readonly query = this.queryState.asReadonly();

  /** Updates the input and persists the query for this browser session. */
  setQuery(value: string): void {
    this.lastQuery = value;
    this.queryState.set(value);
    try {
      if (value) {
        sessionStorage.setItem(SEARCH_QUERY_KEY, value);
      } else {
        sessionStorage.removeItem(SEARCH_QUERY_KEY);
      }
    } catch {}
  }

  /** Clears the visible input without discarding the remembered query. */
  clearInput(): void {
    this.queryState.set("");
  }

  /** Restores the remembered query when the visible input is empty. */
  restoreQuery(): void {
    if (!this.queryState()) {
      this.queryState.set(this.lastQuery);
    }
  }
}
