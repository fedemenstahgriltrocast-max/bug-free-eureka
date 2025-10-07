const DEFAULT_LOCALE = 'es-EC';
const DEFAULT_CURRENCY = 'USD';

export function formatCurrency(value, { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY } = {}) {
  const amount = Number.parseFloat(value ?? 0);
  if (Number.isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function roundCurrency(value, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(Number.parseFloat(value) * multiplier + Number.EPSILON) / multiplier;
}

export const currencyDefaults = Object.freeze({
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
});
