export interface Testimonial {
  id: string;
  name: string;
  location?: string;
  quote: string;
  rating: number;
  active: boolean;
  sortOrder: number;
}

export interface TestimonialWriteRequest {
  name: string;
  location?: string;
  quote: string;
  rating: number;
  active?: boolean;
  sortOrder?: number;
}

export interface ServiceOffering {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface ServiceOfferingWriteRequest {
  title: string;
  slug?: string;
  summary?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  alt?: string;
  href?: string;
  active: boolean;
  sortOrder: number;
}

export interface InstagramPostWriteRequest {
  imageUrl: string;
  alt?: string;
  href?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface HomeContent {
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  aboutExcerpt?: string;
}

