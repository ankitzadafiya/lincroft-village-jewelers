export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function spec(
  key: string,
  label: string,
  value: string,
  group: 'metal' | 'diamond' | 'gemstone' | 'watch' | 'general' | 'dimensions' = 'general'
) {
  return { key, label, value, group };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function buildMailto(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
