import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../core/models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { AppIconComponent } from '../../icons/lvj-icons';

/**
 * Home product rail (Best sellers / New arrivals):
 * heading on the light band, then up to four cards on a dark-navy panel,
 * with a vertical "View all" strip down the right-hand edge.
 * The products are chosen in the admin panel (product flags) — see
 * BACKEND_HOME_COLLECTIONS.md.
 */
@Component({
  selector: 'app-home-collection',
  imports: [RouterLink, ProductCardComponent, AppIconComponent],
  templateUrl: './home-collection.component.html',
  styleUrl: './home-collection.component.scss'
})
export class HomeCollectionComponent {
  readonly kicker = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly products = input<ProductListItem[]>([]);
  readonly loading = input(false);
  readonly viewAllLink = input.required<string>();
  readonly viewAllLabel = input('View all');

  /** Used for the heading id (aria-labelledby). */
  readonly key = input.required<string>();

  readonly ghosts = [0, 1, 2, 3];
}
