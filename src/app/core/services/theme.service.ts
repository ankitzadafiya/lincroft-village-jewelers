import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSignal = signal<ThemeMode>('light');
  readonly mode = this.modeSignal.asReadonly();
  readonly isDark = () => this.modeSignal() === 'dark';

  constructor() {
    this.apply('light');
  }

  /** Applies storefront theme from admin configuration. */
  applyFromConfig(darkModeEnabled: boolean): void {
    this.set(darkModeEnabled ? 'dark' : 'light');
  }

  private set(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.apply(mode);
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
  }
}
