import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeContent, InstagramPost, ServiceOffering, Testimonial } from '../../../core/models';
import { ContentService } from '../../../core/services/content.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

type ContentTab = 'home' | 'testimonials' | 'services' | 'instagram';

@Component({
  selector: 'app-admin-content',
  imports: [ReactiveFormsModule, AppIconComponent],
  template: `
    <div class="admin-page">
      <h1>Content</h1>
      <nav class="tabs">
        <button type="button" [class.on]="tab() === 'home'" (click)="tab.set('home')">Home</button>
        <button type="button" [class.on]="tab() === 'testimonials'" (click)="tab.set('testimonials')">Testimonials</button>
        <button type="button" [class.on]="tab() === 'services'" (click)="tab.set('services')">Services</button>
        <button type="button" [class.on]="tab() === 'instagram'" (click)="tab.set('instagram')">Instagram</button>
      </nav>

      @if (tab() === 'home') {
        <form [formGroup]="homeForm" (ngSubmit)="saveHome()">
          <div class="form-grid">
            <div class="field"><label>Hero eyebrow</label><input formControlName="heroEyebrow" /></div>
            <div class="field full"><label>Hero title</label><input formControlName="heroTitle" /></div>
            <div class="field full"><label>Hero subtitle</label><textarea formControlName="heroSubtitle"></textarea></div>
            <div class="field full"><label>Hero image URL</label><input formControlName="heroImage" /></div>
            <div class="field full"><label>About excerpt</label><textarea formControlName="aboutExcerpt"></textarea></div>
          </div>
          <button class="btn" type="submit">Save home content</button>
        </form>
      }

      @if (tab() === 'testimonials') {
        <form [formGroup]="testimonialForm" (ngSubmit)="saveTestimonial()">
          <div class="form-grid">
            <div class="field"><label>Name</label><input formControlName="name" /></div>
            <div class="field"><label>Location</label><input formControlName="location" /></div>
            <div class="field"><label>Rating</label><input type="number" min="1" max="5" formControlName="rating" /></div>
            <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
            <div class="field full"><label>Quote</label><textarea formControlName="quote"></textarea></div>
            <div class="field full checks">
              <label class="check"><input type="checkbox" formControlName="active" /> Active</label>
            </div>
          </div>
          <button class="btn" type="submit">{{ testimonialId ? 'Update' : 'Create' }} testimonial</button>
        </form>
        <table>
          <tr><th>Name</th><th>Rating</th><th>Status</th><th></th></tr>
          @for (row of testimonials(); track row.id) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.rating }}</td>
              <td>{{ row.active ? 'Active' : 'Hidden' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="icon-btn" (click)="editTestimonial(row)" aria-label="Edit">
                    <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Edit</span>
                  </button>
                  <button type="button" class="icon-btn danger" (click)="removeTestimonial(row)" aria-label="Delete">
                    <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </table>
      }

      @if (tab() === 'services') {
        <form [formGroup]="serviceForm" (ngSubmit)="saveService()">
          <div class="form-grid">
            <div class="field"><label>Title</label><input formControlName="title" /></div>
            <div class="field"><label>Slug</label><input formControlName="slug" placeholder="optional" /></div>
            <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
            <div class="field full"><label>Summary</label><input formControlName="summary" /></div>
            <div class="field full"><label>Description</label><textarea formControlName="description"></textarea></div>
            <div class="field full"><label>Image URL</label><input formControlName="imageUrl" /></div>
            <div class="field full checks">
              <label class="check"><input type="checkbox" formControlName="active" /> Active</label>
            </div>
          </div>
          <button class="btn" type="submit">{{ serviceId ? 'Update' : 'Create' }} service</button>
        </form>
        <table>
          <tr><th>Title</th><th>Slug</th><th>Status</th><th></th></tr>
          @for (row of services(); track row.id) {
            <tr>
              <td>{{ row.title }}</td>
              <td>{{ row.slug }}</td>
              <td>{{ row.active ? 'Active' : 'Hidden' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="icon-btn" (click)="editService(row)" aria-label="Edit">
                    <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Edit</span>
                  </button>
                  <button type="button" class="icon-btn danger" (click)="removeService(row)" aria-label="Delete">
                    <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </table>
      }

      @if (tab() === 'instagram') {
        <form [formGroup]="instagramForm" (ngSubmit)="saveInstagram()">
          <div class="form-grid">
            <div class="field full"><label>Image URL</label><input formControlName="imageUrl" /></div>
            <div class="field"><label>Alt</label><input formControlName="alt" /></div>
            <div class="field"><label>Link</label><input formControlName="href" /></div>
            <div class="field"><label>Sort</label><input type="number" formControlName="sortOrder" /></div>
            <div class="field full checks">
              <label class="check"><input type="checkbox" formControlName="active" /> Active</label>
            </div>
          </div>
          <button class="btn" type="submit">{{ instagramId ? 'Update' : 'Create' }} post</button>
        </form>
        <table>
          <tr><th>Image</th><th>Alt</th><th>Status</th><th></th></tr>
          @for (row of instagram(); track row.id) {
            <tr>
              <td>{{ row.imageUrl }}</td>
              <td>{{ row.alt }}</td>
              <td>{{ row.active ? 'Active' : 'Hidden' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="icon-btn" (click)="editInstagram(row)" aria-label="Edit">
                    <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Edit</span>
                  </button>
                  <button type="button" class="icon-btn danger" (click)="removeInstagram(row)" aria-label="Delete">
                    <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                    <span class="label">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </table>
      }
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0 0 1.2rem; }
    .tabs button { background: none; border: 1px solid var(--lvj-line); padding: 0.4rem 0.8rem; cursor: pointer; }
    .tabs button.on { border-color: var(--lvj-gold-deep); color: var(--lvj-gold-deep); }
    table { width: 100%; margin-top: 2rem; border-collapse: collapse; background: #fff; border-radius: var(--lvj-radius); overflow: hidden; }
    th, td { text-align: left; padding: 0.85rem 0.7rem; border-bottom: 1px solid var(--lvj-line); }
  `]
})
export class AdminContentComponent implements OnInit {
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly tab = signal<ContentTab>('home');
  readonly testimonials = signal<Testimonial[]>([]);
  readonly services = signal<ServiceOffering[]>([]);
  readonly instagram = signal<InstagramPost[]>([]);
  testimonialId: string | null = null;
  serviceId: string | null = null;
  instagramId: string | null = null;

