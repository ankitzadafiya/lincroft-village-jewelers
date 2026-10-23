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
  /** Grid slot: m = tall middle, a/b = left stack, c/d = right stack. */
  area: 'm' | 'a' | 'b' | 'c' | 'd';
  index: string;
  /** Studio product shot on white: shown whole instead of cropped. */
  contain: boolean;
}

/**
 * Store's own studio photos (demo). These win over the API `imageUrl`
 * until the backend stores real photos for these categories.
 * `contain` = show the whole piece on white rather than cropping it.
 */
const LOCAL_IMAGES: Record<string, { src: string; contain: boolean }> = {
  ring: { src: '/images/jewelry/engagement-ring-side.webp', contain: false },
  pendant: { src: '/images/jewelry/pear-drop-pendant.webp', contain: true },
  bracelet: { src: '/images/jewelry/tennis-bracelet.webp', contain: true },
  necklace: { src: '/images/jewelry/pear-drop-pendant-side.webp', contain: true },
  // Free Unsplash photo (Unsplash licence) until the store has its own earring renders
  earring: {
    src: 'https://images.unsplash.com/photo-1777999763640-b228fe3192de?w=1200&h=1500&q=80&auto=format&fit=crop',
    contain: false
  }
};

/** Used only when the API category has no `imageUrl`. */
const FALLBACK_IMAGES: Record<string, string> = {
  ring: IMG.catRings,
  earring: IMG.catEarrings,
  pendant: IMG.catPendants,
  necklace: IMG.catNecklaces,
  bracelet: IMG.catBracelets
};

/** Five-tile layout: Rings tall in the middle, two tiles stacked each side. */
const LAYOUT: { slug: string; area: MosaicCard['area'] }[] = [
  { slug: 'earring', area: 'a' },
  { slug: 'pendant', area: 'b' },
  { slug: 'ring', area: 'm' },
  { slug: 'necklace', area: 'c' },
  { slug: 'bracelet', area: 'd' }
];

/**
 * Home "Our Categories" — five-tile editorial grid sized to fit one screen.
 * Labels sit on the photo; hover zooms the image, draws an inset frame,
 * sweeps a light sheen and slides in "Shop now".
 * (Silver + 24k gold is intentionally not shown here for now.)
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

  readonly cards = computed<MosaicCard[]>(() => {
    const top = this.categories().filter(c => !c.parentId);
    return LAYOUT.map((slot, i) => {
      const c = top.find(cat => cat.slug === slot.slug);
      if (!c) return null;
      return {
        id: c.id,
        slug: c.slug,
        label: STORE_TOP_CATEGORIES.find(s => s.slug === c.slug)?.navLabel ?? c.name,
        meta: this.countLabel(c.productCount),
        image: LOCAL_IMAGES[c.slug]?.src || c.imageUrl || FALLBACK_IMAGES[c.slug] || '',
        contain: !!LOCAL_IMAGES[c.slug]?.contain,
        alt: `${c.name} jewelry at Lincroft Village Jewelers`,
        area: slot.area,
        index: String(i + 1).padStart(2, '0')
      };
    }).filter((c): c is MosaicCard => !!c);
  });

  readonly hasCards = computed(() => this.cards().length > 0);

  private countLabel(count?: number): string {
    if (!count || count <= 0) return 'Shop collection';
    return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  }
}
