export type EntryType = 'gave' | 'received';

export type Person = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type Entry = {
  id: string;
  personId: string;
  type: EntryType;
  amount: number;
  method: string | null;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
};

export type StoredData = {
  version: 1;
  people: Person[];
  entries: Entry[];
};

export type EntryWithBalance = Entry & {
  /** Positive means the person owes you, negative means you owe them. */
  balance: number;
};

export type PersonSummary = {
  person: Person;
  /** Positive means they owe you. */
  balance: number;
  gave: number;
  received: number;
  entryCount: number;
  lastActivity: string | null;
};

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank', 'Card', 'Other'] as const;
