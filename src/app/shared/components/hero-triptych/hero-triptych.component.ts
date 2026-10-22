import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { AppIconComponent } from '../../icons/lvj-icons';

interface TriptychPanelDef {
  /** Unique key for the panel. */
  key: string;
  /** Top-level category slug — must match STORE_TOP_CATEGORIES / API. */
  slug: string;
  /** Optional subcategory filter for the link. */
  subcategory?: string;
  eyebrow: string;
  title: string;
  /** Italic accent word(s) rendered after `title`. */
  accent: string;
  /** Hero photo (store-supplied, in /public/images/hero). */
  image: string;
  /** Short resting label shown before hover. */
  label: string;
}

interface TriptychPanel extends TriptychPanelDef {
  alt: string;
  path: string;
  queryParams: Record<string, string> | null;
}

/**
 * Home hero — three full-height editorial panels.
 * Desktop: hovering (or keyboard-focusing) a panel blurs and dims its image
 * and reveals the collection title + CTA. Touch: copy is always visible and
 * panels scroll horizontally with snap.
 *
 * Images come from the API category `imageUrl` (admin-managed), falling back
 * to the existing static catalog images.
 */
@Component({
  selector: 'app-hero-triptych',
  imports: [RouterLink, AppIconComponent],
  templateUrl: './hero-triptych.component.html',
  styleUrl: './hero-triptych.component.scss'
})
export class HeroTriptychComponent {
  /** Top-level categories from the API (optional — fallbacks apply). */
  readonly categories = input<Category[]>([]);

  private readonly defs: TriptychPanelDef[] = [
    {
      key: 'rings',
      slug: 'ring',
      eyebrow: 'Ring collection',
      title: 'Rings of',
      accent: 'Radiance',
      label: 'Rings',
      image: '/images/hero/hero-ring-on-hand.webp'
    },
    {
      key: 'bands',
      slug: 'ring',
      subcategory: 'ring-lab-grown-wedding-band',
      eyebrow: 'Wedding bands',
      title: 'Bands of',
      accent: 'Forever',
      label: 'Wedding bands',
      image: '/images/hero/hero-eternity-band.webp'
    },
    {
      key: 'earrings',
      slug: 'earring',
      eyebrow: 'Earring collection',
      title: 'Everyday',
      accent: 'Brilliance',
      label: 'Earrings',
      image: '/images/hero/hero-diamond-studs.webp'
    }
  ];

  readonly panels = computed<TriptychPanel[]>(() => {
    const list = this.categories();
    return this.defs.map(def => {
      const cat = list.find(c => c.slug === def.slug && !c.parentId);
      return {
        ...def,
        alt: `${def.label}, ${cat?.name ? cat.name + ' collection, ' : ''}Lincroft Village Jewelers`,
        path: '/' + def.slug,
        queryParams: def.subcategory ? { subcategory: def.subcategory } : null
      };
    });
  });
}
