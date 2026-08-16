import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'lvj_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSignal = signal<ThemeMode>(this.readInitial());
  readonly mode = this.modeSignal.asReadonly();
  readonly isDark = () => this.modeSignal() === 'dark';

  constructor() {
    this.apply(this.modeSignal());
  }

  toggle(): void {
    this.set(this.modeSignal() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore private mode */
    }
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
  }

  private readInitial(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
}
