import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { todayKey } from './format';
import { Entry, EntryType, Person, StoredData } from './types';

const STORAGE_KEY = 'folio.ledger.v1';

type NewPersonInput = {
  name: string;
  phone: string;
};

type NewEntryInput = {
  personId: string;
  type: EntryType;
  amount: number;
  method?: string | null;
  note?: string;
  date?: string;
};

type StoreValue = {
  hydrated: boolean;
  people: Person[];
  entries: Entry[];
  addPerson: (input: NewPersonInput) => Person;
  updatePerson: (id: string, input: Partial<NewPersonInput>) => void;
  deletePerson: (id: string) => void;
  addEntry: (input: NewEntryInput) => Entry;
  updateEntry: (id: string, input: Partial<NewEntryInput>) => void;
  deleteEntry: (id: string) => void;
  replaceData: (data: Pick<StoredData, 'people' | 'entries'>) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function isValidStoredData(value: unknown): value is StoredData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<StoredData>;
  return Array.isArray(data.people) && Array.isArray(data.entries);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidStoredData(parsed)) {
            setPeople(parsed.people);
            setEntries(parsed.entries);
          }
        }
      } catch {
        // A corrupt or inaccessible store should never block the app.
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const data: StoredData = { version: 1, people, entries };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      // Persistence is best-effort; the in-memory ledger keeps working.
    });
  }, [people, entries]);

  const value = useMemo<StoreValue>(() => {
    const nowIso = () => new Date().toISOString();

    const touchPerson = (personId: string, timestamp: string) => {
      setPeople((current) =>
        current.map((person) =>
          person.id === personId ? { ...person, updatedAt: timestamp } : person,
        ),
      );
    };

    return {
      hydrated,
      people,
      entries,
      addPerson: (input) => {
        const timestamp = nowIso();
        const person: Person = {
          id: makeId('per'),
          name: input.name.trim(),
          phone: input.phone.trim(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        setPeople((current) => [person, ...current]);
        return person;
      },
      updatePerson: (id, input) => {
        setPeople((current) =>
          current.map((person) =>
            person.id === id
              ? {
                  ...person,
                  ...(input.name !== undefined ? { name: input.name.trim() } : null),
                  ...(input.phone !== undefined ? { phone: input.phone.trim() } : null),
                  updatedAt: nowIso(),
                }
              : person,
          ),
        );
      },
      deletePerson: (id) => {
        setPeople((current) => current.filter((person) => person.id !== id));
        setEntries((current) => current.filter((entry) => entry.personId !== id));
      },
      addEntry: (input) => {
        const timestamp = nowIso();
        const entry: Entry = {
          id: makeId('ent'),
          personId: input.personId,
          type: input.type,
          amount: input.amount,
          method: input.method ?? null,
          note: input.note?.trim() ?? '',
          date: input.date ?? todayKey(),
          createdAt: timestamp,
        };
        setEntries((current) => [...current, entry]);
        touchPerson(input.personId, timestamp);
        return entry;
      },
      updateEntry: (id, input) => {
        let personId: string | null = null;
        setEntries((current) =>
          current.map((entry) => {
            if (entry.id !== id) return entry;
            personId = entry.personId;
            return {
              ...entry,
              ...(input.type !== undefined ? { type: input.type } : null),
              ...(input.amount !== undefined ? { amount: input.amount } : null),
              ...(input.method !== undefined ? { method: input.method } : null),
              ...(input.note !== undefined ? { note: input.note.trim() } : null),
              ...(input.date !== undefined ? { date: input.date } : null),
            };
          }),
        );
        if (personId) touchPerson(personId, nowIso());
      },
      deleteEntry: (id) => {
        let personId: string | null = null;
        setEntries((current) =>
          current.filter((entry) => {
            if (entry.id === id) {
              personId = entry.personId;
              return false;
            }
            return true;
          }),
        );
        if (personId) touchPerson(personId, nowIso());
      },
      replaceData: (data) => {
        setPeople(data.people);
        setEntries(data.entries);
      },
    };
  }, [entries, hydrated, people]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

export function usePersonSummary(personId: string | undefined) {
  const { people, entries } = useStore();
  return useMemo(() => {
    const person = people.find((item) => item.id === personId);
    if (!person) return null;
    return { person, entries: entries.filter((entry) => entry.personId === person.id) };
  }, [entries, people, personId]);
}
