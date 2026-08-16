import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  ContactMessageRecord,
  CustomJewelryRecord,
  InquiryRecord,
  InquiryStatus,
  NewsletterSubscriber
} from '../../../core/models';
import { AdminInboxService } from '../../../core/services/admin-inbox.service';
import { InquiryService } from '../../../core/services/inquiry.service';
import { ToastService } from '../../../core/services/toast.service';

type LeadTab = 'inquiries' | 'custom' | 'contact' | 'newsletter';

@Component({
  selector: 'app-admin-inquiries',
  imports: [DatePipe],
  template: `
    <div class="admin-page">
      <h1>Leads</h1>
      <nav class="tabs">
        <button type="button" [class.on]="tab() === 'inquiries'" (click)="tab.set('inquiries')">Inquiries</button>
        <button type="button" [class.on]="tab() === 'custom'" (click)="tab.set('custom')">Custom jewelry</button>
        <button type="button" [class.on]="tab() === 'contact'" (click)="tab.set('contact')">Contact</button>
        <button type="button" [class.on]="tab() === 'newsletter'" (click)="tab.set('newsletter')">Newsletter</button>
      </nav>

      @if (tab() === 'inquiries') {
        @for (item of inquiries(); track item.id) {
          <article>
            <header>
              <strong>{{ item.name }}</strong>
              <span>{{ item.createdAt | date:'medium' }}</span>
            </header>
            <p>{{ item.email }} · {{ item.phone }}</p>
            @if (item.message) { <p>{{ item.message }}</p> }
            <ul>
              @for (product of item.items; track product.sku) {
                <li>{{ product.name }} ({{ product.sku }})</li>
              }
            </ul>
            <div class="status">
              @for (status of statuses; track status) {
                <button type="button" [class.on]="item.status === status" (click)="setInquiryStatus(item, status)">{{ status }}</button>
              }
            </div>
          </article>
        }
      }

      @if (tab() === 'custom') {
        @for (item of custom(); track item.id) {
          <article>
            <header>
              <strong>{{ item.name }}</strong>
              <span>{{ item.createdAt | date:'medium' }}</span>
            </header>
            <p>{{ item.email }} · {{ item.phone }}</p>
            <p>{{ item.jewelryType }}@if (item.preferredMetal) { · {{ item.preferredMetal }} }</p>
            @if (item.description) { <p>{{ item.description }}</p> }
            @if (item.referenceImages.length) {
              <ul>
                @for (ref of item.referenceImages; track ref.url) {
                  <li><a [href]="ref.url" target="_blank" rel="noreferrer">{{ ref.url }}</a> ({{ ref.downloadStatus }})</li>
                }
              </ul>
            }
            <div class="status">
              @for (status of statuses; track status) {
                <button type="button" [class.on]="item.status === status" (click)="setCustomStatus(item, status)">{{ status }}</button>
              }
            </div>
          </article>
        }
      }

      @if (tab() === 'contact') {
        @for (item of contacts(); track item.id) {
          <article>
            <header>
              <strong>{{ item.name }}</strong>
              <span>{{ item.createdAt | date:'medium' }}</span>
            </header>
            <p>{{ item.email }}@if (item.phone) { · {{ item.phone }} }</p>
            <p>{{ item.subject }}</p>
            <p>{{ item.message }}</p>
            <div class="status">
              @for (status of statuses; track status) {
                <button type="button" [class.on]="item.status === status" (click)="setContactStatus(item, status)">{{ status }}</button>
              }
            </div>
          </article>
        }
      }

      @if (tab() === 'newsletter') {
        @for (item of subscribers(); track item.id) {
          <article>
            <header>
              <strong>{{ item.email }}</strong>
              <span>{{ item.createdAt | date:'medium' }}</span>
            </header>
            <p>{{ item.active ? 'Active' : 'Unsubscribed' }}@if (item.unsubscribedAt) { · {{ item.unsubscribedAt | date:'medium' }} }</p>
            <div class="status">
              <button type="button" [class.on]="item.active" (click)="setSubscriber(item, true)">Active</button>
              <button type="button" [class.on]="!item.active" (click)="setSubscriber(item, false)">Unsubscribed</button>
            </div>
          </article>
        }
      }
    </div>
  `,
  styles: [`
    h1 { font-style: italic; }
    .tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0 0 1.2rem; }
    .tabs button {
      background: none;
      border: 1px solid var(--lvj-line);
      padding: 0.4rem 0.8rem;
      cursor: pointer;
    }
    .tabs button.on { border-color: var(--lvj-gold-deep); color: var(--lvj-gold-deep); }
    article { background: #fff; padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--lvj-line); }
    header { display: flex; justify-content: space-between; gap: 1rem; }
    p, li { color: var(--lvj-muted); }
    .status { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-top: 0.8rem; }
    .status button {
      background: none;
      border: 1px solid var(--lvj-line);
      padding: 0.25rem 0.6rem;
      cursor: pointer;
      text-transform: capitalize;
    }
    .status button.on { border-color: var(--lvj-gold-deep); color: var(--lvj-gold-deep); }
  `]
})
export class AdminInquiriesComponent implements OnInit {
  private readonly inquiry = inject(InquiryService);
  private readonly inbox = inject(AdminInboxService);
  private readonly toast = inject(ToastService);
  readonly tab = signal<LeadTab>('inquiries');
  readonly inquiries = signal<InquiryRecord[]>([]);
  readonly custom = signal<CustomJewelryRecord[]>([]);
  readonly contacts = signal<ContactMessageRecord[]>([]);
  readonly subscribers = signal<NewsletterSubscriber[]>([]);
  readonly statuses: InquiryStatus[] = ['new', 'reviewed', 'closed'];

  ngOnInit(): void {
    this.inquiry.adminList().subscribe(list => this.inquiries.set(list));
    this.inbox.customJewelry().subscribe(list => this.custom.set(list));
    this.inbox.contact().subscribe(list => this.contacts.set(list));
    this.inbox.newsletter().subscribe(list => this.subscribers.set(list));
  }

  setInquiryStatus(item: InquiryRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inquiry.setStatus(item.id, status).subscribe({
      next: updated => this.inquiries.update(list => list.map(row => row.id === updated.id ? updated : row)),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setCustomStatus(item: CustomJewelryRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inbox.setCustomJewelryStatus(item.id, status).subscribe({
      next: updated => this.custom.update(list => list.map(row => row.id === updated.id ? updated : row)),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setContactStatus(item: ContactMessageRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inbox.setContactStatus(item.id, status).subscribe({
      next: updated => this.contacts.update(list => list.map(row => row.id === updated.id ? updated : row)),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setSubscriber(item: NewsletterSubscriber, active: boolean): void {
    if (item.active === active) return;
    this.inbox.setNewsletterActive(item.id, active).subscribe({
      next: updated => this.subscribers.update(list => list.map(row => row.id === updated.id ? updated : row)),
      error: err => this.toast.error(err.error?.message || 'Unable to update subscriber.')
    });
  }
}
