import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-page-loader',
  template: `
    @if (loading.busy()) {
      <div class="bar" role="progressbar" aria-busy="true" aria-label="Loading">
        <span class="bar-fill"></span>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      height: 3px;
      pointer-events: none;
      overflow: hidden;
    }

    .bar-fill {
      display: block;
      height: 100%;
      width: 32%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--lvj-navy), #5a9bc8, var(--lvj-navy));
      background-size: 200% 100%;
      animation: bar-slide 1s var(--lvj-ease) infinite, bar-shimmer 1.35s linear infinite;
      box-shadow: 0 0 10px rgba(14, 47, 77, 0.3);
    }

    @keyframes bar-slide {
      0% { transform: translateX(-130%); }
      100% { transform: translateX(420%); }
    }

    @keyframes bar-shimmer {
      0% { background-position: 0% 0; }
      100% { background-position: 200% 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .bar-fill { animation-duration: 1.8s; }
    }
  `]
})
export class PageLoaderComponent implements OnInit {
  readonly loading = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(e =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.loading.setNavigating(event instanceof NavigationStart);
      });
  }
}
