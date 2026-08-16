export type InquirySource = 'cart' | 'product' | 'whatsapp' | 'email';
export type InquiryStatus = 'new' | 'reviewed' | 'closed';

export interface InquiryItem {
  productId?: string;
  sku: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
}

export interface InquiryRequest {
  name: string;
  email: string;
  phone: string;
  message?: string;
  items: InquiryItem[];
  source?: InquirySource;
}

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  items: InquiryItem[];
  source: InquirySource;
  status: InquiryStatus;
  createdAt: string;
}

export interface InquiryStatusUpdate {
  status: InquiryStatus;
}

export interface CustomJewelryRequest {
  name: string;
  email: string;
  phone: string;
  jewelryType: string;
  preferredMetal?: string;
  gemstone?: string;
  budget?: string;
  description?: string;
  referenceImageUrls?: string[];
}

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface NewsletterRequest {
  email: string;
}

export interface CustomJewelryReference {
  url: string;
  downloadStatus: 'pending' | 'downloaded' | 'failed';
}

export interface CustomJewelryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  jewelryType: string;
  preferredMetal?: string;
  gemstone?: string;
  budget?: string;
  description?: string;
  referenceImages: CustomJewelryReference[];
  status: InquiryStatus;
  createdAt: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
  unsubscribedAt?: string;
}

export interface NewsletterSubscriberUpdate {
  active: boolean;
}
