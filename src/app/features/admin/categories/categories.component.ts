import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <h1>Categories</h1>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field"><label>Name</label><input formControlName="name" /></div>
          <div class="field"><label>Slug</label><input formControlName="slug" /></div>
          <div class="field">
            <label>Parent</label>
            <select formControlName="parentId">
              <option value="">Top level</option>
              @for (cat of parents(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
          <div class="field full"><label>Description</label><textarea formControlName="description"></textarea></div>
          <div class="field full"><label>Image URL</label><input formControlName="imageUrl" /></div>
          <div class="field"><label><input type="checkbox" formControlName="active" /> Active</label></div>
          <div class="field"><label><input type="checkbox" formControlName="megaMenu" /> Mega menu</label></div>
        </div>
        <button class="btn" type="submit">{{ editingId ? 'Update' : 'Create' }} category</button>
      </form>
      <table>
        <tr><th>Name</th><th>Parent</th><th>Status</th><th></th></tr>
        @for (cat of categories(); track cat.id) {
          <tr>
            <td>{{ cat.name }}</td>
            <td>{{ parentName(cat.parentId) }}</td>
            <td>{{ cat.active ? 'Active' : 'Hidden' }}</td>
            <td>
              <button type="button" (click)="edit(cat)">Edit</button>
              <button type="button" (click)="remove(cat)">Delete</button>
            </td>
          </tr>
        }
      </table>
    </div>
  `,
  styles: [`
    h1 { font-style: italic; }
    table { width: 100%; margin-top: 2rem; border-collapse: collapse; background: #fff; }
    th, td { text-align: left; padding: 0.7rem; border-bottom: 1px solid var(--lvj-line); }
    td button { margin-right: 0.5rem; background: none; border: 0; color: var(--lvj-gold-deep); cursor: pointer; }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private readonly api = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly categories = signal<Category[]>([]);
  editingId: string | null = null;
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    imageUrl: [''],
    parentId: [''],
    sortOrder: [0],
    active: [true],
    megaMenu: [false]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.adminList().subscribe(list => this.categories.set(list));
  }

  parents(): Category[] {
    return this.categories().filter(c => !c.parentId);
  }

  parentName(id?: string | null): string {
    return id ? this.categories().find(c => c.id === id)?.name ?? '' : '—';
  }

  edit(cat: Category): void {
    this.editingId = cat.id;
    this.form.patchValue({ ...cat, parentId: cat.parentId ?? '' });
  }

  save(): void {
    const v = this.form.getRawValue();
    const payload = {
      name: v.name,
      slug: v.slug || undefined,
      description: v.description || undefined,
      imageUrl: v.imageUrl || undefined,
      parentId: v.parentId || null,
      sortOrder: v.sortOrder,
      active: v.active,
      megaMenu: v.megaMenu
    };
    const req = this.editingId ? this.api.update(this.editingId, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.toast.success('Category saved');
        this.editingId = null;
        this.form.reset({ active: true, megaMenu: false, sortOrder: 0, parentId: '' });
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save category.')
    });
  }

  remove(cat: Category): void {
    this.api.remove(cat.id).subscribe({
      next: () => {
        this.toast.success('Category removed');
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete category.')
    });
  }
}
