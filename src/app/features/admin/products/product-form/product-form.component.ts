import { Component, OnChanges, OnInit, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  Category,
  DEFAULT_RING_SIZES,
  Designer,
  KARATS,
  Karat,
  KaratPrice,
  METAL_COLORS,
  MetalColor,
  ProductMedia,
  ProductOptions,
  ProductSpec,
  SpecGroup,
  toMediaWrite
} from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { DesignerService } from '../../../../core/services/designer.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MediaUploaderComponent } from '../../../../shared/components/media-uploader/media-uploader.component';
import { ProductDescriptionComponent } from '../../../../shared/components/product-description/product-description.component';

/** Swatch paint used in the admin uploader headings (matches the storefront). */
const SWATCH: Record<MetalColor, string> = {
  yellow: 'linear-gradient(135deg, #fbecb5 0%, #e8c76a 45%, #c99a3a 100%)',
  white: 'linear-gradient(135deg, #ffffff 0%, #e6e9ee 50%, #c3c9d2 100%)',
  rose: 'linear-gradient(135deg, #f8dccd 0%, #e5ad93 50%, #c9846a 100%)'
};

type RingSizeMode = 'auto' | 'on' | 'off';

/** Example shown under the description box. */
const DESCRIPTION_EXAMPLE = `Crafted in 14K solid gold, this vintage-inspired ring…

💎 DIAMOND DETAILS
* Diamond Type: Lab Grown Diamond
* Shape: Round Cut
* Carat Weight: 0.10 TCW Approx.

📦 PACKAGING & SHIPPING
* Comes in a premium jewelry gift box ready for gifting.`;

