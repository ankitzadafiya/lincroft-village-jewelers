import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STORE_TOP_CATEGORIES } from '../../../core/catalog/store-categories';
import { Category } from '../../../core/models';
import { IMG } from '../../../core/mock/image-catalog';
import { AppIconComponent } from '../../icons/lvj-icons';

interface MosaicCard {
  id: string;
  slug: string;
  label: string;
  meta: string;
  image: string;
  alt: string;
  featured: boolean;
}

/** Used only when the API category has no `imageUrl`. */
const FALLBACK_IMAGES: Record<string, string> = {
  ring: IMG.catRings,
  earring: IMG.catEarrings,
  pendant: IMG.catPendants,
  necklace: IMG.catNecklaces,
  bracelet: IMG.catBracelets,
  'silver-jewelry-with-24k-gold-plating': IMG.catSilver
};

/**
 * Home "Our Categories" — editorial 3-column mosaic.
 * Left + right columns stack two cards; the middle column holds the featured
 * (tall) card, plus a shorter sixth card when one exists.
 * Hover: a diagonal light sheen bursts outward from the centre of the image.
 * Data: API top-level categories (order follows STORE_TOP_CATEGORIES).
 */
@Component({
  selector: 'app-category-mosaic',
  imports: [RouterLink, AppIconComponent],
  templateUrl: './category-mosaic.component.html',
  styleUrl: './category-mosaic.component.scss'
})
export class CategoryMosaicComponent {
  readonly categories = input<Category[]>([]);
  /** Piece counts under each name — off for now, flip on when ready. */
  readonly showCount = input(false);
  readonly title = input('Categories');
  readonly titleAccent = input('Our');
  readonly subtitle = input(
    'Lab-grown and natural diamond pieces, chosen for the floor in Lincroft. Find the signature piece you will wear every day.'
  );

  private readonly cards = computed<MosaicCard[]>(() =>
    this.categories()
      .filter(c => !c.parentId)
      .map((c, i) => ({
        id: c.id,
        slug: c.slug,
        label: STORE_TOP_CATEGORIES.find(s => s.slug === c.slug)?.navLabel ?? c.name,
        meta: this.countLabel(c.productCount),
        image: c.imageUrl || FALLBACK_IMAGES[c.slug] || '',
        alt: `${c.name} jewelry at Lincroft Village Jewelers`,
        featured: i === 0
      }))
  );

  /** Distribute cards: [1,2] left · [0,5] middle · [3,4] right · extras round-robin. */
  readonly columns = computed<MosaicCard[][]>(() => {
    const list = this.cards();
    const left = [list[1], list[2]];
    const middle = [list[0], list[5]];
    const right = [list[3], list[4]];
    const cols = [left, middle, right];
    list.slice(6).forEach((card, i) => cols[i % 3].push(card));
    return cols.map(col => col.filter((c): c is MosaicCard => !!c));
  });

  readonly hasCards = computed(() => this.cards().length > 0);

  private countLabel(count?: number): string {
    if (!count || count <= 0) return 'Shop collection';
    return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  }
}
