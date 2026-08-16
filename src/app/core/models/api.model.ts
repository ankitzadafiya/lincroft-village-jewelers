export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiMessage {
  message: string;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}
