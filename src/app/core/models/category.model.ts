export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder: number;
  active: boolean;
  megaMenu: boolean;
  productCount?: number;
}

export interface CategoryWritePayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
  active?: boolean;
  megaMenu?: boolean;
}

export interface Designer {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
}

export interface DesignerWriteRequest {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  sortOrder?: number;
}
