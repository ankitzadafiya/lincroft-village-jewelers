import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-mega-menu',
  imports: [RouterLink, AppIconComponent],
  template: `
    <div class="mega" (mouseenter)="stay.emit()" (mouseleave)="close.emit()">
      <div class="panel">
        @if (parent(); as cat) {
          <div class="links">
            <p class="cat-label">{{ cat.name }}</p>
            <nav [attr.aria-label]="cat.name + ' subcategories'">
              @for (item of children(); track item.id) {
                <a
                  class="sub-link"
                  [routerLink]="'/' + parentSlug()"
                  [queryParams]="{ subcategory: item.slug }"
                  (click)="close.emit()">
                  {{ item.name }}
                </a>
              }
              @if (!children().length) {
                <a class="sub-link" [routerLink]="'/' + cat.slug" (click)="close.emit()">
                  Shop all {{ cat.name }}
                </a>
              }
            </nav>
            <a class="view-all" [routerLink]="'/' + parentSlug()" (click)="close.emit()">
              View all {{ cat.name }}
              <app-icon name="arrow-right" [size]="14" [strokeWidth]="1.75"></app-icon>
            </a>
          </div>

          @if (cat.imageUrl) {
            <div class="featured">
              <p class="featured-label">Featured</p>
              <a class="featured-card" [routerLink]="'/' + cat.slug" (click)="close.emit()">
                <div class="featured-media">
                  <img [src]="cat.imageUrl" [alt]="cat.name" loading="lazy" decoding="async" />
                </div>
                <div class="featured-foot">
                  <span class="featured-name">{{ cat.name }}</span>
                  <span class="featured-cta">
                    Shop collection
                    <app-icon name="arrow-right" [size]="13" [strokeWidth]="1.75"></app-icon>
                  </span>
                </div>
              </a>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './mega-menu.component.scss'
})
export class MegaMenuComponent {
  readonly parent = input<Category | null>(null);
  readonly children = input<Category[]>([]);
  readonly parentSlug = input('');
  readonly close = output<void>();
  readonly stay = output<void>();
}
