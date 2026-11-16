import * as DocumentPicker from 'expo-document-picker';

export type ExportResult = 'shared' | 'downloaded' | 'saved';

/** Downloads the backup directly from the browser. */
export async function exportLedger(json: string, filename: string): Promise<ExportResult> {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return 'downloaded';
}

/** Opens the browser file picker and returns the raw file text, or null on cancel. */
export async function importLedgerFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    multiple: false,
  });

  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset) return null;

  if (asset.file) return asset.file.text();
  const response = await fetch(asset.uri);
  return response.text();
}