const PRESETS: Record<string, ProductSpec[]> = {
  ring: [
    { key: 'metal', label: 'Metal', value: '', group: 'metal' },
    { key: 'karat', label: 'Karat', value: '', group: 'metal' },
    { key: 'diamondType', label: 'Diamond', value: '', group: 'diamond' },
    { key: 'shape', label: 'Shape', value: '', group: 'diamond' },
    { key: 'carat', label: 'Carat', value: '', group: 'diamond' },
    { key: 'color', label: 'Color', value: '', group: 'diamond' },
    { key: 'clarity', label: 'Clarity', value: '', group: 'diamond' },
    { key: 'size', label: 'Size', value: '', group: 'general' }
  ],
  earrings: [
    { key: 'metal', label: 'Metal', value: '', group: 'metal' },
    { key: 'karat', label: 'Karat', value: '', group: 'metal' },
    { key: 'gemstone', label: 'Gemstone', value: '', group: 'gemstone' },
    { key: 'diamondType', label: 'Diamond', value: '', group: 'diamond' },
    { key: 'weight', label: 'Weight', value: '', group: 'dimensions' }
  ],
  watch: [
    { key: 'brand', label: 'Brand', value: '', group: 'watch' },
    { key: 'model', label: 'Model', value: '', group: 'watch' },
    { key: 'movement', label: 'Movement', value: '', group: 'watch' },
    { key: 'case', label: 'Case material', value: '', group: 'watch' },
    { key: 'strap', label: 'Strap', value: '', group: 'watch' },
    { key: 'water', label: 'Water resistance', value: '', group: 'watch' }
  ]
};

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    MediaUploaderComponent,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    ProductDescriptionComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly designersApi = inject(DesignerService);
  private readonly toast = inject(ToastService);

  readonly productId = input<string | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly categories = signal<Category[]>([]);
  readonly designers = signal<Designer[]>([]);
  readonly images = signal<ProductMedia[]>([]);
  readonly videos = signal<ProductMedia[]>([]);
  readonly saving = signal(false);
  readonly loading = signal(false);

  readonly statusOptions: SelectOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Archived', value: 'archived' }
  ];

  readonly availabilityOptions: SelectOption[] = [
    { label: 'In stock', value: 'in_stock' },
    { label: 'Made to order', value: 'made_to_order' },
    { label: 'Sold', value: 'sold' }
  ];

  readonly groupOptions: SelectOption[] = [
    { label: 'Metal', value: 'metal' },
    { label: 'Diamond', value: 'diamond' },
    { label: 'Gemstone', value: 'gemstone' },
    { label: 'Watch', value: 'watch' },
    { label: 'Dimensions', value: 'dimensions' },
    { label: 'General', value: 'general' }
  ];

  readonly form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    categoryId: ['', Validators.required],
    subcategoryId: [''],
    designerId: [''],
    brandName: [''],
    price: [null as number | null],
    compareAtPrice: [null as number | null],
    showPrice: [true],
    status: ['active'],
    availability: ['in_stock'],
    featured: [false],
    newArrival: [false],
    bestSeller: [false],
    tags: [''],
    specs: this.fb.array<ReturnType<ProductFormComponent['specGroup']>>([]),
    options: this.fb.nonNullable.group({
      colorYellow: [false],
      colorWhite: [false],
      colorRose: [false],
      defaultMetalColor: [''],
      karat10: this.karatGroup(),
      karat14: this.karatGroup(),
      karat18: this.karatGroup(),
      defaultKarat: [''],
      ringSizeMode: ['auto' as RingSizeMode],
      ringSizes: [DEFAULT_RING_SIZES.join(', ')],
      allowCustomization: [true]
    })
  });

  readonly metalColors = METAL_COLORS.map(c => ({ ...c, swatch: SWATCH[c.value] }));
  readonly karats = KARATS;
  readonly descriptionExample = DESCRIPTION_EXAMPLE;
  readonly ringSizeModes: SelectOption[] = [
    { label: 'Automatic (rings only)', value: 'auto' },
    { label: 'Always show', value: 'on' },
    { label: 'Do not show', value: 'off' }
  ];

  /** Live copy of the description for the preview pane. */
  readonly descriptionPreview = signal('');
  readonly showPreview = signal(true);

  readonly categoryOptions = computed<SelectOption[]>(() =>
    this.categories()
      .filter(c => !c.parentId)
      .map(c => ({ label: c.name, value: c.id }))
  );

  readonly subcategoryOptions = computed<SelectOption[]>(() => {
    const parentId = this.form.controls.categoryId.value;
    return this.categories()
      .filter(c => c.parentId === parentId)
      .map(c => ({ label: c.name, value: c.id }));
  });

  readonly designerOptions = computed<SelectOption[]>(() =>
    this.designers().map(d => ({ label: d.name, value: d.id }))
  );

  get specs(): FormArray {
    return this.form.controls.specs;
  }

  private karatGroup() {
    return this.fb.nonNullable.group({
      enabled: [false],
      price: [null as number | null],
      compareAtPrice: [null as number | null]
    });
  }

  karatControl(k: Karat) {
    const o = this.form.controls.options.controls;
    return k === '10K' ? o.karat10 : k === '14K' ? o.karat14 : o.karat18;
  }

  colorControl(c: MetalColor) {
    const o = this.form.controls.options.controls;
    return c === 'yellow' ? o.colorYellow : c === 'white' ? o.colorWhite : o.colorRose;
  }

  /** Colors ticked in the form, in display order. */
  checkedColors(): MetalColor[] {
    return METAL_COLORS.map(c => c.value).filter(c => this.colorControl(c).value);
  }

  colorLabel(color: MetalColor | undefined): string {
    return METAL_COLORS.find(c => c.value === color)?.label ?? '';
  }

  enabledKarats(): Karat[] {
    return KARATS.filter(k => this.karatControl(k).controls.enabled.value);
  }

  // ── Photos per metal color ────────────────────────
  /** Photos for one color, or the shared photos (`null`) that suit every color. */
  imagesFor(color: MetalColor | null): ProductMedia[] {
    return this.images().filter(i => (i.metalColor ?? null) === color);
  }

  setImagesFor(color: MetalColor | null, list: ProductMedia[]): void {
    const before = this.imagesFor(color);
    const tagged = list.map(i => ({ ...i, metalColor: color }));
    const gainedPrimary = tagged.find(i => i.isPrimary && !before.find(b => b.url === i.url && b.isPrimary));

    // Keep groups in a stable order: shared, yellow, white, rose.
    const groups: (MetalColor | null)[] = [null, ...METAL_COLORS.map(c => c.value)];
    let merged = groups.flatMap(g => (g === color ? tagged : this.imagesFor(g)));

    // Exactly one primary photo across all groups.
    if (gainedPrimary) {
      merged = merged.map(i => ({ ...i, isPrimary: i.url === gainedPrimary.url }));
    } else {
      const primaries = merged.filter(i => i.isPrimary);
      if (primaries.length !== 1) {
        const keep = primaries[0]?.url ?? merged[0]?.url;
        merged = merged.map(i => ({ ...i, isPrimary: i.url === keep }));
      }
    }
    this.images.set(merged.map((i, index) => ({ ...i, sortOrder: index })));

    // Uploading photos for a color turns that color on.
    if (color && tagged.length) this.colorControl(color).setValue(true);
  }

  get id(): string | null {
    return this.productId();
  }

  ngOnInit(): void {
    this.form.controls.categoryId.valueChanges.subscribe(value => {
      if (this.loading()) return;
      const currentSub = this.form.controls.subcategoryId.value;
      const stillValid = this.categories().some(c => c.id === currentSub && c.parentId === value);
      if (!stillValid) this.form.controls.subcategoryId.setValue('');
    });
    this.form.controls.description.valueChanges.subscribe(v => this.descriptionPreview.set(v ?? ''));
    this.bootstrap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.bootstrap();
    }
  }

  private bootstrap(): void {
    if (!this.categories().length) {
      this.categoriesApi.adminList().subscribe(list => this.categories.set(list));
      this.designersApi.adminList().subscribe(list => this.designers.set(list));
    }
    this.resetForm();
    const id = this.productId();
    if (!id) return;
    this.loading.set(true);
    this.admin.get(id).subscribe({
      next: product => {
        this.form.patchValue({
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId ?? '',
          designerId: product.designerId ?? '',
          brandName: product.brandName ?? '',
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          showPrice: product.showPrice,
          status: product.status,
          availability: product.availability,
          featured: product.featured,
          newArrival: product.newArrival,
          bestSeller: product.bestSeller,
          tags: product.tags.join(', ')
        });
        this.patchOptions(product.options ?? null, product.images);
        this.specs.clear();
        product.specs.forEach(s => this.specs.push(this.specGroup(s)));
        this.images.set(product.images);
        this.videos.set(product.videos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Unable to load product.');
      }
    });
  }

  private resetForm(): void {
    this.form.reset({
      sku: '',
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      designerId: '',
      brandName: '',
      price: null,
      compareAtPrice: null,
      showPrice: true,
      status: 'active',
      availability: 'in_stock',
      featured: false,
      newArrival: false,
      bestSeller: false,
      tags: ''
    });
    this.patchOptions(null, []);
    this.specs.clear();
    this.images.set([]);
    this.videos.set([]);
  }

  private patchOptions(options: ProductOptions | null, images: ProductMedia[]): void {
    const tagged = new Set(images.map(i => i.metalColor).filter(Boolean));
    const colors = options?.metalColors?.length ? options.metalColors : [...tagged];
    const karat = (k: Karat) => {
      const row = options?.karatPrices?.find(x => x.karat === k);
      return { enabled: !!row, price: row?.price ?? null, compareAtPrice: row?.compareAtPrice ?? null };
    };
    const mode: RingSizeMode =
      options?.showRingSizes === true ? 'on' : options?.showRingSizes === false ? 'off' : 'auto';
    this.form.controls.options.reset({
      colorYellow: colors.includes('yellow'),
      colorWhite: colors.includes('white'),
      colorRose: colors.includes('rose'),
      defaultMetalColor: options?.defaultMetalColor ?? '',
      karat10: karat('10K'),
      karat14: karat('14K'),
      karat18: karat('18K'),
      defaultKarat: options?.defaultKarat ?? '',
      ringSizeMode: mode,
      ringSizes: (options?.ringSizes?.length ? options.ringSizes : DEFAULT_RING_SIZES).join(', '),
      allowCustomization: options?.allowCustomization !== false
    });
  }

  /** Builds the `options` payload; returns an error message when something is incomplete. */
  private buildOptions(): { options: ProductOptions; error?: string } {
    const o = this.form.controls.options.getRawValue();
    const colors = this.checkedColors();
    const karatPrices: KaratPrice[] = this.enabledKarats().map(k => {
      const row = this.karatControl(k).getRawValue();
      return { karat: k, price: row.price, compareAtPrice: row.compareAtPrice };
    });
    const sizes = o.ringSizes
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const missingPrice = karatPrices.find(k => k.price == null);
    const options: ProductOptions = {
      metalColors: colors,
      defaultMetalColor: colors.includes(o.defaultMetalColor as MetalColor)
        ? (o.defaultMetalColor as MetalColor)
        : colors[0] ?? null,
      karatPrices,
      defaultKarat: karatPrices.some(k => k.karat === o.defaultKarat)
        ? (o.defaultKarat as Karat)
        : karatPrices[0]?.karat ?? null,
      showRingSizes: o.ringSizeMode === 'on' ? true : o.ringSizeMode === 'off' ? false : null,
      ringSizes: sizes.length ? sizes : DEFAULT_RING_SIZES,
      allowCustomization: o.allowCustomization
    };
    return {
      options,
      error: missingPrice ? `Enter a price for ${missingPrice.karat}, or untick it.` : undefined
    };
  }

  /** Price of the default karat — shown on product cards and used as the main price. */
  defaultKaratPrice(): number | null {
    const { options } = this.buildOptions();
    return options.karatPrices?.find(k => k.karat === options.defaultKarat)?.price ?? null;
  }

  specGroup(spec: Partial<ProductSpec> = {}) {
    return this.fb.nonNullable.group({
      key: [spec.key ?? ''],
      label: [spec.label ?? ''],
      value: [spec.value ?? ''],
      group: [(spec.group ?? 'general') as SpecGroup]
    });
  }

  addSpec(): void {
    this.specs.push(this.specGroup());
  }

  applyPreset(key: string): void {
    this.specs.clear();
    (PRESETS[key] ?? []).forEach(spec => this.specs.push(this.specGroup(spec)));
  }

  cancel(): void {
    this.cancelled.emit();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const built = this.buildOptions();
    if (built.error) {
      this.toast.error(built.error);
      return;
    }
    const options = built.options;
    // With karat prices, the main price is the default karat's price (used on product cards).
    const defaultKarat = options.karatPrices?.find(k => k.karat === options.defaultKarat);
    const price = defaultKarat ? defaultKarat.price : v.price;
    const compareAtPrice = defaultKarat ? (defaultKarat.compareAtPrice ?? v.compareAtPrice) : v.compareAtPrice;
    // Photos tagged with a color that was unticked become shared photos again.
    const colors = options.metalColors ?? [];
    const images = this.images().map(i =>
      i.metalColor && !colors.includes(i.metalColor) ? { ...i, metalColor: null } : i);
    const payload = {
      sku: v.sku,
      name: v.name,
      slug: v.slug || undefined,
      description: v.description || undefined,
      categoryId: v.categoryId,
      subcategoryId: v.subcategoryId || null,
      designerId: v.designerId || null,
      brandName: v.brandName.trim() || null,
      price,
      compareAtPrice,
      showPrice: v.showPrice,
      status: v.status as 'active' | 'inactive' | 'archived',
      availability: v.availability as 'in_stock' | 'made_to_order' | 'sold',
      specs: v.specs.filter(s => s.label && s.value),
      tags: v.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured: v.featured,
      newArrival: v.newArrival,
      bestSeller: v.bestSeller,
      images: images.map(toMediaWrite),
      videos: this.videos().map(toMediaWrite),
      options
    };
    this.saving.set(true);
    const id = this.productId();
    const req = id ? this.admin.update(id, payload) : this.admin.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Product saved');
        this.saved.emit();
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Unable to save product.');
      }
    });
  }
}
