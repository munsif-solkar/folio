import * as Print from 'expo-print';

import { shareLocalFile, withFriendlyFileName, describeError } from './share-file';
import { buildStatementHtml, statementFileName, StatementOptions } from './statement';
import { Entry, Person } from './types';

export type ShareResult = 'shared' | 'downloaded' | 'printed';

const SHARE_OPTIONS = {
  mimeType: 'application/pdf',
  UTI: 'com.adobe.pdf',
  dialogTitle: 'Share account statement',
} as const;

let pendingStatement: Promise<ShareResult> | null = null;

/**
 * Builds the account statement PDF and hands it to the system share sheet.
 * Repeated calls while a sheet is open reuse the in-flight request.
 */
export function shareStatement(
  person: Person,
  entries: Entry[],
  options: StatementOptions = {},
): Promise<ShareResult> {
  if (pendingStatement) return pendingStatement;

  pendingStatement = createAndShareStatement(person, entries, options).finally(() => {
    pendingStatement = null;
  });

  return pendingStatement;
}

async function createAndShareStatement(
  person: Person,
  entries: Entry[],
  options: StatementOptions,
): Promise<ShareResult> {
  const html = buildStatementHtml(person, entries, new Date(), options);
  const { uri: printedUri } = await Print.printToFileAsync({ html, base64: false });
  const uri = await withFriendlyFileName(printedUri, statementFileName(person));

  try {
    await shareLocalFile(uri, SHARE_OPTIONS);
    return 'shared';
  } catch (error) {
    console.warn(
      '[statement] sharing failed, opening the print dialog instead:',
      describeError(error),
    );
    await Print.printAsync({ uri });
    return 'printed';
  }
}
