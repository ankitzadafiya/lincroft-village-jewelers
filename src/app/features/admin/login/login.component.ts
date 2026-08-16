import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { emailAddress, loginPayload } from '../../../core/utils/auth-validation';
import { GoogleSignInComponent } from '../../../shared/components/google-sign-in/google-sign-in.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, AppIconComponent, GoogleSignInComponent, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [emailAddress]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  emailError(): string {
    const errors = this.form.controls.email.errors;
    if (errors?.['required']) return 'Email is required.';
    if (errors?.['email']) return 'Enter a valid email address.';
    if (errors?.['maxlength']) return 'Email is too long.';
    return '';
  }

  passwordError(): string {
    const errors = this.form.controls.password.errors;
    if (errors?.['required']) return 'Password is required.';
    if (errors?.['minlength']) return 'Password must be at least 8 characters.';
    if (errors?.['maxlength']) return 'Password is too long.';
    return '';
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    const payload = loginPayload(email, password);
    this.form.controls.password.reset('');
    this.submitting.set(true);
    this.auth.login(payload).subscribe({
      next: () => this.enter(),
      error: err => this.fail(err, 'Unable to sign in.')
    });
  }

  google(idToken: string): void {
    this.error.set('');
    this.submitting.set(true);
    this.auth.loginWithGoogle(idToken).subscribe({
      next: () => this.enter(),
      error: err => this.fail(err, 'This Google account does not have atelier access.')
    });
  }

  private enter(): void {
    this.submitting.set(false);
    void this.router.navigateByUrl(this.auth.firstAllowedPath());
  }

  private fail(err: { error?: { message?: string } }, fallback: string): void {
    this.submitting.set(false);
    const raw = err.error?.message || fallback;
    this.error.set(/password/i.test(String(raw)) && /demo1234/i.test(String(raw)) ? fallback : raw);
  }
}
