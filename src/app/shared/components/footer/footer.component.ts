import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { STORE_TOP_CATEGORIES } from '../../../core/catalog/store-categories';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { ContentService } from '../../../core/services/content.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, ReactiveFormsModule, AppIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly config = inject(ConfigurationService);
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly year = new Date().getFullYear();
  readonly shopLinks = STORE_TOP_CATEGORIES;

  subscribe(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.content.newsletter({ email: this.email.value }).subscribe({
      next: res => {
        this.toast.success(res.message, 'Welcome');
        this.email.reset();
      },
      error: () => this.toast.error('Unable to subscribe right now.')
    });
  }
}
