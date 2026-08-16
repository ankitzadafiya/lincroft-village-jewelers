import { Component, input } from '@angular/core';
import { Testimonial } from '../../../core/models';

@Component({
  selector: 'app-testimonial-card',
  template: `
    <article class="card">
      <strong>{{ testimonial().name }}</strong>
      <div class="stars" [attr.aria-label]="testimonial().rating + ' star rating'">
        @for (s of stars; track s) {
          <span>★</span>
        }
      </div>
      <h3>{{ headline() }}</h3>
      <p>{{ testimonial().quote }}</p>
    </article>
  `,
  styles: [`
    .card {
      background: #fff;
      padding: 1.6rem 1.5rem 1.75rem;
      height: 100%;
      box-shadow: 0 1px 0 rgba(0,0,0,0.04);
      transition: transform 0.35s var(--lvj-ease), box-shadow 0.35s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 36px rgba(0,0,0,0.08);
    }
    strong {
      display: block;
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
    }
    .stars {
      color: #c2a15a;
      letter-spacing: 0.08em;
      font-size: 0.85rem;
      margin-bottom: 0.7rem;
    }
    h3 {
      font-family: var(--font-body);
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.55rem;
      letter-spacing: -0.01em;
    }
    p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.65;
    }
  `]
})
export class TestimonialCardComponent {
  readonly testimonial = input.required<Testimonial>();
  readonly stars = [1, 2, 3, 4, 5];

  headline(): string {
    const q = this.testimonial().quote.trim();
    const first = q.split(/[.!?]/)[0]?.trim();
    return first ? first.slice(0, 42) : 'A wonderful experience';
  }
}
