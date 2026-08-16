import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ContactMessageRecord,
  CustomJewelryRecord,
  InquiryStatus,
  NewsletterSubscriber
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminInboxService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  customJewelry(): Observable<CustomJewelryRecord[]> {
    return this.http.get<CustomJewelryRecord[]>(`${this.api}/admin/custom-jewelry`);
  }

  setCustomJewelryStatus(id: string, status: InquiryStatus): Observable<CustomJewelryRecord> {
    return this.http.patch<CustomJewelryRecord>(`${this.api}/admin/custom-jewelry/${id}/status`, { status });
  }

  contact(): Observable<ContactMessageRecord[]> {
    return this.http.get<ContactMessageRecord[]>(`${this.api}/admin/contact`);
  }

  setContactStatus(id: string, status: InquiryStatus): Observable<ContactMessageRecord> {
    return this.http.patch<ContactMessageRecord>(`${this.api}/admin/contact/${id}/status`, { status });
  }

  newsletter(): Observable<NewsletterSubscriber[]> {
    return this.http.get<NewsletterSubscriber[]>(`${this.api}/admin/newsletter`);
  }

  setNewsletterActive(id: string, active: boolean): Observable<NewsletterSubscriber> {
    return this.http.patch<NewsletterSubscriber>(`${this.api}/admin/newsletter/${id}`, { active });
  }
}
