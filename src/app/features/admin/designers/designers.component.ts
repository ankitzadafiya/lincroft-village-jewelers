import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Designer } from '../../../core/models';
import { DesignerService } from '../../../core/services/designer.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

@Component({
  selector: 'app-admin-designers',
  imports: [ReactiveFormsModule, AppIconComponent],
  template: `
    <div class="admin-page">
      <h1>Designers</h1>
      <form #formPanel class="editor" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-head">
          <p class="eyebrow">{{ editingId ? 'Editing designer' : 'New designer' }}</p>
          @if (editingId) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancelEdit()">Cancel edit</button>
          }
        </div>
        <div class="form-grid">
          <div class="field"><label>Name</label><input formControlName="name" /></div>
          <div class="field"><label>Slug</label><input formControlName="slug" placeholder="optional" /></div>
          <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
          <div class="field full"><label>Description</label><textarea formControlName="description"></textarea></div>
          <div class="field full"><label>Image URL</label><input formControlName="imageUrl" /></div>
          <div class="field full checks">
            <label class="check"><input type="checkbox" formControlName="active" /> Active</label>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn" type="submit">{{ editingId ? 'Update' : 'Create' }} designer</button>
        </div>
      </form>
      <table>
        <tr><th>Name</th><th>Status</th><th></th></tr>
        @for (designer of designers(); track designer.id) {
          <tr [class.editing]="editingId === designer.id">
            <td>{{ designer.name }}</td>
            <td>{{ designer.active ? 'Active' : 'Hidden' }}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="icon-btn" (click)="edit(designer)" aria-label="Edit">
                  <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                  <span class="label">Edit</span>
                </button>
                <button type="button" class="icon-btn danger" (click)="remove(designer)" aria-label="Delete">
                  <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                  <span class="label">Delete</span>
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
export class AdminDesignersComponent implements OnInit {
  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>;

  private readonly api = inject(DesignerService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly designers = signal<Designer[]>([]);
  editingId: string | null = null;
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    imageUrl: [''],
    sortOrder: [0],
    active: [true]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.adminList().subscribe(list => this.designers.set(list));
  }

  edit(designer: Designer): void {
    this.editingId = designer.id;
    this.form.patchValue({
      name: designer.name,
      slug: designer.slug,
      description: designer.description ?? '',
      imageUrl: designer.imageUrl ?? '',
      sortOrder: 0,
      active: designer.active
    });
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
      sortOrder: v.sortOrder,
      active: v.active
    };
    const req = this.editingId ? this.api.update(this.editingId, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.toast.success('Designer saved');
        this.editingId = null;
        this.resetForm();
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save designer.')
    });
  }

  remove(designer: Designer): void {
    this.api.remove(designer.id).subscribe({
      next: () => {
        this.toast.success('Designer removed');
        if (this.editingId === designer.id) {
          this.editingId = null;
          this.resetForm();
        }
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete designer.')
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      sortOrder: 0,
      active: true
    });
  }

  private scrollToForm(): void {
    queueMicrotask(() => {
      const stage = document.querySelector('.stage') as HTMLElement | null;
      if (stage && this.formPanel) {
        const top = this.formPanel.nativeElement.offsetTop - 12;
        stage.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else {
        this.formPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}
