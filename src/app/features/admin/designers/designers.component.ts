import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Designer } from '../../../core/models';
import { DesignerService } from '../../../core/services/designer.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-designers',
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <h1>Designers</h1>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field"><label>Name</label><input formControlName="name" /></div>
          <div class="field"><label>Slug</label><input formControlName="slug" placeholder="optional" /></div>
          <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
          <div class="field full"><label>Description</label><textarea formControlName="description"></textarea></div>
          <div class="field full"><label>Image URL</label><input formControlName="imageUrl" /></div>
          <div class="field"><label><input type="checkbox" formControlName="active" /> Active</label></div>
        </div>
        <button class="btn" type="submit">{{ editingId ? 'Update' : 'Create' }} designer</button>
      </form>
      <table>
        <tr><th>Name</th><th>Status</th><th></th></tr>
        @for (designer of designers(); track designer.id) {
          <tr>
            <td>{{ designer.name }}</td>
            <td>{{ designer.active ? 'Active' : 'Hidden' }}</td>
            <td>
              <button type="button" (click)="edit(designer)">Edit</button>
              <button type="button" (click)="remove(designer)">Delete</button>
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
export class AdminDesignersComponent implements OnInit {
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
  }

  save(): void {
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
        this.form.reset({ active: true, sortOrder: 0, slug: '', description: '', imageUrl: '' });
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save designer.')
    });
  }

  remove(designer: Designer): void {
    this.api.remove(designer.id).subscribe({
      next: () => {
        this.toast.success('Designer removed');
        this.load();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete designer.')
    });
  }
}
