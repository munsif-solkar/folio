import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, useTheme } from '@/lib/theme';

export function LogoMark({ size = 34, light = false }: { size?: number; light?: boolean }) {
  const { colors } = useTheme();
  const markBg = light ? colors.white : colors.ink;
  const markFg = light ? colors.ink : colors.bg;
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: markBg,
        },
      ]}
    >
      <AppText
        style={{
          fontFamily: fonts.bold,
          fontSize: size * 0.52,
          lineHeight: size * 0.62,
          color: markFg,
          marginTop: -size * 0.04,
          marginLeft: size * 0.01,
        }}
      >
        F
      </AppText>
      <View
        style={[
          styles.dot,
          {
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
            right: size * 0.17,
            bottom: size * 0.17,
          },
        ]}
      />
    </View>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wordmark}>
      <LogoMark light={light} />
      <View>
        <AppText style={[styles.name, { color: light ? colors.white : colors.ink }]}>
          Folio
        </AppText>
        <AppText style={[styles.tagline, { color: light ? 'rgba(255,255,255,0.55)' : colors.inkFaint }]}>
          PERSONAL LEDGER
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#8CE0A8',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 8.5,
    letterSpacing: 1.2,
    marginTop: 1,
  },
});
