import { Component, effect, input, output, untracked } from "@angular/core";
import { CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from "@angular/cdk/menu";
import { AppIcon } from "./app-icon";

/** Reusable page navigation with a centered page-size selector. */
@Component({
  selector: "app-paginator",
  imports: [CdkDropList, CdkMenu, CdkMenuItemRadio, CdkMenuTrigger, AppIcon],
  template: `
    <nav class="pager paginator" [attr.aria-label]="ariaLabel()">
      @if (previousDropListId()) {
        <div
          class="page-drop-target"
          [class.page-drop-active]="dropActivePrevious()"
          cdkDropList
          [id]="previousDropListId()!"
          [cdkDropListDisabled]="page() === 0"
          cdkDropListSortingDisabled
          (cdkDropListDropped)="previousDrop.emit($event)"
        >
          <button
            class="icon-btn"
            type="button"
            [disabled]="page() === 0"
            aria-label="Pagina anterioară"
            title="Pagina anterioară; trageți aici pentru a muta elementul"
            (click)="changePage(page() - 1)"
          >
            <app-icon name="chevron-left" />
          </button>
        </div>
      } @else {
        <button
          class="icon-btn"
          type="button"
          [disabled]="page() === 0"
          aria-label="Pagina anterioară"
          title="Pagina anterioară"
          (click)="changePage(page() - 1)"
        >
          <app-icon name="chevron-left" />
        </button>
      }

      <div class="pager-center">
        <span>{{ page() + 1 }} / {{ pageCount() }}</span>
        <button
          class="btn page-size-control"
          type="button"
          [attr.aria-label]="pageSizeLabel() + ': ' + pageSize()"
          [cdkMenuTriggerFor]="pageSizeMenu"
          aria-haspopup="menu"
        >
          {{ pageSize() }}
          <app-icon name="chevron-down" [size]="16" />
        </button>
      </div>

      <ng-template #pageSizeMenu>
        <div class="page-size-menu" cdkMenu>
          @for (size of pageSizes; track size) {
            <button
              class="page-size-menu-item"
              type="button"
              cdkMenuItemRadio
              [cdkMenuItemChecked]="size === pageSize()"
              (cdkMenuItemTriggered)="changePageSize(size)"
            >
              {{ size }}
            </button>
          }
        </div>
      </ng-template>

      @if (nextDropListId()) {
        <div
          class="page-drop-target"
          [class.page-drop-active]="dropActiveNext()"
          cdkDropList
          [id]="nextDropListId()!"
          [cdkDropListDisabled]="page() + 1 >= pageCount()"
          cdkDropListSortingDisabled
          (cdkDropListDropped)="nextDrop.emit($event)"
        >
          <button
            class="icon-btn"
            type="button"
            [disabled]="page() + 1 >= pageCount()"
            aria-label="Pagina următoare"
            title="Pagina următoare; trageți aici pentru a muta elementul"
            (click)="changePage(page() + 1)"
          >
            <app-icon name="chevron-right" />
          </button>
        </div>
      } @else {
        <button
          class="icon-btn"
          type="button"
          [disabled]="page() + 1 >= pageCount()"
          aria-label="Pagina următoare"
          title="Pagina următoare"
          (click)="changePage(page() + 1)"
        >
          <app-icon name="chevron-right" />
        </button>
      }
    </nav>
  `,
})
export class Paginator {
  protected readonly pageSizes = [12, 24, 50, 100, 150];

  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly storageKey = input.required<string>();
  readonly ariaLabel = input("Paginare");
  readonly pageSizeLabel = input("Elemente pe pagină");
  readonly previousDropListId = input<string | null>(null);
  readonly nextDropListId = input<string | null>(null);
  readonly dropActivePrevious = input(false);
  readonly dropActiveNext = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly previousDrop = output<CdkDragDrop<unknown>>();
  readonly nextDrop = output<CdkDragDrop<unknown>>();

  constructor() {
    effect(() => {
      const key = this.storageKey();
      const stored = Number(localStorage.getItem(key));
      if (this.pageSizes.includes(stored)) {
        untracked(() => this.pageSizeChange.emit(stored));
      }
    });
  }

  /** Emits a valid adjacent page. */
  protected changePage(page: number): void {
    if (page >= 0 && page < this.pageCount()) this.pageChange.emit(page);
  }

  /** Emits one of the supported page sizes. */
  protected changePageSize(pageSize: number): void {
    if (this.pageSizes.includes(pageSize)) {
      localStorage.setItem(this.storageKey(), String(pageSize));
      this.pageSizeChange.emit(pageSize);
    }
  }
}
