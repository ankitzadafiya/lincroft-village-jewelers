import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent, interval, merge } from 'rxjs';
import { Category } from '../../../core/models';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-category-showcase',
  imports: [LvjIconsModule],
  template: `
    <section class="wrap" (mouseenter)="paused.set(true)" (mouseleave)="onSectionLeave()">
      <div class="container head">
        <h2>Shop by Categories</h2>
        <div class="pager" aria-label="Category carousel controls">
          <button type="button" class="nav" (click)="prev(); $event.stopPropagation()" aria-label="Previous categories">
            <lucide-icon name="chevron-left" [size]="18" [strokeWidth]="1.7"></lucide-icon>
          </button>
          <span class="count">{{ displayPage() }}/{{ pageCount() }}</span>
          <button type="button" class="nav" (click)="next(); $event.stopPropagation()" aria-label="Next categories">
            <lucide-icon name="chevron-right" [size]="18" [strokeWidth]="1.7"></lucide-icon>
          </button>
        </div>
      </div>

      <div
        #viewport
        class="viewport container"
        [class.dragging]="dragging()"
        (mousedown)="onMouseDown($event)"
        (touchstart)="onTouchStart($event)">
        <div
          class="track"
          [class.no-anim]="dragging() || jumping()"
          [style.transform]="'translate3d(' + offsetPx() + 'px, 0, 0)'">
          @for (category of looped(); track trackKey(category, $index)) {
            <div
              class="card"
              [style.flexBasis]="cardBasis()"
              role="link"
              tabindex="0"
              (click)="onCardActivate($event, category.slug)"
              (keydown.enter)="go(category.slug)"
              (keydown.space)="$event.preventDefault(); go(category.slug)">
              <div class="media">
                <img [src]="category.imageUrl" [alt]="category.name" loading="lazy" draggable="false" />
              </div>
              <div class="foot">
                <div class="copy">
                  <h3>{{ category.name }}</h3>
                  <p>{{ itemLabel(category) }}</p>
                </div>
                <span class="go" aria-hidden="true">
                  <lucide-icon name="arrow-right" [size]="16" [strokeWidth]="1.8"></lucide-icon>
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .wrap {
      padding: 3.25rem 0 1.25rem;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    h2 {
      font-size: clamp(1.55rem, 2.6vw, 2rem);
      font-weight: 600;
      letter-spacing: -0.03em;
      color: #111;
    }

    .pager {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: #111;
      user-select: none;
    }

    .count {
      font-size: 0.88rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      min-width: 2.6rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .nav {
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #111;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: background 0.25s ease;
    }

    .nav:hover {
      background: #efece7;
    }

    .viewport {
      overflow: hidden;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .viewport.dragging {
      cursor: grabbing;
    }

    .viewport.dragging * {
      cursor: grabbing !important;
    }

    .track {
      display: flex;
      will-change: transform;
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .track.no-anim {
      transition: none;
    }

    .card {
      flex: 0 0 auto;
      min-width: 0;
      display: grid;
      gap: 0.95rem;
      color: inherit;
      padding-right: 1.15rem;
      box-sizing: border-box;
      cursor: grab;
      outline: none;
    }

    .media {
      aspect-ratio: 4 / 5;
      border-radius: 4px;
      overflow: hidden;
      background: #f0eeea;
      pointer-events: none;
    }

    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
      transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .card:hover .media img {
      transform: scale(1.07);
    }

    .dragging .card:hover .media img {
      transform: none;
    }

    .foot {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      padding-right: 0.15rem;
      pointer-events: none;
    }

    .copy {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }

    h3 {
      font-family: var(--font-body);
      font-size: 0.98rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      color: #111;
      line-height: 1.25;
    }

    .copy p {
      font-size: 0.8rem;
      color: #8a8580;
    }

    .go {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 999px;
      border: 1px solid rgba(28, 28, 28, 0.12);
      background: #fff;
      display: grid;
      place-items: center;
      color: #111;
      transition:
        background 0.28s ease,
        color 0.28s ease,
        border-color 0.28s ease,
        transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .card:hover .go {
      background: #111;
      color: #fff;
      border-color: #111;
      transform: translateX(2px);
    }

    @media (max-width: 520px) {
      .head {
        align-items: flex-start;
      }
    }
  `]
})
export class CategoryShowcaseComponent implements OnInit {
  readonly categories = input.required<Category[]>();
  readonly index = signal(0);
  readonly paused = signal(false);
  readonly jumping = signal(false);
  readonly dragging = signal(false);
  /** Live pixel offset applied to the track (includes drag). */
  readonly offsetPx = signal(0);
  readonly visible = signal(4);

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  private startX = 0;
  private startOffset = 0;
  private dragDistance = 0;
  private suppressClick = false;
  private dragBound = false;

  readonly pageCount = computed(() => Math.max(1, this.categories().length));

  readonly displayPage = computed(() => {
    const n = this.categories().length;
    if (!n) return 1;
    return ((this.index() % n) + n) % n + 1;
  });

  readonly looped = computed(() => {
    const cats = this.categories();
    if (!cats.length) return [];
    return [...cats, ...cats, ...cats];
  });

