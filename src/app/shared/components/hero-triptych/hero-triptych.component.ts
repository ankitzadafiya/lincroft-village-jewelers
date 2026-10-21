import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { IMG } from '../../../core/mock/image-catalog';
import { AppIconComponent } from '../../icons/lvj-icons';

interface TriptychPanelDef {
  /** Top-level category slug — must match STORE_TOP_CATEGORIES / API. */
  slug: string;
  eyebrow: string;
  title: string;
  /** Italic accent word(s) rendered after `title`. */
  accent: string;
  /** Used only when the API category has no `imageUrl`. */
  fallbackImage: string;
  /** Short resting label shown before hover. */
  label: string;
}

interface TriptychPanel extends TriptychPanelDef {
  image: string;
  alt: string;
  path: string;
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
      slug: 'ring',
      eyebrow: 'Ring collection',
      title: 'Rings of',
      accent: 'Radiance',
      label: 'Rings',
      fallbackImage: IMG.catRings
    },
    {
      slug: 'earring',
      eyebrow: 'Earring collection',
      title: 'Everyday',
      accent: 'Brilliance',
      label: 'Earrings',
      fallbackImage: IMG.catEarrings
    },
    {
      slug: 'bracelet',
      eyebrow: 'Tennis collection',
      title: 'Lines of',
      accent: 'Light',
      label: 'Bracelets',
      fallbackImage: IMG.catBracelets
    }
  ];

  readonly panels = computed<TriptychPanel[]>(() => {
    const list = this.categories();
    return this.defs.map(def => {
      const cat = list.find(c => c.slug === def.slug && !c.parentId);
      return {
        ...def,
        image: cat?.imageUrl || def.fallbackImage,
        alt: `${cat?.name ?? def.label} — Lincroft Village Jewelers`,
        path: '/' + def.slug
      };
    });
  });
}
