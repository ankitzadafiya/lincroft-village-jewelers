import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

export type RevealVariant = 'up' | 'fade' | 'scale' | 'left' | 'right' | 'zoom' | 'clip' | 'soft';

@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Animation style when the block enters the viewport. */
  readonly appReveal = input<RevealVariant | ''>('up');
  readonly appRevealDelay = input(0);
  /** When true, nested cards/grid items stagger in after the parent reveals. */
  readonly appRevealStagger = input(false);

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    const variant = this.appReveal() || 'up';

    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('reveal-in');
      return;
    }

    node.classList.add('reveal', `reveal-${variant}`);
    if (this.appRevealStagger()) node.classList.add('reveal-stagger');

    const delay = this.appRevealDelay();
    if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('reveal-in');
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
