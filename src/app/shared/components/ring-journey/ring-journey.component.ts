import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../icons/lvj-icons';

interface JourneyStep {
  n: string;
  title: string;
  text: string;
  /** Scroll progress (0–1) that shows this stage at its most complete. */
  at: number;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * "If you can dream it, we can build it" — pinned, scroll-driven ring story.
 *
 *   01 Sketch & design → 02 Wax model → 03 Casting in gold → 04 Setting & finishing
 *
 * - The whole frame fits one screen at any resolution (heights are vh-based).
 * - Visitors can jump to any step (step buttons) or skip the story entirely.
 * - Scroll progress is written to CSS custom properties on the host; the SVG
 *   reacts in CSS. Only the two fill clip-rects are moved from script.
 * - Reduced motion: the finished ring is shown and the section is not pinned.
 */
@Component({
  selector: 'app-ring-journey',
  imports: [RouterLink, AppIconComponent],
  templateUrl: './ring-journey.component.html',
  styleUrl: './ring-journey.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RingJourneyComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly waxRect = viewChild.required<ElementRef<SVGRectElement>>('waxRect');
  private readonly goldRect = viewChild.required<ElementRef<SVGRectElement>>('goldRect');

  readonly steps: JourneyStep[] = [
    {
      n: '01',
      title: 'Sketch & design',
      text: 'We start with a conversation and a hand sketch — your stone, metal, setting style and budget, refined until it feels right.',
      at: 0.22
    },
    {
      n: '02',
      title: 'Wax model',
      text: 'The design is carved in jeweler’s wax so you can see the exact form and proportions before any gold is used.',
      at: 0.47
    },
    {
      n: '03',
      title: 'Casting in gold',
      text: 'Using the lost-wax method, the model is burned out of a plaster mould and molten gold is poured in to take its place.',
      at: 0.74
    },
    {
      n: '04',
      title: 'Setting & finishing',
      text: 'Your diamond is set by hand, prong by prong, then the ring is polished and inspected before it is yours.',
      at: 1
    }
  ];

  readonly step = signal(0);
  readonly reduced = signal(false);
  readonly done = signal(false);

  private ticking = false;
  private readonly onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.update();
    });
  };

  ngAfterViewInit(): void {
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      this.reduced.set(true);
      this.apply(1);
      return;
    }
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll, { passive: true });
    });
    this.update();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }

  /** Jump to a stage (clicking a step). */
  goTo(index: number): void {
    if (this.reduced()) return;
    this.scrollToProgress(this.steps[index].at - 0.02);
  }

  /** Skip past the whole story to the next section. */
  skip(): void {
    const el = this.track().nativeElement;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + el.offsetHeight + 1, behavior: 'smooth' });
  }

  private scrollToProgress(p: number): void {
    const el = this.track().nativeElement;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + clamp(p) * scrollable, behavior: 'smooth' });
  }

  private update(): void {
    const rect = this.track().nativeElement.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const p = scrollable > 0 ? clamp(-rect.top / scrollable) : 1;
    this.apply(p);
  }

  private apply(p: number): void {
    const s1 = seg(p, 0.02, 0.22);
    const s2 = seg(p, 0.25, 0.47);
    const s3 = seg(p, 0.5, 0.74);
    const s4 = seg(p, 0.77, 0.97);
    const cool = seg(s3, 0.6, 1);
    const d = easeOut(seg(s4, 0, 0.6));
    const close = easeOut(seg(s4, 0.55, 0.85));
    const polish = seg(s4, 0.82, 1);

    const style = this.host.nativeElement.style;
    style.setProperty('--p', p.toFixed(4));
    style.setProperty('--s1', s1.toFixed(4));
    style.setProperty('--s2', s2.toFixed(4));
    style.setProperty('--s3', s3.toFixed(4));
    style.setProperty('--s4', s4.toFixed(4));
    style.setProperty('--cool', cool.toFixed(4));
    style.setProperty('--d', d.toFixed(4));
    style.setProperty('--close', close.toFixed(4));
    style.setProperty('--polish', polish.toFixed(4));

    // Fills rise from below the band (y 480) to above the head (y 150).
    const waxY = 480 - s2 * 330;
    const goldY = 480 - seg(s3, 0.15, 0.85) * 330;
    this.waxRect().nativeElement.setAttribute('y', waxY.toFixed(1));
    this.goldRect().nativeElement.setAttribute('y', goldY.toFixed(1));

    const next = p < 0.24 ? 0 : p < 0.49 ? 1 : p < 0.755 ? 2 : 3;
    const finished = p >= 0.97;
    if (next !== this.step() || finished !== this.done()) {
      this.zone.run(() => {
        this.step.set(next);
        this.done.set(finished);
      });
    }
  }
}
