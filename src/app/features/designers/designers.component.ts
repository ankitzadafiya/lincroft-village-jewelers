import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Designer } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-designers',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <p class="eyebrow">Houses</p>
      <h1>Designers we keep close.</h1>
      <p class="lede">Brands and makers we carry in the store. Browse a collection, then send us an inquiry.</p>
    </section>
    <section class="container section grid">
      @for (designer of designers(); track designer.id) {
        <a class="card" [routerLink]="['/designers', designer.slug]">
          @if (designer.imageUrl) {
            <img [src]="designer.imageUrl" [alt]="designer.name" />
          }
          <h2>{{ designer.name }}</h2>
          <p>{{ designer.description }}</p>
        </a>
      }
    </section>
  `,
  styles: [`
    .grid { display: grid; gap: 1.5rem; padding-bottom: 4rem; }
    .card { display: grid; gap: 0.7rem; }
    img { width: 100%; height: 280px; object-fit: cover; }
    h2 { font-family: var(--font-logo-serif); font-size: 2.15rem; font-style: normal; font-weight: 600; letter-spacing: -0.005em; line-height: 1.1; }
    p { color: var(--lvj-muted); }
    @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class DesignersComponent implements OnInit {
  private readonly categories = inject(CategoryService);
  readonly designers = signal<Designer[]>([]);

  ngOnInit(): void {
    inject(SeoService).set({
      title: 'Jewelry Designers & Houses',
      description: 'Browse designer collections stocked at Lincroft Village Jewelers in Lincroft, New Jersey.',
      path: '/designers'
    });
    this.categories.designers().subscribe(list => this.designers.set(list));
  }
}
