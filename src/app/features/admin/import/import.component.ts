import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ProgressBar } from 'primeng/progressbar';
import { ImportPreviewResult } from '../../../core/models';
import { ImportService } from '../../../core/services/import.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-import',
  imports: [TableModule, ProgressBar],
  template: `
    <div class="admin-page">
      <h1>Import products</h1>
      <p class="muted">Upload an Excel file. Invalid rows are never imported. Mapping is configurable for a changing spreadsheet format.</p>
      <div class="actions">
        <button class="btn btn-ghost" type="button" (click)="imports.downloadTemplate()">Download template</button>
        <label class="btn">
          Choose Excel file
          <input type="file" accept=".xlsx,.xls,.csv" hidden (change)="onFile($event)" />
        </label>
      </div>

      @if (progress() != null) {
        <p-progressBar [value]="progress()" />
      }

      @if (preview(); as p) {
        <p>{{ p.validCount }} valid · {{ p.errorCount }} with errors</p>
        <p-table [value]="p.rows" [paginator]="true" [rows]="12">
          <ng-template pTemplate="header">
            <tr>
              <th>Row</th>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Valid</th>
              <th>Errors</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr [class.bad]="!row.valid">
              <td>{{ row.rowNumber }}</td>
              <td>{{ row.data.sku }}</td>
              <td>{{ row.data.name }}</td>
              <td>{{ row.data.category }}</td>
              <td>{{ row.valid ? 'Yes' : 'No' }}</td>
              <td>{{ row.errors.join('; ') }}</td>
            </tr>
          </ng-template>
        </p-table>
        <div class="actions">
          <button class="btn" type="button" [disabled]="!p.validCount || importing()" (click)="confirm()">Confirm import of valid rows</button>
          @if (p.errorCount) {
            <button class="btn btn-ghost" type="button" (click)="imports.downloadErrors(p.rows)">Download failed rows</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    h1 { font-style: italic; }
    .actions { display: flex; gap: 0.7rem; flex-wrap: wrap; margin: 1.2rem 0; }
    .bad { background: #f8ece9; }
  `]
})
export class ImportComponent {
  readonly imports = inject(ImportService);
  private readonly toast = inject(ToastService);
  readonly preview = signal<ImportPreviewResult | null>(null);
  readonly progress = signal<number | null>(null);
  readonly importing = signal(false);
  private rows: Record<string, string>[] = [];

  async onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.progress.set(20);
    this.rows = await this.imports.parseWorkbook(file);
    this.progress.set(60);
    this.imports.validate(this.rows).subscribe({
      next: preview => {
        this.preview.set(preview);
        this.progress.set(null);
      },
      error: err => {
        this.toast.error(err.error?.message || 'Validation failed.');
        this.progress.set(null);
      }
    });
  }

  confirm(): void {
    const preview = this.preview();
    if (!preview) return;
    const valid = preview.rows.filter(r => r.valid).map(r => r.data);
    this.importing.set(true);
    this.progress.set(30);
    this.imports.confirm(valid).subscribe({
      next: result => {
        this.progress.set(100);
        this.toast.success(`${result.imported} products imported${result.jobId ? ` (job ${result.jobId})` : ''}.`);
        this.importing.set(false);
        this.progress.set(null);
      },
      error: err => {
        this.toast.error(err.error?.message || 'Import failed.');
        this.importing.set(false);
        this.progress.set(null);
      }
    });
  }
}
