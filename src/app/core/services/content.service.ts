import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiMessage,
  ContactRequest,
  CustomJewelryRequest,
  HomeContent,
  InstagramPost,
  InstagramPostWriteRequest,
  NewsletterRequest,
  ServiceOffering,
  ServiceOfferingWriteRequest,
  Testimonial,
  TestimonialWriteRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  home(): Observable<HomeContent> {
    return this.http.get<HomeContent>(`${this.api}/content/home`);
  }

  testimonials(): Observable<Testimonial[]> {
    return this.http.get<Testimonial[]>(`${this.api}/content/testimonials`);
  }

  services(): Observable<ServiceOffering[]> {
    return this.http.get<ServiceOffering[]>(`${this.api}/content/services`);
  }

  instagram(): Observable<InstagramPost[]> {
    return this.http.get<InstagramPost[]>(`${this.api}/content/instagram`);
  }

  customJewelry(payload: CustomJewelryRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/custom-jewelry`, payload);
  }

  contact(payload: ContactRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/contact`, payload);
  }

  newsletter(payload: NewsletterRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/newsletter`, payload);
  }

  updateHome(payload: HomeContent): Observable<HomeContent> {
    return this.http.put<HomeContent>(`${this.api}/admin/content/home`, payload);
  }

  adminTestimonials(): Observable<Testimonial[]> {
    return this.http.get<Testimonial[]>(`${this.api}/admin/testimonials`);
  }

  createTestimonial(payload: TestimonialWriteRequest): Observable<Testimonial> {
    return this.http.post<Testimonial>(`${this.api}/admin/testimonials`, payload);
  }

  updateTestimonial(id: string, payload: TestimonialWriteRequest): Observable<Testimonial> {
    return this.http.put<Testimonial>(`${this.api}/admin/testimonials/${id}`, payload);
  }

  deleteTestimonial(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.api}/admin/testimonials/${id}`);
  }

  adminServices(): Observable<ServiceOffering[]> {
    return this.http.get<ServiceOffering[]>(`${this.api}/admin/services`);
  }

  createService(payload: ServiceOfferingWriteRequest): Observable<ServiceOffering> {
    return this.http.post<ServiceOffering>(`${this.api}/admin/services`, payload);
  }

  updateService(id: string, payload: ServiceOfferingWriteRequest): Observable<ServiceOffering> {
    return this.http.put<ServiceOffering>(`${this.api}/admin/services/${id}`, payload);
  }

  deleteService(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.api}/admin/services/${id}`);
  }

  adminInstagram(): Observable<InstagramPost[]> {
    return this.http.get<InstagramPost[]>(`${this.api}/admin/instagram`);
  }

  createInstagram(payload: InstagramPostWriteRequest): Observable<InstagramPost> {
    return this.http.post<InstagramPost>(`${this.api}/admin/instagram`, payload);
  }

  updateInstagram(id: string, payload: InstagramPostWriteRequest): Observable<InstagramPost> {
    return this.http.put<InstagramPost>(`${this.api}/admin/instagram/${id}`, payload);
  }

  deleteInstagram(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.api}/admin/instagram/${id}`);
  }
}
