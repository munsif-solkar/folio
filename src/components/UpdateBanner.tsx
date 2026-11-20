import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useAppUpdates } from '@/lib/app-updates';
import { tapFeedback } from '@/lib/feedback';
import { fonts, Palette, radius, shadowSoft, useTheme, useThemedStyles } from '@/lib/theme';

export function UpdateBanner() {
  const { colors } = useTheme();
  const { phase, install } = useAppUpdates();
  const styles = useThemedStyles(createStyles);

  if (phase === 'hidden') return null;

  const busy = phase === 'downloading';
  const failed = phase === 'error';

  return (
    <View style={styles.card}>
      <View style={[styles.icon, failed && styles.iconError]}>
        <MaterialIcons
          name={failed ? 'error-outline' : 'system-update'}
          size={18}
          color={failed ? colors.redDeep : colors.greenDeep}
        />
      </View>
      <View style={styles.body}>
        <AppText style={styles.title}>
          {failed ? "Couldn't install update" : busy ? 'Installing update' : 'Update available'}
        </AppText>
        <AppText style={styles.caption} numberOfLines={2}>
          {failed
            ? 'Check your connection and try again.'
            : busy
              ? 'Downloading and restarting Folio…'
              : 'A newer Folio is ready. Tap to download and install.'}
        </AppText>
      </View>
      <Pressable
        onPress={() => {
          tapFeedback();
          install();
        }}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={failed ? 'Retry update' : 'Install update'}
        style={({ pressed }) => [styles.button, pressed && !busy && styles.buttonPressed]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.bg} />
        ) : (
          <AppText style={styles.buttonText}>{failed ? 'Retry' : 'Update'}</AppText>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.greenLine,
      borderRadius: radius.lg,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginTop: 14,
      ...shadowSoft,
    },
    icon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconError: {
      backgroundColor: colors.redSoft,
      borderWidth: 1,
      borderColor: colors.redLine,
    },
    body: { flex: 1, gap: 2 },
    title: {
      fontFamily: fonts.bold,
      fontSize: 13.5,
      letterSpacing: -0.2,
      color: colors.ink,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      lineHeight: 14,
      color: colors.inkMuted,
    },
    button: {
      minWidth: 62,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    buttonPressed: { opacity: 0.72 },
    buttonText: {
      fontFamily: fonts.bold,
      fontSize: 11.5,
      color: colors.bg,
    },
  });
