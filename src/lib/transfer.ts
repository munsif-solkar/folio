import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportResult = 'shared' | 'downloaded' | 'saved';

/** Writes the backup to the cache and hands it to the system share sheet. */
export async function exportLedger(json: string, filename: string): Promise<ExportResult> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  await file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Save Folio backup',
      mimeType: 'application/json',
      UTI: 'public.json',
    });
    return 'shared';
  }

  return 'saved';
}

/** Opens the system picker and returns the raw file text, or null on cancel. */
export async function importLedgerFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset) return null;

  const file = new File(asset.uri);
  return file.text();
}
