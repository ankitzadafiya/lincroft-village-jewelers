import { Component, OnChanges, OnInit, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, Designer, ProductMedia, ProductSpec, SpecGroup, toMediaWrite } from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { DesignerService } from '../../../../core/services/designer.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MediaUploaderComponent } from '../../../../shared/components/media-uploader/media-uploader.component';

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

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, MediaUploaderComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly designersApi = inject(DesignerService);
  private readonly toast = inject(ToastService);

  /** When set, loads that product for edit. Null/empty = create. */
  readonly productId = input<string | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly categories = signal<Category[]>([]);
  readonly designers = signal<Designer[]>([]);
  readonly images = signal<ProductMedia[]>([]);
  readonly videos = signal<ProductMedia[]>([]);
  readonly saving = signal(false);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    categoryId: ['', Validators.required],
    subcategoryId: [''],
    designerId: [''],
    price: [null as number | null],
    compareAtPrice: [null as number | null],
    showPrice: [true],
    status: ['active'],
    availability: ['in_stock'],
    featured: [false],
    newArrival: [false],
    bestSeller: [false],
    tags: [''],
    specs: this.fb.array<ReturnType<ProductFormComponent['specGroup']>>([])
  });

  get specs(): FormArray {
    return this.form.controls.specs;
  }

  get id(): string | null {
    return this.productId();
  }

  parents(): Category[] {
    return this.categories().filter(c => !c.parentId);
  }

  children(): Category[] {
    return this.categories().filter(c => c.parentId === this.form.controls.categoryId.value);
  }

  ngOnInit(): void {
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
    this.specs.clear();
    this.images.set([]);
    this.videos.set([]);
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
    const payload = {
      sku: v.sku,
      name: v.name,
      slug: v.slug || undefined,
      description: v.description || undefined,
      categoryId: v.categoryId,
      subcategoryId: v.subcategoryId || null,
      designerId: v.designerId || null,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      showPrice: v.showPrice,
      status: v.status as 'active' | 'inactive' | 'archived',
      availability: v.availability as 'in_stock' | 'made_to_order' | 'sold',
      specs: v.specs.filter(s => s.label && s.value),
      tags: v.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured: v.featured,
      newArrival: v.newArrival,
      bestSeller: v.bestSeller,
      images: this.images().map(toMediaWrite),
      videos: this.videos().map(toMediaWrite)
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