  readonly cardBasis = computed(() => `${100 / this.visible()}%`);

  ngOnInit(): void {
    this.updateVisible();
    // Defer initial offset until layout exists
    requestAnimationFrame(() => this.snapToIndex(this.index(), false));

    interval(4200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.paused() || this.dragging() || this.categories().length <= 1) return;
        this.next();
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateVisible();
    this.snapToIndex(this.index(), false);
  }

  onSectionLeave(): void {
    if (!this.dragging()) this.paused.set(false);
  }

  trackKey(category: Category, i: number): string {
    return `${category.id}-${i}`;
  }

  itemLabel(category: Category): string {
    const count = category.productCount ?? 0;
    if (count <= 0) return 'Shop collection';
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.beginDrag(event.clientX);
    this.bindDocumentDrag(false);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    this.beginDrag(event.touches[0].clientX);
    this.bindDocumentDrag(true);
  }

  onCardActivate(event: MouseEvent, slug: string): void {
    if (this.suppressClick || this.dragDistance > 8) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.go(slug);
  }

  go(slug: string): void {
    void this.router.navigate(['/' + slug]);
  }

  prev(): void {
    this.step(-1);
  }

  next(): void {
    this.step(1);
  }

  private beginDrag(clientX: number): void {
    this.dragging.set(true);
    this.paused.set(true);
    this.startX = clientX;
    this.startOffset = this.offsetPx();
    this.dragDistance = 0;
    this.suppressClick = false;
  }

  private bindDocumentDrag(touch: boolean): void {
    if (this.dragBound) return;
    this.dragBound = true;

    if (touch) {
      const moveSub = fromEvent<TouchEvent>(document, 'touchmove', { passive: false }).subscribe(ev => {
        const x = ev.touches[0]?.clientX;
        if (x == null) return;
        ev.preventDefault();
        this.applyDrag(x);
      });
      const endSub = merge(
        fromEvent(document, 'touchend'),
        fromEvent(document, 'touchcancel')
      ).subscribe(() => {
        moveSub.unsubscribe();
        endSub.unsubscribe();
        this.dragBound = false;
        this.finishDrag();
      });
      return;
    }

    const moveSub = fromEvent<MouseEvent>(document, 'mousemove').subscribe(ev => {
      this.applyDrag(ev.clientX);
    });
    const endSub = fromEvent(window, 'mouseup').subscribe(() => {
      moveSub.unsubscribe();
      endSub.unsubscribe();
      this.dragBound = false;
      this.finishDrag();
    });
  }

  private applyDrag(clientX: number): void {
    const dx = clientX - this.startX;
    this.dragDistance = Math.abs(dx);
    this.offsetPx.set(this.startOffset + dx);
  }

  private finishDrag(): void {
    const stepWidth = this.cardStepPx();
    const dx = this.offsetPx() - this.startOffset;
    const steps = Math.round(-dx / Math.max(stepWidth, 1));

    this.dragging.set(false);

    if (Math.abs(dx) < 24) {
      // Snap back
      this.snapToIndex(this.index(), true);
      return;
    }

    this.suppressClick = true;
    window.setTimeout(() => {
      this.suppressClick = false;
    }, 120);

    const n = this.categories().length || 1;
    let next = this.index() + (steps === 0 ? (dx < 0 ? 1 : -1) : steps);
    // Keep index unbounded briefly for loop feel, then normalize
    this.index.set(next);
    this.snapToIndex(next, true);

    // Normalize into middle copy after animation
    window.setTimeout(() => {
      const normalized = ((this.index() % n) + n) % n;
      if (normalized !== this.index()) {
        this.jumping.set(true);
        this.index.set(normalized);
        this.snapToIndex(normalized, false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => this.jumping.set(false));
        });
      }
    }, 560);
  }

  private step(dir: 1 | -1): void {
    const n = this.categories().length;
    if (!n) return;
    const next = this.index() + dir;
    this.index.set(next);
    this.snapToIndex(next, true);

    window.setTimeout(() => {
      if (next >= 0 && next < n) return;
      this.jumping.set(true);
      const normalized = ((next % n) + n) % n;
      this.index.set(normalized);
      this.snapToIndex(normalized, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.jumping.set(false));
      });
    }, 560);
  }

  private snapToIndex(logicalIndex: number, animate: boolean): void {
    const n = this.categories().length;
    if (!n) {
      this.offsetPx.set(0);
      return;
    }
    // Position within the middle copy of the tripled list
    const absolute = n + logicalIndex;
    const px = -absolute * this.cardStepPx();
    if (!animate) this.jumping.set(true);
    this.offsetPx.set(px);
    if (!animate) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.jumping.set(false));
      });
    }
  }

  /** Width of one card including its right padding/gap. */
  private cardStepPx(): number {
    const vp = this.viewport()?.nativeElement;
    if (!vp) return 280;
    const card = vp.querySelector('.card') as HTMLElement | null;
    if (card) return card.getBoundingClientRect().width;
    return vp.clientWidth / this.visible();
  }

  private updateVisible(): void {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w <= 520) this.visible.set(1);
    else if (w <= 820) this.visible.set(2);
    else if (w <= 1100) this.visible.set(3);
    else this.visible.set(4);
  }
}
