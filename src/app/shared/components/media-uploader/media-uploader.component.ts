import { Component, inject, input, output, signal } from '@angular/core';
import { ProductMedia } from '../../../core/models';
import { MediaService } from '../../../core/services/media.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-media-uploader',
  imports: [AppIconComponent],
  template: `
    <div class="uploader">
      <div class="head">
        <div class="title">
          <app-icon [name]="kind() === 'image' ? 'image' : 'video'" [size]="16" [strokeWidth]="1.7"></app-icon>
          <h3>{{ kind() === 'image' ? 'Images' : 'Videos' }}</h3>
        </div>
        <small>{{ items().length }} / {{ max() }}</small>
      </div>

      <div class="grid" [class.empty]="!items().length">
        @for (item of items(); track item.id; let i = $index) {
          <figure class="tile" [class.primary]="item.isPrimary">
            @if (kind() === 'image') {
              <img [src]="item.thumbnailUrl || item.url" [alt]="item.alt || 'Product image'" />
            } @else {
              <video [src]="item.url" muted></video>
            }
            @if (item.isPrimary) {
              <span class="badge">Primary</span>
            }
            <div class="overlay">
              <button type="button" class="icon-btn icon-tip" data-tip="Move left" (click)="move(i, -1)" [disabled]="i === 0" aria-label="Move earlier">
                <app-icon name="chevron-left" [size]="15" [strokeWidth]="1.8"></app-icon>
              </button>
              <button type="button" class="icon-btn icon-tip" data-tip="Move right" (click)="move(i, 1)" [disabled]="i === items().length - 1" aria-label="Move later">
                <app-icon name="chevron-right" [size]="15" [strokeWidth]="1.8"></app-icon>
              </button>
              @if (kind() === 'image' && !item.isPrimary) {
                <button type="button" class="icon-btn icon-tip" data-tip="Make primary" (click)="setPrimary(i)" aria-label="Make primary">
                  <app-icon name="star" [size]="15" [strokeWidth]="1.8"></app-icon>
                </button>
              }
              <button type="button" class="icon-btn icon-tip danger" data-tip="Remove" (click)="remove(i)" aria-label="Remove">
                <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
              </button>
            </div>
          </figure>
        }

        @if (items().length < max()) {
          <label class="drop">
            <input type="file" [accept]="kind() === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'" (change)="onFile($event)" />
            <app-icon name="upload" [size]="22" [strokeWidth]="1.6"></app-icon>
            <strong>Upload {{ kind() }}</strong>
            <em>{{ kind() === 'image' ? 'JPG, PNG or WebP' : 'MP4 or WebM' }}</em>
          </label>
        }
      </div>

      @if (progress() != null) {
        <div class="bar"><span [style.width.%]="progress()"></span></div>
      }
    </div>
  `,
  styles: [`
    .uploader { display: grid; gap: 0.75rem; margin-bottom: 1rem; }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--lvj-ink);
    }
    h3 { font-size: 1.05rem; font-family: var(--font-body); font-weight: 650; font-style: normal; }
    small { color: var(--lvj-muted); font-size: 0.78rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
      gap: 0.7rem;
    }
    .tile {
      position: relative;
      margin: 0;
      aspect-ratio: 1;
      border-radius: 14px;
      overflow: hidden;
      background: var(--lvj-paper);
      border: 1px solid var(--lvj-line);
    }
    .tile.primary { border-color: var(--lvj-champagne); }
    img, video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .badge {
      position: absolute;
      left: 0.45rem;
      top: 0.45rem;
      background: var(--lvj-ink);
      color: var(--lvj-on-ink);
      font-size: 0.58rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.25rem 0.45rem;
      border-radius: 999px;
      font-weight: 700;
    }
    .overlay {
      position: absolute;
      inset: auto 0 0;
      display: flex;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.5rem;
      background: linear-gradient(transparent, rgba(0,0,0,0.55));
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .tile:hover .overlay,
    .tile:focus-within .overlay { opacity: 1; }
    .overlay .icon-btn {
      width: 1.85rem;
      min-width: 1.85rem;
      height: 1.85rem;
      background: #fff;
      color: #111;
    }
    .drop {
      aspect-ratio: 1;
      min-height: 132px;
      border: 1.5px dashed var(--lvj-champagne);
      border-radius: 14px;
      background: color-mix(in srgb, var(--lvj-champagne) 8%, var(--lvj-panel));
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 0.3rem;
      text-align: center;
      cursor: pointer;
      color: var(--lvj-ink);
      padding: 0.75rem;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .drop:hover { background: color-mix(in srgb, var(--lvj-champagne) 16%, var(--lvj-panel)); }
    .drop input { display: none; }
    .drop strong {
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-family: var(--font-body);
    }
    .drop em { font-style: normal; font-size: 0.72rem; color: var(--lvj-muted); }
    .bar { height: 4px; background: var(--lvj-soft); border-radius: 99px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--lvj-gold); }
    @media (max-width: 520px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class MediaUploaderComponent {
  readonly kind = input<'image' | 'video'>('image');
  readonly items = input<ProductMedia[]>([]);
  readonly itemsChange = output<ProductMedia[]>();
  readonly progress = signal<number | null>(null);
  private readonly media = inject(MediaService);
  private readonly toast = inject(ToastService);

  max(): number {
    return this.kind() === 'image' ? environment.media.maxImages : environment.media.maxVideos;
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const error = this.media.validate(file, this.kind());
    if (error) {
      this.toast.error(error);
      return;
    }
    this.progress.set(0);
    this.media.upload(file, this.kind()).subscribe({
      next: state => {
        this.progress.set(state.progress);
        if (state.media) {
          const next = [...this.items(), { ...state.media, sortOrder: this.items().length, isPrimary: this.items().length === 0 && this.kind() === 'image' }];
          this.itemsChange.emit(next);
          this.progress.set(null);
        }
      },
      error: () => {
        this.toast.error('Upload failed.');
        this.progress.set(null);
      }
    });
    (event.target as HTMLInputElement).value = '';
  }

  move(index: number, delta: number): void {
    const next = [...this.items()];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    this.itemsChange.emit(next.map((item, i) => ({ ...item, sortOrder: i })));
  }

  setPrimary(index: number): void {
    this.itemsChange.emit(this.items().map((item, i) => ({ ...item, isPrimary: i === index })));
  }

  remove(index: number): void {
    this.itemsChange.emit(this.items().filter((_, i) => i !== index));
  }
}
