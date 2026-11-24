import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { PrimeTemplate } from 'primeng/api';
import { DiamondSelection } from '../../../core/models';
import { InquiryService } from '../../../core/services/inquiry.service';
import { AppIconComponent } from '../../icons/lvj-icons';

export type DiamondShapeKey =
  | 'round' | 'oval' | 'marquise' | 'radiant' | 'emerald'
  | 'cushion' | 'pear' | 'princess' | 'heart' | 'asscher';

interface DiamondShapeInfo {
  key: DiamondShapeKey;
  name: string;
  blurb: string;
}

interface DiamondCombo {
  clarity: string;
  color: string;
}

/** Display order is deliberate — matches how shapes are presented across the site. */
const SHAPES: DiamondShapeInfo[] = [
  { key: 'round', name: 'Round', blurb: 'The classic brilliant cut, faceted for maximum sparkle and fire. The most popular shape for every setting.' },
  { key: 'oval', name: 'Oval', blurb: 'An elongated brilliant that flatters the finger and tends to look larger than its actual carat weight.' },
  { key: 'marquise', name: 'Marquise', blurb: 'A dramatic, elongated silhouette with pointed ends — maximizes visual size for its weight.' },
  { key: 'radiant', name: 'Radiant', blurb: 'Cropped corners and brilliant faceting combine the sparkle of a round cut with a clean rectangular outline.' },
  { key: 'emerald', name: 'Emerald', blurb: 'Step-cut facets create a hall-of-mirrors effect and an understated, art-deco elegance.' },
  { key: 'cushion', name: 'Cushion', blurb: 'Rounded corners and a pillowy outline give this antique cut a soft, romantic glow.' },
  { key: 'pear', name: 'Pear', blurb: 'A single point and a rounded end blend the brilliance of a round cut with the drama of a marquise.' },
  { key: 'princess', name: 'Princess', blurb: 'A square brilliant cut with crisp corners — exceptional sparkle in a modern silhouette.' },
  { key: 'heart', name: 'Heart', blurb: 'A romantic, symbolic silhouette cut with the same faceting precision as a round brilliant.' },
  { key: 'asscher', name: 'Asscher', blurb: 'A square step cut with deep facets and a vintage, art-deco presence.' }
];

const CARATS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const CLARITIES = ['VVS1', 'VVS2', 'VS1'];
const COLORS = ['D', 'E', 'F'];

/** 3 clarities x 3 colors = 9 combinations, generated once and reused for every carat weight. */
const COMBOS: DiamondCombo[] = CLARITIES.flatMap(clarity => COLORS.map(color => ({ clarity, color })));

@Component({
  selector: 'app-diamond-shapes',
  imports: [RouterLink, DialogModule, PrimeTemplate, AppIconComponent],
  templateUrl: './diamond-shapes.component.html',
  styleUrl: './diamond-shapes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiamondShapesComponent {
  readonly inquiry = inject(InquiryService);

  readonly shapes = SHAPES;
  readonly carats = CARATS;
  readonly combos = COMBOS;

  readonly activeKey = signal<DiamondShapeKey | null>(null);
  readonly activeCarat = signal(1);

  readonly activeShape = computed(() => this.shapes.find(s => s.key === this.activeKey()) ?? null);
  readonly otherShapes = computed(() => this.shapes.filter(s => s.key !== this.activeKey()));
  readonly dialogVisible = computed(() => this.activeKey() !== null);

  /** All diamond selections currently in the inquiry bag, across every shape visited. */
  readonly selectedDiamonds = computed(() => this.inquiry.items().filter(i => i.kind === 'diamond'));

  open(key: DiamondShapeKey): void {
    this.activeKey.set(key);
    this.activeCarat.set(1);
  }

  close(): void {
    this.activeKey.set(null);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) this.close();
  }

  selectCarat(carat: number): void {
    this.activeCarat.set(carat);
  }

  isActiveCarat(carat: number): boolean {
    return this.activeCarat() === carat;
  }

  toggleCombo(combo: DiamondCombo): void {
    const shape = this.activeShape();
    if (!shape) return;
    this.inquiry.toggleDiamond(this.toSelection(shape.name, this.activeCarat(), combo));
  }

  isComboSelected(combo: DiamondCombo): boolean {
    const shape = this.activeShape();
    if (!shape) return false;
    return this.inquiry.hasDiamond(this.toSelection(shape.name, this.activeCarat(), combo));
  }

  cardImg(key: DiamondShapeKey): string {
    return `/images/diamond-shapes/${key}-card.jpg`;
  }

  iconImg(key: DiamondShapeKey): string {
    return `/images/diamond-shapes/${key}-icon.jpg`;
  }

  formatCarat(carat: number): string {
    return carat.toFixed(2);
  }

  private toSelection(shapeName: string, carat: number, combo: DiamondCombo): DiamondSelection {
    const key = this.activeKey();
    return {
      shape: shapeName,
      carat,
      clarity: combo.clarity,
      color: combo.color,
      imageUrl: key ? this.iconImg(key) : null
    };
  }
}
