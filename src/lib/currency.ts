export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | 'JPY';

export type Currency = {
  code: CurrencyCode;
  name: string;
  /** Short prefix used in front of amounts. */
  symbol: string;
  /** Locale used for digit grouping and decimal separators. */
  locale: string;
  /** Fraction digits shown for this currency. */
  decimals: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-US', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-US', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', locale: 'en-US', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-US', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-US', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-US', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'en-US', decimals: 0 },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && CURRENCIES.some((item) => item.code === value);
}

export function resolveCurrency(code: string | null | undefined): Currency {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}
