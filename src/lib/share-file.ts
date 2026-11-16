import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** The native module only allows one share sheet at a time. */
const CONCURRENT_SHARE_PATTERN =
  /another share request is being processed|another item is being shared/i;

/**
 * Known Android race: the chooser opens, then the activity tears down while the
 * share intent is still being dispatched, surfacing as an NPE from the window.
 * The file has already been handed to the system at that point.
 */
const ANDROID_CHOOSER_RACE_PATTERN = /dispatchCancelPendingInputEvents/i;

let pendingShare: Promise<void> | null = null;

export type ShareFileOptions = {
  mimeType: string;
  UTI: string;
  dialogTitle: string;
};

/**
 * Opens the system share sheet for a local file, de-duplicating concurrent
 * requests so expo-sharing never rejects with "another share request".
 */
export function shareLocalFile(uri: string, options: ShareFileOptions): Promise<void> {
  if (pendingShare) return pendingShare;

  pendingShare = performShare(uri, options).finally(() => {
    pendingShare = null;
  });

  return pendingShare;
}

async function performShare(uri: string, options: ShareFileOptions): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  try {
    await Sharing.shareAsync(uri, options);
  } catch (error) {
    const message = describeError(error);

    // The chooser is already on screen (or a previous one is still open).
    if (
      CONCURRENT_SHARE_PATTERN.test(message) ||
      ANDROID_CHOOSER_RACE_PATTERN.test(message)
    ) {
      console.warn('[share] share sheet already handled this request:', message);
      return;
    }

    throw error;
  }
}

/** Gives a generated file a readable name like Folio-Aarav-Mehta-16-11-2026.pdf. */
export async function withFriendlyFileName(uri: string, fileName: string) {
  try {
    const source = new File(uri);
    const target = new File(Paths.cache, fileName);
    if (target.exists) target.delete();
    await source.move(target);
    return target.uri;
  } catch (error) {
    console.warn('[share] could not rename generated file:', describeError(error));
    return uri;
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return `${error.name}: ${error.message}${cause ? ` | ${String(cause)}` : ''}`;
  }
  return String(error);
}
