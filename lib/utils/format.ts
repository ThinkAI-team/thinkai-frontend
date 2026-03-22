const VI_LOCALE = 'vi-VN';

const dateTimeFormatter = new Intl.DateTimeFormat(VI_LOCALE, {
  dateStyle: 'short',
  timeStyle: 'short',
});

const longDateFormatter = new Intl.DateTimeFormat(VI_LOCALE, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const numberFormatter = new Intl.NumberFormat(VI_LOCALE);

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTimeVi(value?: string | number | Date | null): string {
  if (value === null || value === undefined) return '';
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '';
}

export function formatLongDateVi(value?: string | number | Date | null): string {
  if (value === null || value === undefined) return '';
  const date = toDate(value);
  return date ? longDateFormatter.format(date) : '';
}

export function formatVnd(value?: number | null): string {
  const amount = Number(value || 0);
  return `${numberFormatter.format(amount)}đ`;
}
