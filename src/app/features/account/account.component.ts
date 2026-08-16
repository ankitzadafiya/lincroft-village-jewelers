import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import {
  accountPassword,
  emailAddress,
  loginPayload,
  matchControls,
  optionalPhone,
  personName,
  registerPayload
} from '../../core/utils/auth-validation';
import { AppIconComponent } from '../../shared/icons/lvj-icons';
import { GoogleSignInComponent } from '../../shared/components/google-sign-in/google-sign-in.component';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent, GoogleSignInComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {
  readonly customer = inject(CustomerAuthService);
  readonly favorites = inject(FavoriteService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [emailAddress]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [personName]],
      email: ['', [emailAddress]],
      phone: ['', [optionalPhone]],
      password: ['', [accountPassword]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: matchControls('password', 'confirmPassword') }
  );

  constructor() {
    inject(SeoService).set({
      title: 'Account',
      description: 'Sign in to Lincroft Village Jewelers to save favorites across devices.'
    });
  }

  setMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.error.set('');
    this.loginForm.markAsUntouched();
    this.registerForm.markAsUntouched();
  }

  invalid(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  confirmInvalid(): boolean {
    const confirm = this.registerForm.controls.confirmPassword;
    return (
      this.invalid(confirm) ||
      (this.registerForm.hasError('mismatch') && (confirm.touched || confirm.dirty))
    );
  }

  message(control: AbstractControl | null, label: string): string {
    if (!control?.errors) return '';
    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['minlength']) {
      const need = control.errors['minlength'].requiredLength as number;
      return `${label} must be at least ${need} characters.`;
    }
    if (control.errors['maxlength']) return `${label} is too long.`;
    if (control.errors['name']) return 'Use letters, spaces, hyphen, or apostrophe only.';
    if (control.errors['phone']) return 'Enter a valid phone number with at least 10 digits.';
    if (control.errors['passwordLetter']) return 'Include at least one letter.';
    if (control.errors['passwordNumber']) return 'Include at least one number.';
    return `${label} is invalid.`;
  }

  initials(): string {
    const name = this.customer.user()?.name?.trim() || this.customer.user()?.email || 'A';
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  google(idToken: string): void {
    this.error.set('');
    this.submitting.set(true);
    this.customer.loginWithGoogle(idToken).subscribe({
      next: session => {
        this.submitting.set(false);
        this.toast.success('Welcome. Your favorites are synced.', 'Signed in');
        this.afterAuth(session.user.role);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(this.safeError(err, 'Unable to sign in with Google.'));
      }
    });
  }

  login(): void {
    this.error.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    const payload = loginPayload(email, password);
    this.loginForm.controls.password.reset('');
    this.submitting.set(true);
    this.customer.login(payload).subscribe({
      next: session => {
        this.submitting.set(false);
        this.toast.success('Welcome back. Your favorites are synced.', 'Signed in');
        this.afterAuth(session.user.role);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(this.safeError(err, 'Unable to sign in. Check your email and password.'));
      }
    });
  }

  register(): void {
    this.error.set('');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const value = this.registerForm.getRawValue();
    const payload = registerPayload(value);
    this.registerForm.patchValue({ password: '', confirmPassword: '' });
    this.submitting.set(true);
    this.customer.register(payload).subscribe({
      next: session => {
        this.submitting.set(false);
        this.toast.success('Account created. Favorites will sync on this device.', 'Welcome');
        this.afterAuth(session.user.role);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(this.safeError(err, 'Unable to create the account. Try a different email.'));
      }
    });
  }

  logout(): void {
    this.customer.logout();
    this.toast.info('You are signed out.');
  }

  private afterAuth(role: string): void {
    if (role === 'admin' || role === 'staff') {
      void this.router.navigate(['/account']);
      return;
    }
    void this.router.navigate(['/favorites']);
  }

  private safeError(err: { error?: { message?: string }; message?: string }, fallback: string): string {
    const raw = err?.error?.message || err?.message || fallback;
    if (/password/i.test(raw) && /guest@|welcome123|demo1234/i.test(raw)) return fallback;
    return raw;
  }
}
