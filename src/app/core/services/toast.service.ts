import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);

  success(detail: string, summary = 'Saved'): void {
    this.messages.add({ severity: 'success', summary, detail, life: 3500 });
  }

  error(detail: string, summary = 'Unable to complete'): void {
    this.messages.add({ severity: 'error', summary, detail, life: 5000 });
  }

  info(detail: string, summary = 'Note'): void {
    this.messages.add({ severity: 'info', summary, detail, life: 3500 });
  }
}
