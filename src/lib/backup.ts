import { todayKey } from './format';
import { Entry, EntryType, Person, StoredData } from './types';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A backup is the same shape as the stored ledger, with a little metadata so a
 * human opening the file can tell what it is. The extra fields are optional on
 * import, which keeps hand-written or older backups working.
 */
export type BackupFile = StoredData & {
  app: 'folio';
  exportedAt: string;
};

export function createBackupJson(people: Person[], entries: Entry[], now = new Date()) {
  const payload: BackupFile = {
    app: 'folio',
    version: 1,
    exportedAt: now.toISOString(),
    people,
    entries,
  };
  return JSON.stringify(payload, null, 2);
}

export function backupFileName(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `folio-ledger-${now.getFullYear()}-${month}-${day}.json`;
}

export function parseBackup(raw: string): StoredData {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error("That file isn't a Folio backup.");
  }

  const data = value as Record<string, unknown>;
  if (data.app !== undefined && data.app !== 'folio') {
    throw new Error("That file isn't a Folio backup.");
  }
  if (!Array.isArray(data.people) || !Array.isArray(data.entries)) {
    throw new Error("That file isn't a Folio backup.");
  }

  const now = new Date().toISOString();
  const people = data.people.map((item, index) => parsePerson(item, index, now));

  const personIds = new Set<string>();
  for (const person of people) {
    if (personIds.has(person.id)) {
      throw new Error('This backup contains duplicate accounts.');
    }
    personIds.add(person.id);
  }

  const entryIds = new Set<string>();
  const entries = data.entries.map((item, index) => {
    const entry = parseEntry(item, index, now);
    if (!personIds.has(entry.personId)) {
      throw new Error('This backup contains entries for a missing account.');
    }
    if (entryIds.has(entry.id)) {
      throw new Error('This backup contains duplicate entries.');
    }
    entryIds.add(entry.id);
    return entry;
  });

  return { version: 1, people, entries };
}

function parsePerson(value: unknown, index: number, now: string): Person {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Account ${index + 1} in this backup is invalid.`);
  }
  const person = value as Record<string, unknown>;
  const id = typeof person.id === 'string' ? person.id.trim() : '';
  const name = typeof person.name === 'string' ? person.name.trim() : '';
  if (!id) throw new Error(`Account ${index + 1} in this backup has no id.`);
  if (!name) throw new Error(`Account ${index + 1} in this backup has no name.`);

  return {
    id,
    name,
    phone: typeof person.phone === 'string' ? person.phone.trim() : '',
    createdAt: isoOr(person.createdAt, now),
    updatedAt: isoOr(person.updatedAt, now),
  };
}

function parseEntry(value: unknown, index: number, now: string): Entry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Entry ${index + 1} in this backup is invalid.`);
  }
  const entry = value as Record<string, unknown>;
  const id = typeof entry.id === 'string' ? entry.id.trim() : '';
  const personId = typeof entry.personId === 'string' ? entry.personId.trim() : '';
  if (!id) throw new Error(`Entry ${index + 1} in this backup has no id.`);
  if (!personId) throw new Error(`Entry ${index + 1} in this backup has no account.`);

  const type: EntryType | null =
    entry.type === 'gave' || entry.type === 'received' ? entry.type : null;
  if (!type) throw new Error(`Entry ${index + 1} in this backup has an unknown type.`);

  const amount = typeof entry.amount === 'number' ? entry.amount : Number(entry.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Entry ${index + 1} in this backup has an invalid amount.`);
  }

  const date =
    typeof entry.date === 'string' && DATE_KEY.test(entry.date) ? entry.date : todayKey();

  return {
    id,
    personId,
    type,
    amount,
    method: typeof entry.method === 'string' && entry.method.trim() ? entry.method.trim() : null,
    note: typeof entry.note === 'string' ? entry.note : '',
    date,
    createdAt: isoOr(entry.createdAt, now),
  };
}

function isoOr(value: unknown, fallback: string) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;
}
