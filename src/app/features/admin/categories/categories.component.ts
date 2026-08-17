import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, AppIconComponent],
  template: `
    <div class="admin-page">
      <h1>Categories</h1>
      <form #formPanel class="editor" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-head">
          <p class="eyebrow">{{ editingId ? 'Editing category' : 'New category' }}</p>
          @if (editingId) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancelEdit()">Cancel edit</button>
          }
        </div>
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
          <div class="field full checks">
            <label class="check"><input type="checkbox" formControlName="active" /> Active</label>
            <label class="check"><input type="checkbox" formControlName="megaMenu" /> Mega menu</label>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn" type="submit">{{ editingId ? 'Update' : 'Create' }} category</button>
        </div>
      </form>
      <table>
        <tr><th>Name</th><th>Parent</th><th>Status</th><th></th></tr>
        @for (cat of categories(); track cat.id) {
          <tr [class.editing]="editingId === cat.id">
            <td>{{ cat.name }}</td>
            <td>{{ parentName(cat.parentId) }}</td>
            <td>{{ cat.active ? 'Active' : 'Hidden' }}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="icon-btn icon-tip" data-tip="Edit" (click)="edit(cat)" aria-label="Edit">
                  <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                </button>
                <button type="button" class="icon-btn icon-tip danger" data-tip="Delete" (click)="remove(cat)" aria-label="Delete">
                  <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                </button>
              </div>
            </td>
          </tr>
        }
      </table>
    </div>
  `,
  styles: [`
    .editor {
      background: #fff;
      border: 1px solid var(--lvj-line);
      border-radius: var(--lvj-radius);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .form-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    table { width: 100%; margin-top: 0.5rem; border-collapse: collapse; background: #fff; border-radius: var(--lvj-radius); overflow: hidden; }
    th, td { text-align: left; padding: 0.85rem 0.7rem; border-bottom: 1px solid var(--lvj-line); }
    tr.editing { background: rgba(183, 160, 142, 0.12); }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>;

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
    return this.categories().filter(c => !c.parentId && c.id !== this.editingId);
  }

  parentName(id?: string | null): string {
    return id ? this.categories().find(c => c.id === id)?.name ?? '' : '—';
  }

  edit(cat: Category): void {
    this.editingId = cat.id;
    this.form.patchValue({ ...cat, parentId: cat.parentId ?? '' });
    this.scrollToForm();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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
        this.resetForm();
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save category.')
    });
  }

  remove(cat: Category): void {
    this.api.remove(cat.id).subscribe({
      next: () => {
        this.toast.success('Category removed');
        if (this.editingId === cat.id) {
          this.editingId = null;
          this.resetForm();
        }
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete category.')
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: '',
      sortOrder: 0,
      active: true,
      megaMenu: false
    });
  }

  private scrollToForm(): void {
    queueMicrotask(() => {
      this.formPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const stage = document.querySelector('.stage') as HTMLElement | null;
      if (stage && this.formPanel) {
        const top = this.formPanel.nativeElement.offsetTop - 12;
        stage.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });
  }
}
