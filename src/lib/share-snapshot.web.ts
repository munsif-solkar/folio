import { RefObject } from 'react';
import { HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

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

  const dataUri = await captureRef(view as unknown as Parameters<typeof captureRef>[0], {
    format: 'png',
    result: 'data-uri',
    quality: 1,
  });

  const link = document.createElement('a');
  link.href = dataUri;
  link.download = snapshotFileName(person);
  document.body.appendChild(link);
  link.click();
  link.remove();

  return 'downloaded';
}
