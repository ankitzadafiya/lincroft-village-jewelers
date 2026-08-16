import { Component, inject, input, output, signal } from '@angular/core';
import { ProductMedia } from '../../../core/models';
import { MediaService } from '../../../core/services/media.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-media-uploader',
  template: `
    <div class="uploader">
      <div class="head">
        <h3>{{ kind() === 'image' ? 'Images' : 'Videos' }}</h3>
        <small>{{ items().length }} / {{ max() }}</small>
      </div>
      <div class="list">
        @for (item of items(); track item.id; let i = $index) {
          <div class="item">
            @if (kind() === 'image') {
              <img [src]="item.thumbnailUrl || item.url" [alt]="item.alt" />
            } @else {
              <video [src]="item.url"></video>
            }
            <div class="row">
              <button type="button" (click)="move(i, -1)" [disabled]="i === 0">Up</button>
              <button type="button" (click)="move(i, 1)" [disabled]="i === items().length - 1">Down</button>
              @if (kind() === 'image') {
                <button type="button" (click)="setPrimary(i)">{{ item.isPrimary ? 'Primary' : 'Make primary' }}</button>
              }
              <button type="button" (click)="remove(i)">Remove</button>
            </div>
          </div>
        }
      </div>
      @if (items().length < max()) {
        <label class="drop">
          <input type="file" [accept]="kind() === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'" (change)="onFile($event)" />
          <span>Upload {{ kind() }}</span>
        </label>
      }
      @if (progress() != null) {
        <div class="bar"><span [style.width.%]="progress()"></span></div>
      }
    </div>
  `,
  styles: [`
    .uploader { display: grid; gap: 0.8rem; }
    .head { display: flex; justify-content: space-between; align-items: baseline; }
    h3 { font-size: 1.3rem; }
    .list { display: grid; gap: 0.7rem; }
    .item { display: grid; grid-template-columns: 90px 1fr; gap: 0.7rem; align-items: center; }
    img, video { width: 90px; height: 90px; object-fit: cover; background: #efe8dc; }
    .row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .row button {
      border: 1px solid var(--lvj-line-strong);
      background: transparent;
      padding: 0.35rem 0.55rem;
      cursor: pointer;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .drop {
      border: 1px dashed var(--lvj-gold);
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 0.72rem;
    }
    .drop input { display: none; }
    .bar { height: 3px; background: var(--lvj-beige); }
    .bar span { display: block; height: 100%; background: var(--lvj-gold); }
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
