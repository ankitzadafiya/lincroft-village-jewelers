import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';
import { AppIconComponent } from '../../icons/lvj-icons';

/**
 * Dropdown for one top-level category, anchored directly under its nav item.
 *
 * Every dropdown stays in the DOM (inactive ones are `inert` + visually hidden)
 * so subcategory links are crawlable and the active one is reachable by
 * keyboard / screen readers.
 */
@Component({
  selector: 'app-mega-menu',
  imports: [RouterLink, AppIconComponent],
  templateUrl: './mega-menu.component.html',
  styleUrl: './mega-menu.component.scss',
  host: {
    '[class.active]': 'active()',
    '[attr.id]': 'panelId()',
    '[attr.inert]': 'active() ? null : ""',
    '[attr.aria-hidden]': 'active() ? null : "true"'
  }
})
export class MegaMenuComponent {
  readonly parent = input<Category | null>(null);
  readonly children = input<Category[]>([]);
  readonly parentSlug = input('');
  /** Plural nav label, e.g. "Rings". */
  readonly label = input('');
  readonly active = input(false);
  readonly panelId = input<string | null>(null);
  readonly close = output<void>();

  readonly path = computed(() => '/' + this.parentSlug());
  readonly displayLabel = computed(() => this.label() || this.parent()?.name || '');
}
