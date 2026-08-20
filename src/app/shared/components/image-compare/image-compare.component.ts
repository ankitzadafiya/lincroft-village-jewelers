import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, input, signal } from '@angular/core';

@Component({
  selector: 'app-image-compare',
  template: `
    <div
      #frame
      class="compare"
      role="slider"
      [attr.aria-valuenow]="position()"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Compare sketch and finished jewelry"
      (pointerdown)="startDrag($event)">
      <img class="base after" [src]="afterSrc()" [alt]="afterAlt()" draggable="false" />

      <div class="clip" [style.width.%]="position()">
        <img
          class="base before"
          [src]="beforeSrc()"
          [alt]="beforeAlt()"
          [style.width.px]="frameWidth()"
          draggable="false" />
      </div>

      <span class="label before-label">Before</span>
      <span class="label after-label">After</span>

      <div class="divider" [style.left.%]="position()">
        <div class="handle" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .compare {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-height: 480px;
      overflow: hidden;
      background: #f4f7fb;
      border: 1px solid rgba(15, 35, 60, 0.16);
      box-shadow:
        0 1px 2px rgba(15, 35, 60, 0.05),
        0 14px 36px rgba(15, 35, 60, 0.12);
      cursor: ew-resize;
      touch-action: none;
      user-select: none;
      border-radius: 12px;
    }

    .base {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      pointer-events: none;
      background: #fff;
    }

    .base.after {
      z-index: 0;
    }

    .base.before {
      /* same framing as after */
    }

    .clip {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }

    .before {
      max-width: none;
      right: auto;
    }

    .label {
      position: absolute;
      z-index: 3;
      background: #fff;
      color: #111;
      font-family: var(--font-body);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 0.28rem 0.55rem;
      border-radius: 2px;
      pointer-events: none;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .before-label { top: 0.75rem; left: 0.75rem; }
    .after-label { bottom: 0.75rem; right: 0.75rem; }

    .divider {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #fff;
      transform: translateX(-50%);
      z-index: 4;
      pointer-events: none;
    }

    .handle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
    }

    .handle span {
      width: 2px;
      height: 11px;
      background: #6b6b6b;
      border-radius: 2px;
    }

    @media (min-width: 900px) {
      .compare {
        min-height: 0;
        max-height: 520px;
      }
    }
  `]
})
export class ImageCompareComponent implements AfterViewInit {
  readonly beforeSrc = input.required<string>();
  readonly afterSrc = input.required<string>();
  readonly beforeAlt = input('Design sketch');
  readonly afterAlt = input('Finished jewelry');

  readonly position = signal(46);
  readonly frameWidth = signal(0);

  @ViewChild('frame') frameRef!: ElementRef<HTMLDivElement>;

  private dragging = false;

  ngAfterViewInit(): void {
    queueMicrotask(() => this.measure());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.measure();
  }

  startDrag(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.dragging = true;
    this.frameRef.nativeElement.setPointerCapture(event.pointerId);
    this.update(event.clientX);
  }

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.update(event.clientX);
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  endDrag(): void {
    this.dragging = false;
  }

  private measure(): void {
    const width = this.frameRef?.nativeElement.getBoundingClientRect().width ?? 0;
    this.frameWidth.set(width);
  }

  private update(clientX: number): void {
    const rect = this.frameRef.nativeElement.getBoundingClientRect();
    this.frameWidth.set(rect.width);
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    this.position.set(Math.min(95, Math.max(5, ratio)));
  }
}
