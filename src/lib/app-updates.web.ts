export type AppUpdatePhase = 'hidden' | 'available' | 'downloading' | 'error';

export type AppUpdateState = {
  phase: AppUpdatePhase;
  check: () => Promise<void>;
  install: () => Promise<void>;
};

const noop = async () => {};

/** The Updates API is native-only; the web app never shows an update banner. */
export function useAppUpdates(): AppUpdateState {
  return { phase: 'hidden', check: noop, install: noop };
}
