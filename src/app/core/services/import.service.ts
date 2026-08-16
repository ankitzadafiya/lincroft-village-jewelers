import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { ImportColumnMapping, ImportConfirmResult, ImportJob, ImportPreviewResult } from '../models';
import { DEFAULT_IMPORT_MAPPING } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly defaultMapping = DEFAULT_IMPORT_MAPPING;

  parseWorkbook(file: File): Promise<Record<string, string>[]> {
    return file.arrayBuffer().then(buffer => {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    });
  }

  validate(rows: Record<string, string>[], mapping: ImportColumnMapping[] = DEFAULT_IMPORT_MAPPING): Observable<ImportPreviewResult> {
    return this.http.post<ImportPreviewResult>(`${this.api}/admin/import/validate`, { rows, mapping });
  }

  confirm(rows: Record<string, string | null>[]): Observable<ImportConfirmResult> {
    return this.http.post<ImportConfirmResult>(`${this.api}/admin/import/confirm`, { rows });
  }

  uploadWorkbook(file: File): Observable<ImportPreviewResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportPreviewResult>(`${this.api}/admin/import/upload`, form);
  }

  jobs(): Observable<ImportJob[]> {
    return this.http.get<ImportJob[]>(`${this.api}/admin/import/jobs`);
  }

  job(id: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(`${this.api}/admin/import/jobs/${id}`);
  }

  downloadTemplate(): void {
    const headers = DEFAULT_IMPORT_MAPPING.map(m => m.excelHeader);
    const sample = [{
      SKU: 'LVJ-ER-9999',
      'Product Name': 'Sample Solitaire',
      Description: 'Demo row — replace with live inventory.',
      Category: 'Ring',
      Subcategory: 'Lab-Grown Engagement Ring',
      'Brand/Designer': 'Lincroft Atelier',
      'Metal Type': 'White Gold',
      'Metal Karat': '14k',
      'Diamond Type': 'Natural',
      'Diamond Shape': 'Round',
      'Diamond Carat': '1.00 ct',
      'Diamond Color': 'G',
      'Diamond Clarity': 'VS2',
      Gemstone: '',
      Weight: '',
      Price: '4500',
      'Show Price': 'true',
      Status: 'active'
    }];
    const sheet = XLSX.utils.json_to_sheet(sample, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
    XLSX.writeFile(workbook, 'lincroft-product-import-template.xlsx');
  }

  downloadErrors(rows: ImportPreviewResult['rows']): void {
    const failed = rows.filter(r => !r.valid).map(r => ({
      Row: r.rowNumber,
      SKU: r.data['sku'] ?? '',
      Name: r.data['name'] ?? '',
      Errors: r.errors.join(' | ')
    }));
    const sheet = XLSX.utils.json_to_sheet(failed);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Failed rows');
    XLSX.writeFile(workbook, 'lincroft-import-errors.xlsx');
  }
}
