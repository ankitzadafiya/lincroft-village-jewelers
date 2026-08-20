import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PageLoaderComponent } from './shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ConfirmDialog, PageLoaderComponent],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <app-page-loader />
    <p-toast />
    <p-confirmdialog />
    <router-outlet />
  `
})
export class AppComponent {}
