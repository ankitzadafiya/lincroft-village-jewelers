import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly httpCount = signal(0);
  private readonly navigating = signal(false);

  readonly busy = computed(() => this.httpCount() > 0 || this.navigating());
  readonly httpBusy = computed(() => this.httpCount() > 0);

  startHttp(): void {
    this.httpCount.update(n => n + 1);
  }

  stopHttp(): void {
    this.httpCount.update(n => Math.max(0, n - 1));
  }

  setNavigating(value: boolean): void {
    this.navigating.set(value);
  }
}
