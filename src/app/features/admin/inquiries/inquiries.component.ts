import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
    <div class="admin-page leads">
      <div class="intro">
        <div>
          <p class="eyebrow">Inbox</p>
          <h1>Leads</h1>
          <p class="lede">Inquiries, custom requests, contact messages, and newsletter signups.</p>
        </div>
        <span class="count-pill">{{ activeCount() }} {{ activeCount() === 1 ? 'item' : 'items' }}</span>
      </div>

      <nav class="tabs" role="tablist" aria-label="Lead types">
        @for (item of tabItems; track item.id) {
          <button
            type="button"
            role="tab"
            [class.on]="tab() === item.id"
            [attr.aria-selected]="tab() === item.id"
            (click)="tab.set(item.id)">
            {{ item.label }}
            <em>{{ countFor(item.id) }}</em>
          </button>
        }
      </nav>

      @if (tab() === 'inquiries') {
        @if (!inquiries().length) {
          <p class="empty">No product inquiries yet.</p>
        }
        <div class="cards">
          @for (item of inquiries(); track item.id) {
            <article class="card" [attr.data-status]="item.status">
              <header>
                <div class="who">
                  <strong>{{ item.name }}</strong>
                  <span class="badge" [attr.data-status]="item.status">{{ item.status }}</span>
                </div>
                <time>{{ item.createdAt | date: 'medium' }}</time>
              </header>
              <p class="meta">{{ item.email }}@if (item.phone) { · {{ item.phone }} }</p>
              @if (item.message) {
                <p class="body">{{ item.message }}</p>
              }
              @if (item.items.length) {
                <ul class="chips">
                  @for (product of item.items; track product.sku) {
                    <li>{{ product.name }} <span>{{ product.sku }}</span></li>
                  }
                </ul>
              }
              <div class="foot">
                <span class="foot-label">Status</span>
                <div class="status-seg" role="group" aria-label="Inquiry status">
                  @for (status of statuses; track status) {
                    <button
                      type="button"
                      [class.on]="item.status === status"
                      [attr.data-status]="status"
                      (click)="setInquiryStatus(item, status)">
                      {{ status }}
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (tab() === 'custom') {
        @if (!custom().length) {
          <p class="empty">No custom jewelry requests yet.</p>
        }
        <div class="cards">
          @for (item of custom(); track item.id) {
            <article class="card" [attr.data-status]="item.status">
              <header>
                <div class="who">
                  <strong>{{ item.name }}</strong>
                  <span class="badge" [attr.data-status]="item.status">{{ item.status }}</span>
                </div>
                <time>{{ item.createdAt | date: 'medium' }}</time>
              </header>
              <p class="meta">{{ item.email }}@if (item.phone) { · {{ item.phone }} }</p>
              <p class="meta accent">{{ item.jewelryType }}@if (item.preferredMetal) { · {{ item.preferredMetal }} }</p>
              @if (item.description) {
                <p class="body">{{ item.description }}</p>
              }
              @if (item.referenceImages.length) {
                <ul class="refs">
                  @for (ref of item.referenceImages; track ref.url) {
                    <li>
                      <a [href]="ref.url" target="_blank" rel="noreferrer">Reference image</a>
                      <span>{{ ref.downloadStatus }}</span>
                    </li>
                  }
                </ul>
              }
              <div class="foot">
                <span class="foot-label">Status</span>
                <div class="status-seg" role="group" aria-label="Request status">
                  @for (status of statuses; track status) {
                    <button
                      type="button"
                      [class.on]="item.status === status"
                      [attr.data-status]="status"
                      (click)="setCustomStatus(item, status)">
                      {{ status }}
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (tab() === 'contact') {
        @if (!contacts().length) {
          <p class="empty">No contact messages yet.</p>
        }
        <div class="cards">
          @for (item of contacts(); track item.id) {
            <article class="card" [attr.data-status]="item.status">
              <header>
                <div class="who">
                  <strong>{{ item.name }}</strong>
                  <span class="badge" [attr.data-status]="item.status">{{ item.status }}</span>
                </div>
                <time>{{ item.createdAt | date: 'medium' }}</time>
              </header>
              <p class="meta">{{ item.email }}@if (item.phone) { · {{ item.phone }} }</p>
              <p class="meta accent">{{ item.subject }}</p>
              <p class="body">{{ item.message }}</p>
              <div class="foot">
                <span class="foot-label">Status</span>
                <div class="status-seg" role="group" aria-label="Message status">
                  @for (status of statuses; track status) {
                    <button
                      type="button"
                      [class.on]="item.status === status"
                      [attr.data-status]="status"
                      (click)="setContactStatus(item, status)">
                      {{ status }}
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (tab() === 'newsletter') {
        @if (!subscribers().length) {
          <p class="empty">No newsletter subscribers yet.</p>
        }
        <div class="cards">
          @for (item of subscribers(); track item.id) {
            <article class="card" [attr.data-status]="item.active ? 'new' : 'closed'">
              <header>
                <div class="who">
                  <strong>{{ item.email }}</strong>
                  <span class="badge" [attr.data-status]="item.active ? 'new' : 'closed'">
                    {{ item.active ? 'Active' : 'Unsubscribed' }}
                  </span>
                </div>
                <time>{{ item.createdAt | date: 'medium' }}</time>
              </header>
              @if (item.unsubscribedAt) {
                <p class="meta">Unsubscribed {{ item.unsubscribedAt | date: 'medium' }}</p>
              }
              <div class="foot">
                <span class="foot-label">Subscription</span>
                <div class="status-seg" role="group" aria-label="Subscription status">
                  <button type="button" [class.on]="item.active" data-status="new" (click)="setSubscriber(item, true)">Active</button>
                  <button type="button" [class.on]="!item.active" data-status="closed" (click)="setSubscriber(item, false)">Unsubscribed</button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .intro {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.15rem;
    }
    .lede {
      margin: 0.35rem 0 0;
      color: var(--lvj-muted);
      max-width: 48ch;
    }
    .count-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      background: #102033;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 650;
      letter-spacing: 0.02em;
    }

    .tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      padding: 0.3rem;
      margin: 0 0 1.25rem;
      background: var(--lvj-panel);
      border: 1px solid var(--lvj-line);
      border-radius: 999px;
      box-shadow: var(--lvj-shadow-soft);
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 0;
      background: transparent;
      color: var(--lvj-muted);
      padding: 0.55rem 0.95rem;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.86rem;
      font-weight: 600;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .tabs button em {
      font-style: normal;
      min-width: 1.35rem;
      height: 1.35rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      background: color-mix(in srgb, var(--lvj-ink) 8%, transparent);
      color: var(--lvj-ink);
      font-size: 0.72rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .tabs button.on {
      background: #102033;
      color: #fff;
    }
    .tabs button.on em {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }

    .cards {
      display: grid;
      gap: 0.85rem;
    }
    .card {
      background: var(--lvj-panel);
      border: 1px solid var(--lvj-line);
      border-radius: 18px;
      padding: 1.1rem 1.2rem 1.15rem;
      box-shadow: var(--lvj-shadow-soft);
      border-left: 4px solid color-mix(in srgb, var(--lvj-jewel) 55%, transparent);
    }
    .card[data-status='reviewed'] {
      border-left-color: #2f6f9f;
    }
    .card[data-status='closed'] {
      border-left-color: #8aa0b4;
    }
    .card[data-status='new'] {
      border-left-color: #1f6b4f;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.45rem;
    }
    .who {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.55rem;
      min-width: 0;
    }
    .who strong {
      font-size: 1.02rem;
      font-weight: 650;
      color: var(--lvj-ink);
    }
    time {
      color: var(--lvj-muted);
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      background: color-mix(in srgb, var(--lvj-panel-alt) 90%, #fff);
      color: var(--lvj-ink);
    }
    .badge[data-status='new'] {
      background: color-mix(in srgb, #1f6b4f 14%, #fff);
      color: #1f6b4f;
    }
    .badge[data-status='reviewed'] {
      background: color-mix(in srgb, #2f6f9f 14%, #fff);
      color: #2f6f9f;
    }
    .badge[data-status='closed'] {
      background: color-mix(in srgb, #5b7188 12%, #fff);
      color: #5b7188;
    }

    .meta {
      margin: 0;
      color: var(--lvj-muted);
      font-size: 0.9rem;
    }
    .meta.accent {
      margin-top: 0.25rem;
      color: var(--lvj-ink);
      font-weight: 550;
    }
    .body {
      margin: 0.65rem 0 0;
      color: var(--lvj-charcoal);
      line-height: 1.5;
    }

    .chips,
    .refs {
      list-style: none;
      margin: 0.75rem 0 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .chips li {
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      background: var(--lvj-panel-alt);
      border: 1px solid var(--lvj-line);
      color: var(--lvj-ink);
      font-size: 0.8rem;
      font-weight: 550;
    }
    .chips li span {
      color: var(--lvj-muted);
      font-weight: 500;
      margin-left: 0.25rem;
    }
    .refs li {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.84rem;
    }
    .refs a {
      color: var(--lvj-gold-deep);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .refs span {
      color: var(--lvj-muted);
      text-transform: capitalize;
    }

    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.7rem 1rem;
      margin-top: 1rem;
      padding-top: 0.95rem;
      border-top: 1px solid var(--lvj-line);
    }
    .foot-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--lvj-muted);
    }

    .status-seg {
      display: inline-flex;
      padding: 0.22rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--lvj-panel-alt) 85%, #fff);
      border: 1px solid var(--lvj-line);
      gap: 0.15rem;
    }
    .status-seg button {
      border: 0;
      background: transparent;
      color: var(--lvj-muted);
      padding: 0.42rem 0.85rem;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 650;
      letter-spacing: 0.02em;
      text-transform: capitalize;
      transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }
    .status-seg button:hover {
      color: var(--lvj-ink);
    }
    .status-seg button.on[data-status='new'] {
      background: #1f6b4f;
      color: #fff;
      box-shadow: 0 6px 14px rgba(31, 107, 79, 0.22);
    }
    .status-seg button.on[data-status='reviewed'] {
      background: #2f6f9f;
      color: #fff;
      box-shadow: 0 6px 14px rgba(47, 111, 159, 0.22);
    }
    .status-seg button.on[data-status='closed'] {
      background: #5b7188;
      color: #fff;
      box-shadow: 0 6px 14px rgba(91, 113, 136, 0.2);
    }

    .empty {
      margin: 0 0 0.85rem;
      padding: 1.25rem;
      text-align: center;
      color: var(--lvj-muted);
      background: var(--lvj-panel);
      border: 1px dashed var(--lvj-line-strong);
      border-radius: 16px;
    }

    @media (max-width: 720px) {
      .tabs {
        width: 100%;
        border-radius: 16px;
      }
      .tabs button {
        flex: 1 1 auto;
        justify-content: center;
      }
      header {
        flex-direction: column;
        gap: 0.35rem;
      }
      .status-seg {
        width: 100%;
      }
      .status-seg button {
        flex: 1;
        text-align: center;
      }
    }
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
  readonly tabItems: { id: LeadTab; label: string }[] = [
    { id: 'inquiries', label: 'Inquiries' },
    { id: 'custom', label: 'Custom jewelry' },
    { id: 'contact', label: 'Contact' },
    { id: 'newsletter', label: 'Newsletter' }
  ];

  readonly activeCount = computed(() => this.countFor(this.tab()));

  ngOnInit(): void {
    this.inquiry.adminList().subscribe(list => this.inquiries.set(list));
    this.inbox.customJewelry().subscribe(list => this.custom.set(list));
    this.inbox.contact().subscribe(list => this.contacts.set(list));
    this.inbox.newsletter().subscribe(list => this.subscribers.set(list));
  }

  countFor(id: LeadTab): number {
    switch (id) {
      case 'inquiries':
        return this.inquiries().length;
      case 'custom':
        return this.custom().length;
      case 'contact':
        return this.contacts().length;
      case 'newsletter':
        return this.subscribers().length;
    }
  }

  setInquiryStatus(item: InquiryRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inquiry.setStatus(item.id, status).subscribe({
      next: updated => this.inquiries.update(list => list.map(row => (row.id === updated.id ? updated : row))),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setCustomStatus(item: CustomJewelryRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inbox.setCustomJewelryStatus(item.id, status).subscribe({
      next: updated => this.custom.update(list => list.map(row => (row.id === updated.id ? updated : row))),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setContactStatus(item: ContactMessageRecord, status: InquiryStatus): void {
    if (item.status === status) return;
    this.inbox.setContactStatus(item.id, status).subscribe({
      next: updated => this.contacts.update(list => list.map(row => (row.id === updated.id ? updated : row))),
      error: err => this.toast.error(err.error?.message || 'Unable to update status.')
    });
  }

  setSubscriber(item: NewsletterSubscriber, active: boolean): void {
    if (item.active === active) return;
    this.inbox.setNewsletterActive(item.id, active).subscribe({
      next: updated => this.subscribers.update(list => list.map(row => (row.id === updated.id ? updated : row))),
      error: err => this.toast.error(err.error?.message || 'Unable to update subscriber.')
    });
  }
}
