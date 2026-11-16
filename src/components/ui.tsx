import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts, Palette, radius, shadowFab, useTheme, useThemedStyles } from '@/lib/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

type IconButtonProps = {
  name: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
  loading?: boolean;
  tone?: 'surface' | 'ink' | 'primary' | 'ghost';
};

export function IconButton({
  name,
  onPress,
  label,
  size = 42,
  iconSize = 21,
  style,
  loading = false,
  tone = 'surface',
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tones = {
    surface: { background: colors.surface, border: colors.line, icon: colors.ink },
    ink: { background: colors.ink, border: colors.ink, icon: colors.bg },
    primary: { background: colors.blueSoft, border: colors.blueSoft, icon: colors.blueDeep },
    ghost: { background: 'transparent', border: 'transparent', icon: colors.ink },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tones.background,
          borderColor: tones.border,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tones.icon} />
      ) : (
        <MaterialIcons name={name} size={iconSize} color={tones.icon} />
      )}
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'tonal' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  compact = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const variants = {
    primary: {
      background: colors.blue,
      border: colors.blue,
      text: colors.white,
      icon: colors.white,
    },
    tonal: {
      background: colors.blueSoft,
      border: colors.blueSoft,
      text: colors.blueDeep,
      icon: colors.blueDeep,
    },
    outline: {
      background: colors.surface,
      border: colors.lineStrong,
      text: colors.ink,
      icon: colors.ink,
    },
    danger: {
      background: colors.redSoft,
      border: colors.redSoft,
      text: colors.red,
      icon: colors.red,
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: variants.background,
          borderColor: variants.border,
        },
        pressed && !disabled && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variants.text} />
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={19} color={variants.icon} /> : null}
          <AppText
            style={{
              fontFamily: fonts.medium,
              fontSize: compact ? 13.5 : 15.5,
              lineHeight: 20,
              color: variants.text,
              letterSpacing: -0.1,
            }}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export function Fab({
  label,
  onPress,
  icon = 'add',
  bottom = 24,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  bottom?: number;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
    >
      <MaterialIcons name={icon} size={23} color="#FFFFFF" />
      <AppText style={styles.fabLabel}>{label}</AppText>
    </Pressable>
  );
}

export function Pill({
  label,
  icon,
  tone = 'neutral',
  style,
}: {
  label: string;
  icon?: IconName;
  tone?: 'neutral' | 'green' | 'red' | 'blue';
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tones = {
    neutral: { bg: colors.surfaceMuted, fg: colors.inkMuted },
    green: { bg: colors.greenSoft, fg: colors.green },
    red: { bg: colors.redSoft, fg: colors.red },
    blue: { bg: colors.blueSoft, fg: colors.blueDeep },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: tones.bg }, style]}>
      {icon ? <MaterialIcons name={icon} size={12} color={tones.fg} /> : null}
      <AppText style={[styles.pillText, { color: tones.fg }]}>{label}</AppText>
    </View>
  );
}

export function SectionHeader({
  title,
  meta,
  action,
  right,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  right?: ReactNode;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
        {meta ? <AppText style={styles.sectionMeta}>{meta}</AppText> : null}
      </View>
      {right ?? action ?? null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    iconButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    pressed: {
      opacity: 0.66,
      transform: [{ scale: 0.96 }],
    },
    button: {
      height: 54,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 18,
    },
    buttonCompact: {
      height: 42,
      borderRadius: radius.pill,
      paddingHorizontal: 16,
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    buttonDisabled: {
      opacity: 0.42,
    },
    fab: {
      position: 'absolute',
      right: 20,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.blue,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingLeft: 17,
      paddingRight: 21,
      ...shadowFab,
    },
    fabPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    fabLabel: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: '#FFFFFF',
      letterSpacing: -0.1,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      height: 26,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    pillText: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      lineHeight: 15,
      letterSpacing: 0.1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 30,
      marginBottom: 13,
    },
    sectionTitleWrap: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 19,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    sectionMeta: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkFaint,
    },
  });
