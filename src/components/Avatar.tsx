import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, tintFor, useTheme } from '@/lib/theme';

type Props = {
  name: string;
  size?: number;
  ring?: boolean;
};

export function Avatar({ name, size = 44, ring = false }: Props) {
  const { resolved, colors } = useTheme();
  const tint = tintFor(name || '?', resolved !== 'light');
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint.bg,
          borderWidth: ring ? 2 : 0,
          borderColor: colors.surface,
        },
      ]}
    >
      <AppText
        style={{
          fontFamily: fonts.bold,
          fontSize: size * 0.36,
          lineHeight: size * 0.46,
          color: tint.fg,
          letterSpacing: 0.1,
        }}
        maxFontSizeMultiplier={1.3}
      >
        {getInitials(name)}
      </AppText>
    </View>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
