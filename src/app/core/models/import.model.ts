export interface ImportColumnMapping {
  excelHeader: string;
  field: string;
  required: boolean;
}

export interface ImportRowError {
  rowNumber: number;
  sku?: string;
  field?: string;
  message: string;
}

/** Preview-row errors from POST /api/admin/import/validate are plain strings. */
export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, string | null>;
  valid: boolean;
  errors: string[];
}

export interface ImportPreviewResult {
  headers: string[];
  rows: ImportPreviewRow[];
  validCount: number;
  errorCount: number;
  mapping: ImportColumnMapping[];
}

export interface ImportConfirmResult {
  imported: number;
  failed: number;
  errors: ImportRowError[];
  jobId?: string;
}

export interface ImportJob {
  id: string;
  startedAt: string;
  completedAt?: string;
  totalRows: number;
  imported: number;
  failed: number;
  status: 'running' | 'completed' | 'failed';
  errors: ImportRowError[];
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  categories: number;
  inquiries: number;
  missingImages: number;
  missingInformation: number;
  recentProducts: {
    id: string;
    sku: string;
    name: string;
    updatedAt: string;
  }[];
}