  readonly homeForm = this.fb.nonNullable.group({
    heroEyebrow: [''],
    heroTitle: [''],
    heroSubtitle: [''],
    heroImage: [''],
    aboutExcerpt: ['']
  });

  readonly testimonialForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    location: [''],
    quote: ['', Validators.required],
    rating: [5, Validators.required],
    active: [true],
    sortOrder: [0]
  });

  readonly serviceForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: [''],
    summary: [''],
    description: [''],
    imageUrl: [''],
    active: [true],
    sortOrder: [0]
  });

  readonly instagramForm = this.fb.nonNullable.group({
    imageUrl: ['', Validators.required],
    alt: [''],
    href: [''],
    active: [true],
    sortOrder: [0]
  });

  ngOnInit(): void {
    this.content.home().subscribe(home => this.patchHome(home));
    this.reloadLists();
  }

  private patchHome(home: HomeContent): void {
    this.homeForm.patchValue({
      heroEyebrow: home.heroEyebrow ?? '',
      heroTitle: home.heroTitle ?? '',
      heroSubtitle: home.heroSubtitle ?? '',
      heroImage: home.heroImage ?? '',
      aboutExcerpt: home.aboutExcerpt ?? ''
    });
  }

  private reloadLists(): void {
    this.content.adminTestimonials().subscribe(list => this.testimonials.set(list));
    this.content.adminServices().subscribe(list => this.services.set(list));
    this.content.adminInstagram().subscribe(list => this.instagram.set(list));
  }

  saveHome(): void {
    const v = this.homeForm.getRawValue();
    this.content.updateHome({
      heroEyebrow: v.heroEyebrow || undefined,
      heroTitle: v.heroTitle || undefined,
      heroSubtitle: v.heroSubtitle || undefined,
      heroImage: v.heroImage || undefined,
      aboutExcerpt: v.aboutExcerpt || undefined
    }).subscribe({
      next: home => {
        this.patchHome(home);
        this.toast.success('Home content saved');
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save home content.')
    });
  }

  editTestimonial(row: Testimonial): void {
    this.testimonialId = row.id;
    this.testimonialForm.patchValue(row);
  }

  saveTestimonial(): void {
    const v = this.testimonialForm.getRawValue();
    const payload = {
      name: v.name,
      location: v.location || undefined,
      quote: v.quote,
      rating: v.rating,
      active: v.active,
      sortOrder: v.sortOrder
    };
    const req = this.testimonialId
      ? this.content.updateTestimonial(this.testimonialId, payload)
      : this.content.createTestimonial(payload);
    req.subscribe({
      next: () => {
        this.toast.success('Testimonial saved');
        this.testimonialId = null;
        this.testimonialForm.reset({ rating: 5, active: true, sortOrder: 0, name: '', location: '', quote: '' });
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save testimonial.')
    });
  }

  removeTestimonial(row: Testimonial): void {
    this.content.deleteTestimonial(row.id).subscribe({
      next: () => {
        this.toast.success('Testimonial removed');
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete.')
    });
  }

  editService(row: ServiceOffering): void {
    this.serviceId = row.id;
    this.serviceForm.patchValue({
      title: row.title,
      slug: row.slug,
      summary: row.summary ?? '',
      description: row.description ?? '',
      imageUrl: row.imageUrl ?? '',
      active: row.active,
      sortOrder: row.sortOrder
    });
  }

  saveService(): void {
    const v = this.serviceForm.getRawValue();
    const payload = {
      title: v.title,
      slug: v.slug || undefined,
      summary: v.summary || undefined,
      description: v.description || undefined,
      imageUrl: v.imageUrl || undefined,
      active: v.active,
      sortOrder: v.sortOrder
    };
    const req = this.serviceId
      ? this.content.updateService(this.serviceId, payload)
      : this.content.createService(payload);
    req.subscribe({
      next: () => {
        this.toast.success('Service saved');
        this.serviceId = null;
        this.serviceForm.reset({ active: true, sortOrder: 0, title: '', slug: '', summary: '', description: '', imageUrl: '' });
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save service.')
    });
  }

  removeService(row: ServiceOffering): void {
    this.content.deleteService(row.id).subscribe({
      next: () => {
        this.toast.success('Service removed');
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete.')
    });
  }

  editInstagram(row: InstagramPost): void {
    this.instagramId = row.id;
    this.instagramForm.patchValue({
      imageUrl: row.imageUrl,
      alt: row.alt ?? '',
      href: row.href ?? '',
      active: row.active,
      sortOrder: row.sortOrder
    });
  }

  saveInstagram(): void {
    const v = this.instagramForm.getRawValue();
    const payload = {
      imageUrl: v.imageUrl,
      alt: v.alt || undefined,
      href: v.href || undefined,
      active: v.active,
      sortOrder: v.sortOrder
    };
    const req = this.instagramId
      ? this.content.updateInstagram(this.instagramId, payload)
      : this.content.createInstagram(payload);
    req.subscribe({
      next: () => {
        this.toast.success('Instagram post saved');
        this.instagramId = null;
        this.instagramForm.reset({ active: true, sortOrder: 0, imageUrl: '', alt: '', href: '' });
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to save post.')
    });
  }

  removeInstagram(row: InstagramPost): void {
    this.content.deleteInstagram(row.id).subscribe({
      next: () => {
        this.toast.success('Post removed');
        this.reloadLists();
      },
      error: err => this.toast.error(err.error?.message || 'Unable to delete.')
    });
  }
}
