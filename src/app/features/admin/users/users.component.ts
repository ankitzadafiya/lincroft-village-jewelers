import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminUser,
  STAFF_PERMISSION_OPTIONS,
  StaffRole
} from '../../../core/models';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  adminUserPayload,
  adminUserUpdatePayload,
  emailAddress,
  matchControls,
  optionalPhone,
  optionalStaffPassword,
  personName,
  staffPassword
} from '../../../core/utils/auth-validation';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, DatePipe, TitleCasePipe, AppIconComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>;

  private readonly api = inject(AdminUsersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly permissionOptions = STAFF_PERMISSION_OPTIONS;
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly formError = signal('');
  readonly selectedPermissions = signal<string[]>([]);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [personName]],
      email: ['', [emailAddress]],
      phone: ['', [optionalPhone]],
      role: ['staff' as StaffRole, [Validators.required]],
      password: ['', [staffPassword]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: matchControls('password', 'confirmPassword') }
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: list => {
        this.users.set([...list].sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isEditing(): boolean {
    return !!this.editingId();
  }

  invalid(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  confirmInvalid(): boolean {
    const confirm = this.form.controls.confirmPassword;
    const password = this.form.controls.password.value;
    if (this.isEditing() && !password && !confirm.value) return false;
    return this.invalid(confirm) || (this.form.hasError('mismatch') && (confirm.touched || confirm.dirty));
  }

  message(control: AbstractControl | null, label: string): string {
    if (!control?.errors) return '';
    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['minlength']) return `${label} must be at least ${control.errors['minlength'].requiredLength} characters.`;
    if (control.errors['name']) return 'Use letters, spaces, hyphen, or apostrophe only.';
    if (control.errors['phone']) return 'Enter a valid phone number with at least 10 digits.';
    return `${label} is invalid.`;
  }

  isStaff(): boolean {
    return this.form.controls.role.value === 'staff';
  }

  togglePermission(key: string): void {
    const current = this.selectedPermissions();
    this.selectedPermissions.set(current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  }

  edit(user: AdminUser): void {
    this.formError.set('');
    this.editingId.set(user.id);
    this.applyEditValidators();
    this.form.reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    this.form.controls.email.disable({ emitEvent: false });
    this.selectedPermissions.set([...(user.permissions ?? [])]);
    this.scrollToForm();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.applyCreateValidators();
    this.form.controls.email.enable({ emitEvent: false });
    this.form.reset({ name: '', email: '', phone: '', role: 'staff', password: '', confirmPassword: '' });
    this.selectedPermissions.set([]);
  }

  save(): void {
    if (this.isEditing()) {
      this.update();
      return;
    }
    this.create();
  }

  create(): void {
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = adminUserPayload({
      ...value,
      permissions: this.isStaff() ? this.selectedPermissions() : undefined
    });
    this.saving.set(true);
    this.api.create(payload).subscribe({
      next: created => {
        this.saving.set(false);
        this.users.update(list => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
        this.cancelEdit();
        this.toast.success(`${created.name} can now sign in at /admin/login.`, 'Staff account created');
      },
      error: err => {
        this.saving.set(false);
        const field = err.error?.errors;
        const first = field ? Object.values(field as Record<string, string[]>).flat()[0] : '';
        this.formError.set(first || err.error?.message || 'Unable to create this account.');
      }
    });
  }

  update(): void {
    this.formError.set('');
    const id = this.editingId();
    if (!id) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.password && value.password !== value.confirmPassword) {
      this.form.controls.confirmPassword.markAsTouched();
      this.formError.set('Passwords do not match.');
      return;
    }
    const payload = adminUserUpdatePayload({
      name: value.name,
      phone: value.phone,
      role: value.role,
      permissions: this.isStaff() ? this.selectedPermissions() : undefined,
      password: value.password || undefined
    });
    this.saving.set(true);
    this.api.update(id, payload).subscribe({
      next: updated => {
        this.saving.set(false);
        this.users.update(list => list.map(item => item.id === updated.id ? updated : item)
          .sort((a, b) => a.name.localeCompare(b.name)));
        this.cancelEdit();
        this.toast.success(`${updated.name} access updated.`, 'Staff updated');
      },
      error: err => {
        this.saving.set(false);
        const field = err.error?.errors;
        const first = field ? Object.values(field as Record<string, string[]>).flat()[0] : '';
        this.formError.set(first || err.error?.message || 'Unable to update this account.');
      }
    });
  }

  setActive(user: AdminUser, isActive: boolean): void {
    if (user.id === this.auth.user()?.id) return;
    this.api.updateStatus(user.id, isActive).subscribe({
      next: updated => {
        this.users.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.toast.success(`${updated.name} is ${updated.isActive ? 'active' : 'deactivated'}.`);
      },
      error: err => this.toast.error(err.error?.message || 'Unable to update this account.')
    });
  }

  isSelf(user: AdminUser): boolean {
    return user.id === this.auth.user()?.id;
  }

  private applyCreateValidators(): void {
    this.form.controls.password.setValidators([staffPassword]);
    this.form.controls.confirmPassword.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
  }

  private applyEditValidators(): void {
    this.form.controls.password.setValidators([optionalStaffPassword]);
    this.form.controls.confirmPassword.setValidators([]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
  }

  private scrollToForm(): void {
    queueMicrotask(() => {
      const stage = document.querySelector('.stage') as HTMLElement | null;
      if (stage && this.formPanel) {
        const top = this.formPanel.nativeElement.offsetTop - 12;
        stage.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else {
        this.formPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}
