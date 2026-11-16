import { RefObject } from 'react';
import { HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { SNAPSHOT_HEIGHT, SNAPSHOT_WIDTH } from '@/components/AccountSnapshot';
import { shareLocalFile, withFriendlyFileName } from './share-file';
import { snapshotFileName } from './statement';
import { Person } from './types';

export type SnapshotResult = 'shared' | 'downloaded';

export async function shareSnapshot(
  view: RefObject<HostInstance | null>,
  person: Person,
): Promise<SnapshotResult> {
  if (!view.current) {
    throw new Error('The snapshot is not ready yet');
  }

  const rawUri = await captureRef(view as unknown as Parameters<typeof captureRef>[0], {
    format: 'png',
    result: 'tmpfile',
    width: SNAPSHOT_WIDTH * 3,
    height: SNAPSHOT_HEIGHT * 3,
    quality: 1,
    // iOS: render the layer directly so the off-screen view is captured too.
    useRenderInContext: true,
  });

  const uri = await withFriendlyFileName(rawUri, snapshotFileName(person));

  await shareLocalFile(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: `Share ${person.name}'s snapshot`,
  });

  return 'shared';
}
