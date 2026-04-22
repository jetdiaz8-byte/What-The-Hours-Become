/**
 * Supported currencies and rate period helpers.
 */

export const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

export const RATE_PERIODS = [
  { id: 'hourly',  label: 'Hourly',  secondsPerPeriod: 3600 },
  { id: 'daily',   label: 'Daily',   secondsPerPeriod: 8 * 3600 },   // 8-hour work day
  { id: 'monthly', label: 'Monthly', secondsPerPeriod: 22 * 8 * 3600 }, // 22 working days
];

/**
 * Given a rate, period id, and elapsed seconds — return earnings.
 */
export function computeEarnings(rate, periodId, elapsedSeconds) {
  const period = RATE_PERIODS.find((p) => p.id === periodId) ?? RATE_PERIODS[0];
  const perSecond = rate / period.secondsPerPeriod;
  return elapsedSeconds * perSecond;
}

/**
 * Format an amount using the given currency code.
 * JPY, KRW, IDR, VND have no decimal places.
 */
export function formatAmount(amount, currencyCode) {
  const noDecimals = ['JPY', 'KRW', 'IDR', 'VND'];
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
  const decimals = noDecimals.includes(currencyCode) ? 0 : 2;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currency.symbol}${formatted}`;
}
