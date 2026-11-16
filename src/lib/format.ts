import { Currency, CurrencyCode, DEFAULT_CURRENCY, resolveCurrency } from './currency';
import { Entry, EntryType, EntryWithBalance, Person, PersonSummary } from './types';

function buildMoneyFormatter(currency: Currency) {
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimals,
  });
}

function buildCompactFormatter(currency: Currency) {
  return new Intl.NumberFormat(currency.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

let activeCurrency = resolveCurrency(DEFAULT_CURRENCY);
let moneyFormatter = buildMoneyFormatter(activeCurrency);
let compactFormatter = buildCompactFormatter(activeCurrency);

/**
 * Money formatters are module-level so statements and other plain helpers can
 * use them too. The settings provider keeps this in sync before rendering.
 */
export function setActiveCurrency(code: CurrencyCode) {
  const next = resolveCurrency(code);
  if (next.code === activeCurrency.code) return;
  activeCurrency = next;
  moneyFormatter = buildMoneyFormatter(next);
  compactFormatter = buildCompactFormatter(next);
}

export function currentCurrency() {
  return activeCurrency;
}

/** Symbol plus a space for multi-letter codes such as AED. */
export function currencyPrefix(currency = activeCurrency) {
  return currency.symbol.length > 1 ? `${currency.symbol} ` : currency.symbol;
}

export function formatNumber(value: number) {
  return moneyFormatter.format(Math.abs(round2(value)));
}

export function formatMoney(value: number) {
  return `${currencyPrefix()}${formatNumber(value)}`;
}

export function formatCompactMoney(value: number) {
  if (Math.abs(value) < 100000) return formatMoney(value);
  return `${currencyPrefix()}${compactFormatter.format(Math.abs(value))}`;
}

export function formatBalance(value: number) {
  if (Math.abs(value) < 0.004) return formatMoney(0);
  return `${value < 0 ? '−' : ''}${formatMoney(Math.abs(value))}`;
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatSignedMoney(value: number, type: EntryType) {
  return `${type === 'gave' ? '−' : '+'}${formatMoney(value)}`;
}

export function todayKey(date = new Date()) {
  return toDateKey(date);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = MONTHS.map((month) => month.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = WEEKDAYS.map((day) => day.slice(0, 3));

export function formatFullDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatHeaderDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDayLabel(key: string, now = new Date()) {
  if (key === toDateKey(now)) return 'Today';
  if (key === toDateKey(addDays(now, -1))) return 'Yesterday';
  const date = fromDateKey(key);
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}${year}`;
}

export function formatEntryDate(key: string, now = new Date()) {
  const label = formatDayLabel(key, now);
  if (label === 'Today' || label === 'Yesterday') {
    const date = fromDateKey(key);
    return `${label} · ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  }
  return label;
}

export function formatShortDate(key: string) {
  const date = fromDateKey(key);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Day-first numeric date used in file names and generated documents. */
export function formatNumericDate(date: Date) {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

export function formatMonthYear(date: Date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthShort(index: number) {
  return MONTHS_SHORT[index] ?? '';
}

export function weekdayShort(date: Date) {
  return WEEKDAYS_SHORT[date.getDay()] ?? '';
}

export function formatGeneratedAt(date = new Date()) {
  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function withBalance(entries: Entry[]): EntryWithBalance[] {
  const sorted = [...entries].sort(compareEntriesAsc);
  let balance = 0;
  const result = sorted.map((entry) => {
    balance = round2(balance + (entry.type === 'gave' ? entry.amount : -entry.amount));
    return { ...entry, balance };
  });
  return result;
}

export function compareEntriesAsc(a: Entry, b: Entry) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

export function summarizePerson(person: Person, entries: Entry[]): PersonSummary {
  let gave = 0;
  let received = 0;
  let lastActivity: string | null = null;
  for (const entry of entries) {
    if (entry.type === 'gave') gave += entry.amount;
    else received += entry.amount;
    if (!lastActivity || entry.createdAt > lastActivity) lastActivity = entry.createdAt;
  }
  return {
    person,
    balance: round2(gave - received),
    gave: round2(gave),
    received: round2(received),
    entryCount: entries.length,
    lastActivity,
  };
}

export function groupByDate(entries: EntryWithBalance[]) {
  const sorted = [...entries].sort((a, b) => -compareEntriesAsc(a, b));
  const groups: { key: string; entries: EntryWithBalance[] }[] = [];
  for (const entry of sorted) {
    const current = groups[groups.length - 1];
    if (current && current.key === entry.date) current.entries.push(entry);
    else groups.push({ key: entry.date, entries: [entry] });
  }
  return groups;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function parseAmountInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole.slice(0, 9);
  return `${whole.slice(0, 9)}.${rest.join('').slice(0, 2)}`;
}

export function sanitizePhoneInput(value: string) {
  return value.replace(/[^\d+\-() ]/g, '').slice(0, 20);
}
