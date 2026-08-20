import { NgModule, Component, computed, input } from '@angular/core';
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Columns3,
  Columns4,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Heart,
  Image,
  Inbox,
  Instagram,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  type LucideIconData,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Pencil,
  Phone,
  Power,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Sun,
  Trash2,
  Upload,
  User,
  Users,
  Video,
  X
} from 'lucide-angular';

/** kebab-case name → Lucide icon nodes */
const ICONS: Record<string, LucideIconData> = {
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'columns-2': Columns2,
  'columns-3': Columns3,
  'columns-4': Columns4,
  eye: Eye,
  'eye-off': EyeOff,
  facebook: Facebook,
  'file-text': FileText,
  heart: Heart,
  image: Image,
  inbox: Inbox,
  instagram: Instagram,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'log-out': LogOut,
  'map-pin': MapPin,
  menu: Menu,
  'message-circle': MessageCircle,
  moon: Moon,
  package: Package,
  pencil: Pencil,
  phone: Phone,
  power: Power,
  search: Search,
  settings: Settings,
  shield: Shield,
  'shopping-bag': ShoppingBag,
  sparkles: Sparkles,
  star: Star,
  store: Store,
  sun: Sun,
  'trash-2': Trash2,
  upload: Upload,
  user: User,
  users: Users,
  video: Video,
  x: X
};

type IconNode = LucideIconData[number];

/**
 * Standalone replacement for lucide-angular's non-standalone `<lucide-icon>`.
 * Import `AppIconComponent` or `LvjIconsModule` in the host component.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">
      @for (node of nodes(); track $index) {
        @switch (tag(node)) {
          @case ('path') {
            <path [attr.d]="attr(node, 'd')" />
          }
          @case ('circle') {
            <circle [attr.cx]="attr(node, 'cx')" [attr.cy]="attr(node, 'cy')" [attr.r]="attr(node, 'r')" />
          }
          @case ('line') {
            <line
              [attr.x1]="attr(node, 'x1')"
              [attr.y1]="attr(node, 'y1')"
              [attr.x2]="attr(node, 'x2')"
              [attr.y2]="attr(node, 'y2')" />
          }
          @case ('polyline') {
            <polyline [attr.points]="attr(node, 'points')" />
          }
          @case ('polygon') {
            <polygon [attr.points]="attr(node, 'points')" />
          }
          @case ('rect') {
            <rect
              [attr.x]="attr(node, 'x')"
              [attr.y]="attr(node, 'y')"
              [attr.width]="attr(node, 'width')"
              [attr.height]="attr(node, 'height')"
              [attr.rx]="attr(node, 'rx')"
              [attr.ry]="attr(node, 'ry')" />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
      color: inherit;
    }
    svg {
      display: block;
    }
  `
})
export class AppIconComponent {
  readonly name = input.required<string>();
  readonly size = input<number | string>(24);
  readonly strokeWidth = input<number | string>(2);

  readonly nodes = computed(() => ICONS[this.name()] ?? []);

  tag(node: IconNode): string {
    return node[0];
  }

  attr(node: IconNode, key: string): string | number | undefined {
    const value = (node[1] as Record<string, string | number>)[key];
    return value;
  }
}

@NgModule({
  imports: [AppIconComponent],
  exports: [AppIconComponent]
})
export class LvjIconsModule {}
