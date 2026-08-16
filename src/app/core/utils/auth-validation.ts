import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LoginRequest, RegisterRequest, StaffRole, AdminUserCreateRequest, AdminUserUpdateRequest } from '../models';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailAddress(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return { required: true };
  if (value.length > 254) return { maxlength: { requiredLength: 254, actualLength: value.length } };
  return EMAIL_PATTERN.test(value) ? null : { email: true };
}

export function personName(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return { required: true };
  if (value.length < 2) return { minlength: { requiredLength: 2, actualLength: value.length } };
  if (value.length > 80) return { maxlength: { requiredLength: 80, actualLength: value.length } };
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(value)) return { name: true };
  return null;
}

export function optionalPhone(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return { phone: true };
  if (!/^[+]?[\d\s().-]+$/.test(value)) return { phone: true };
  return null;
}

export function accountPassword(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return { required: true };
  if (value.length < 8) return { minlength: { requiredLength: 8, actualLength: value.length } };
  if (value.length > 128) return { maxlength: { requiredLength: 128, actualLength: value.length } };
  if (!/[A-Za-z]/.test(value)) return { passwordLetter: true };
  if (!/\d/.test(value)) return { passwordNumber: true };
  return null;
}

export function matchControls(source: string, confirm: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(source)?.value;
    const b = group.get(confirm)?.value;
    if (!b) return null;
    return a === b ? null : { mismatch: true };
  };
}

/** Only the fields the API contract allows — never confirmPassword or extras. */
export function loginPayload(email: string, password: string): LoginRequest {
  return {
    email: String(email ?? '').trim().toLowerCase(),
    password: String(password ?? '')
  };
}

export function registerPayload(value: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}): RegisterRequest {
  const phone = value.phone?.trim();
  const payload: RegisterRequest = {
    name: String(value.name ?? '').trim(),
    email: String(value.email ?? '').trim().toLowerCase(),
    password: String(value.password ?? '')
  };
  if (phone) payload.phone = phone;
  return payload;
}

export function staffPassword(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return { required: true };
  if (value.length < 8) return { minlength: { requiredLength: 8, actualLength: value.length } };
  return null;
}

/** Empty allowed (keep existing password); if set, must be ≥ 8 chars. */
export function optionalStaffPassword(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  if (value.length < 8) return { minlength: { requiredLength: 8, actualLength: value.length } };
  return null;
}

export function adminUserPayload(value: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: StaffRole;
  permissions?: string[];
  confirmPassword?: string;
}): AdminUserCreateRequest {
  const phone = value.phone?.trim();
  const payload: AdminUserCreateRequest = {
    name: String(value.name ?? '').trim(),
    email: String(value.email ?? '').trim().toLowerCase(),
    password: String(value.password ?? ''),
    role: value.role
  };
  if (phone) payload.phone = phone;
  if (value.role === 'staff') payload.permissions = [...(value.permissions ?? [])];
  return payload;
}

export function adminUserUpdatePayload(value: {
  name: string;
  phone?: string;
  role: StaffRole;
  permissions?: string[];
  password?: string;
  confirmPassword?: string;
}): AdminUserUpdateRequest {
  const phone = value.phone?.trim();
  const password = value.password?.trim();
  const payload: AdminUserUpdateRequest = {
    name: String(value.name ?? '').trim(),
    role: value.role,
    phone: phone || null
  };
  if (value.role === 'staff') payload.permissions = [...(value.permissions ?? [])];
  if (password) payload.password = password;
  return payload;
}
