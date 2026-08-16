import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ConfirmDialog],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <p-toast />
    <p-confirmdialog />
    <router-outlet />
  `
})
export class AppComponent {}
