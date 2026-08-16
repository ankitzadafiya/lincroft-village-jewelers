import { Component, inject, input } from '@angular/core';
import { FavoriteService } from '../../../core/services/favorite.service';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-favorite-button',
  imports: [LvjIconsModule],
  template: `
    <button
      type="button"
      class="fav"
      [class.on]="favorites.isFavorite(id())"
      [class.ghost]="variant() === 'ghost'"
      [attr.aria-label]="favorites.isFavorite(id()) ? 'Remove from wishlist' : 'Add to wishlist'"
      [attr.data-tip]="favorites.isFavorite(id()) ? 'Saved' : 'Wishlist'"
      (click)="onToggle($event)">
      <lucide-icon name="heart" [size]="size()" [strokeWidth]="1.5"></lucide-icon>
    </button>
  `,
  styleUrl: './favorite-button.component.scss'
})
export class FavoriteButtonComponent {
  readonly id = input.required<string>();
  readonly variant = input<'solid' | 'ghost'>('solid');
  readonly size = input(18);
  readonly favorites = inject(FavoriteService);

  onToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.id());
  }
}
