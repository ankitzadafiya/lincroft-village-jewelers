export type InquirySource = 'cart' | 'product' | 'whatsapp' | 'email';
export type InquiryStatus = 'new' | 'reviewed' | 'closed';
/** 'product' is the default for any item that omits `kind` (back-compat with existing records). */
export type InquiryItemKind = 'product' | 'diamond';

export interface InquiryItem {
  kind?: InquiryItemKind;
  productId?: string;
  sku: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  /** Product options the customer picked (product items only; all optional). */
  metalColor?: string;
  karat?: string;
  ringSize?: string;
  /** Free-text request from the "Customize this item" box. */
  customization?: string;
  /** Price of the picked karat at the time it was added (display only). */
  unitPrice?: number | null;
  /** Present only when kind === 'diamond'. */
  diamondShape?: string;
  diamondCarat?: number;
  diamondClarity?: string;
  diamondColor?: string;
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

/** A single diamond spec the customer has picked in the "Select your diamond" modal. */
export interface DiamondSelection {
  shape: string;
  carat: number;
  clarity: string;
  color: string;
  imageUrl?: string | null;
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
