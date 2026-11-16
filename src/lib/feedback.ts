import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Mirrors the "Haptic feedback" setting so callers don't need to thread the
 * preference through every tap handler. Synced by the settings provider.
 */
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

function canVibrate() {
  return hapticsEnabled && Platform.OS !== 'web';
}

export function tapFeedback() {
  if (!canVibrate()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function successFeedback() {
  if (!canVibrate()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warningFeedback() {
  if (!canVibrate()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
