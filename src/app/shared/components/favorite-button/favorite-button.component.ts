import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-favorite-button',
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      class="fav"
      [class.on]="favorites.isFavorite(id())"
      [class.ghost]="variant() === 'ghost'"
      [attr.aria-label]="favorites.isFavorite(id()) ? 'Remove from wishlist' : 'Add to wishlist'"
      [attr.data-tip]="favorites.isFavorite(id()) ? 'Saved' : 'Wishlist'"
      (click)="onToggle($event)">
      <app-icon name="heart" [size]="size()" [strokeWidth]="1.5"></app-icon>
    </button>
  `,
  styleUrl: './favorite-button.component.scss'
})
export class FavoriteButtonComponent {
  readonly id = input.required<string>();
  readonly variant = input<'solid' | 'ghost'>('solid');
  readonly size = input(18);
  readonly favorites = inject(FavoriteService);
  private readonly customer = inject(CustomerAuthService);
  private readonly confirm = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  onToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.customer.isAuthenticated()) {
      this.promptSignIn();
      return;
    }

    const wasFavorite = this.favorites.isFavorite(this.id());
    if (!this.favorites.toggle(this.id())) {
      this.promptSignIn();
      return;
    }

    this.toast.success(
      wasFavorite ? 'Removed from your wishlist.' : 'Saved to your wishlist.',
      wasFavorite ? 'Removed' : 'Wishlist'
    );
  }

  private promptSignIn(): void {
    this.confirm.confirm({
      header: 'Sign in to save',
      message: 'Wishlist items are saved to your account — not only on this device. Sign in or create an account to keep the pieces you love.',
      icon: 'pi pi-heart',
      acceptLabel: 'Sign in',
      rejectLabel: 'Not now',
      acceptButtonStyleClass: 'p-button-sm',
      rejectButtonStyleClass: 'p-button-sm p-button-text',
      accept: () => {
        this.favorites.setPending(this.id());
        void this.router.navigate(['/account'], {
          queryParams: {
            returnUrl: this.router.url,
            wishlist: this.id()
          }
        });
      }
    });
  }
}
