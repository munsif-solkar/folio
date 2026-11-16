import { useMemo } from 'react';

import { useTheme } from './theme';

/** User-facing wording for an entry direction. */
export type LedgerTerms = {
  /** Full label for an outgoing entry ("You gave" / "Debit"). */
  gave: string;
  /** Full label for an incoming entry ("You received" / "Credit"). */
  received: string;
  /** Plural chip labels used by filters. */
  gavePlural: string;
  receivedPlural: string;
  /** Lowercase nouns used mid-sentence. */
  gaveNoun: string;
  receivedNoun: string;
  /** Sentence used when an account has no entries. */
  recordHint: string;
  /** Table headers used in statements. */
  gaveHeader: string;
  receivedHeader: string;
};

const SIMPLE: LedgerTerms = {
  gave: 'You gave',
  received: 'You received',
  gavePlural: 'Given',
  receivedPlural: 'Received',
  gaveNoun: 'given',
  receivedNoun: 'received',
  recordHint: 'Record money you gave or received. The running balance updates with every line.',
  gaveHeader: 'You gave',
  receivedHeader: 'You received',
};

const CREDIT: LedgerTerms = {
  gave: 'Debit',
  received: 'Credit',
  gavePlural: 'Debits',
  receivedPlural: 'Credits',
  gaveNoun: 'debit',
  receivedNoun: 'credit',
  recordHint: 'Record money debited or credited. The running balance updates with every line.',
  gaveHeader: 'Debit',
  receivedHeader: 'Credit',
};

export function ledgerTerms(creditTerms: boolean): LedgerTerms {
  return creditTerms ? CREDIT : SIMPLE;
}

/** Reads the terminology preference from settings. */
export function useTerms(): LedgerTerms {
  const { creditTerms } = useTheme();
  return useMemo(() => ledgerTerms(creditTerms), [creditTerms]);
}
