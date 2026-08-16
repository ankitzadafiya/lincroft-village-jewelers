import { AfterViewInit, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

@Component({
  selector: 'app-google-sign-in',
  template: `
    <div class="google" [class.live]="googleAuth.configured">
      @if (googleAuth.configured) {
        <div class="gis" #gisHost></div>
      }
      <button type="button" class="google-btn" (click)="fallback()" [disabled]="busy() || disabled()">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.73Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"/>
          <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09Z"/>
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"/>
        </svg>
        {{ label() }}
      </button>
    </div>
  `,
  styles: [`
    .google {
      position: relative;
      min-height: 48px;
    }
    .gis {
      position: absolute;
      inset: 0;
      z-index: 2;
      overflow: hidden;
      opacity: 0.02;
    }
    .google-btn {
      width: 100%;
      min-height: 48px;
      border-radius: 999px;
      border: 1px solid rgba(28, 28, 28, 0.14);
      background: #fff;
      color: #1c1c1c;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.7rem;
      font-weight: 600;
      cursor: pointer;
    }
    .google-btn:hover:not(:disabled) {
      border-color: rgba(28, 28, 28, 0.28);
    }
    .google-btn:disabled {
      opacity: 0.6;
      cursor: wait;
    }
    svg {
      width: 18px;
      height: 18px;
    }
  `]
})
export class GoogleSignInComponent implements AfterViewInit {
  readonly googleAuth = inject(GoogleAuthService);
  readonly label = input('Continue with Google');
  readonly disabled = input(false);
  readonly credential = output<string>();
  readonly failed = output<string>();
  readonly busy = signal(false);
  private readonly gisHost = viewChild<ElementRef<HTMLElement>>('gisHost');

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const host = this.gisHost()?.nativeElement;
      if (!host || !this.googleAuth.configured) return;
      void this.googleAuth.attachButton(host, (token: string) => this.credential.emit(token)).catch((err: unknown) => {
        this.failed.emit(err instanceof Error ? err.message : 'Unable to start Google sign-in.');
      });
    });
  }

  fallback(): void {
    if (this.googleAuth.configured) return;
    if (this.googleAuth.mockFallback) {
      this.credential.emit('mock-google');
      return;
    }
    this.failed.emit('Google sign-in is not configured yet. The atelier still needs a Google Client ID.');
  }
}
