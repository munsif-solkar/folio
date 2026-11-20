import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type AppUpdatePhase = 'hidden' | 'available' | 'downloading' | 'error';

export type AppUpdateState = {
  phase: AppUpdatePhase;
  check: () => Promise<void>;
  install: () => Promise<void>;
};

/**
 * Checks for EAS updates on launch and whenever the app is foregrounded.
 * `useUpdates()` also observes updates that were downloaded automatically.
 */
export function useAppUpdates(): AppUpdateState {
  const { isUpdateAvailable, isUpdatePending, isDownloading, isRestarting } = Updates.useUpdates();
  const [manualAvailable, setManualAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);
  const checking = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const check = useCallback(async () => {
    // The full Updates API is only available in release builds with expo-updates enabled.
    if (__DEV__ || !Updates.isEnabled || checking.current) return;
    checking.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable && mounted.current) setManualAvailable(true);
    } catch {
      // Offline or rate-limited checks stay silent; the app keeps working normally.
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    // expo-updates already performs a startup check; recheck when the app returns.
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const available = manualAvailable || isUpdateAvailable || isUpdatePending;
  const busy = installing || isDownloading || isRestarting;
  const phase: AppUpdatePhase = installError
    ? 'error'
    : busy
      ? 'downloading'
      : available
        ? 'available'
        : 'hidden';

  const install = useCallback(async () => {
    if (busy) return;
    setInstallError(false);
    setInstalling(true);
    try {
      if (!isUpdatePending) await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      console.warn('[updates] install failed', error);
      setInstalling(false);
      setInstallError(true);
    }
  }, [busy, isUpdatePending]);

  return { phase, check, install };
}
