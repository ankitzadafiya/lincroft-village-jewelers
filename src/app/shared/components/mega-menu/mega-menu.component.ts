import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-mega-menu',
  imports: [RouterLink, AppIconComponent],
  template: `
    <div class="mega" (mouseenter)="stay.emit()" (mouseleave)="close.emit()">
      <div class="container inner">
        <div class="browse">
          @if (parent(); as cat) {
            <div class="watermark" aria-hidden="true">
              <img [src]="cat.imageUrl" [alt]="" />
            </div>
          }
          <div class="list">
            <h4>{{ parent()?.name || 'Shop' }}</h4>
            @for (item of children(); track item.id) {
              <a
                [routerLink]="'/' + parentSlug()"
                [queryParams]="{ subcategory: item.slug }"
                (click)="close.emit()">
                {{ item.name }}
              </a>
            }
            @if (!children().length && parent(); as cat) {
              <a [routerLink]="'/' + cat.slug" (click)="close.emit()">Shop All</a>
            }
            <a class="view-all" [routerLink]="'/' + parentSlug()" (click)="close.emit()">
              View all {{ parent()?.name }}
              <app-icon name="arrow-right" [size]="14" [strokeWidth]="1.6"></app-icon>
            </a>
          </div>
        </div>

        <div class="featured">
          @if (parent(); as cat) {
            <p class="label">Featured</p>
            <a class="card" [routerLink]="'/' + cat.slug" (click)="close.emit()">
              <div class="media">
                <img [src]="cat.imageUrl" [alt]="cat.name" />
              </div>
              <div class="meta">
                <span class="name">{{ cat.name }}</span>
                <span class="cta">
                  Shop collection
                  <app-icon name="arrow-right" [size]="14" [strokeWidth]="1.7"></app-icon>
                </span>
              </div>
            </a>
          }
        </div>
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
