import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { ImportColumnMapping, ImportConfirmResult, ImportJob, ImportPreviewResult } from '../models';
import { DEFAULT_IMPORT_MAPPING } from '../mock/mock-data';

/** Sample description in the template — shows the client's own format. */
const SAMPLE_DESCRIPTION = `Crafted in 14K solid gold, this vintage-inspired ring is perfect for those who love distinctive diamond jewelry with a delicate cluster design. It makes a memorable choice for an engagement, wedding, anniversary, promise, or special gift.

💎 DIAMOND DETAILS:
* Diamond Type: Lab Grown Diamond
* Shape: Round Cut
* Carat Weight: 0.10 TCW Approx.
* Color: E-F Color
* Clarity: VVS-VS
* Cut: Excellent

📜 CERTIFICATION
* IGI Certificate: If you would like an official IGI certification for your diamond, it can be added for a nominal additional cost ($35 to $50).

📦 PACKAGING & SHIPPING
* Comes in a premium jewelry gift box ready for gifting.
* Fast, secure & insured worldwide shipping included.

📌 NOTE
Product images are for reference. Actual diamond dimensions and carat weight may vary slightly within the stated tolerance.`;

/** Second sheet of the template: plain-language rules for every column. */
const TEMPLATE_HELP: [string, string][] = [
  ['SKU', 'Required. Unique code. Importing the same SKU again updates that product.'],
  ['Product Name', 'Required.'],
  ['Description', 'Intro text first. A line in CAPITALS starts a section (e.g. "💎 DIAMOND DETAILS"). "* Label: value" makes a detail row, "* text" makes a bullet. Press Alt+Enter for a new line inside the cell.'],
  ['Category / Subcategory', 'Must match the names in admin exactly (e.g. Ring / Lab-Grown Engagement Ring).'],
  ['Price', 'Main price. Leave empty when you fill Price 10K / 14K / 18K — the default karat price is used.'],
  ['Compare At Price', 'Optional "was" price shown with a strike-through (for the default karat).'],
  ['Metal Colors', 'Which gold colors the piece comes in: Yellow, White, Rose (comma separated). Leave empty for no color picker.'],
  ['Default Metal Color', 'Color selected when the page opens: Yellow, White or Rose. Empty = first listed.'],
  ['Price 10K / 14K / 18K', 'Price for each karat. Fill only the karats you offer. Leave all empty for no karat picker.'],
  ['Default Karat', '10K, 14K or 18K selected when the page opens. Empty = first filled karat.'],
  ['Ring Sizes', 'Empty = automatic (sizes 4 to 11 for Ring category). Or list sizes like "5, 5.5, 6". Write "none" to hide sizes.'],
  ['Allow Customization', 'yes / no. Shows the "Customize this item" box. Empty = yes.'],
  ['Yellow / White / Rose Gold Images', 'Photo links for that color, one per line (Alt+Enter) or comma separated. Shown when the customer picks that color.'],
  ['Image 1 … Image 12', 'Photos shown for every color (e.g. on-hand or detail shots).'],
  ['Video 1 … Video 3', 'Video links.']
];

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
      SKU: 'LVJ-RNG-9999',
      'Product Name': '0.10 CT Round Lab Grown Diamond Cluster Ring',
      Description: SAMPLE_DESCRIPTION,
      Category: 'Ring',
      Subcategory: 'Lab-Grown Engagement Ring',
      Brand: 'Lincroft Signature',
      Designer: '',
      'Metal Type': '',
      'Metal Karat': '',
      'Diamond Type': 'Lab Grown',
      'Diamond Shape': 'Round',
      'Diamond Carat': '0.10 ct',
      'Diamond Color': 'E-F',
      'Diamond Clarity': 'VVS-VS',
      Gemstone: '',
      Weight: '',
      Price: '',
      'Compare At Price': '850',
      'Show Price': 'true',
      Status: 'active',
      'Metal Colors': 'Yellow, White, Rose',
      'Default Metal Color': 'Rose',
      'Price 10K': '540',
      'Price 14K': '637.50',
      'Price 18K': '790',
      'Default Karat': '14K',
      'Ring Sizes': '',
      'Allow Customization': 'yes',
      'Yellow Gold Images': 'https://example.com/ring-yellow-1.jpg\nhttps://example.com/ring-yellow-2.jpg',
      'White Gold Images': 'https://example.com/ring-white-1.jpg',
      'Rose Gold Images': 'https://example.com/ring-rose-1.jpg',
      'Image 1': 'https://example.com/ring-on-hand.jpg'
    }];
    const sheet = XLSX.utils.json_to_sheet(sample, { header: headers });
    sheet['!cols'] = headers.map(h => ({ wch: h === 'Description' ? 60 : Math.max(14, h.length + 2) }));

    const help = XLSX.utils.aoa_to_sheet([
      ['Column', 'What to enter'],
      ...TEMPLATE_HELP
    ]);
    help['!cols'] = [{ wch: 24 }, { wch: 110 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
    XLSX.utils.book_append_sheet(workbook, help, 'How to fill');
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
