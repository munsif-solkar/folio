import { MaterialIcons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { formatMoney } from '@/lib/format';
import { fonts, Palette, radius, useTheme, useThemedStyles } from '@/lib/theme';

type KpiIcon = 'south-west' | 'north-east';

export type KpiStripItem = {
  tone: 'green' | 'red';
  label: string;
  amount: number;
  icon: KpiIcon;
  caption?: string;
};

/** A single slim card that holds the to-receive / to-give totals. */
export function KpiStrip({
  items,
  style,
  fullBleed = true,
}: {
  items: KpiStripItem[];
  style?: StyleProp<ViewStyle>;
  fullBleed?: boolean;
}) {
  const { compact, density } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        fullBleed && {
          marginHorizontal: -density.pagePadding,
          borderRadius: 0,
          borderWidth: 0,
        },
        style,
      ]}
    >
      {items.map((item, index) => (
        <View key={item.label} style={styles.itemGroup}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <KpiItem {...item} compact={compact} fullBleed={fullBleed} />
        </View>
      ))}
    </View>
  );
}

function KpiItem({
  tone,
  label,
  amount,
  icon,
  caption,
  compact,
  fullBleed,
}: KpiStripItem & { compact: boolean; fullBleed: boolean }) {
  const { colors, density } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isGreen = tone === 'green';
  const accent = isGreen ? colors.green : colors.red;
  const iconBg = isGreen ? colors.greenSoft : colors.redSoft;
  const iconSize = compact ? 24 : 28;

  return (
    <View
      style={[
        styles.item,
        compact && styles.itemCompact,
        fullBleed && { paddingHorizontal: density.pagePadding },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 3,
            backgroundColor: iconBg,
          },
        ]}
      >
        <MaterialIcons name={icon} size={compact ? 13 : 14} color={accent} />
      </View>
      <View style={styles.body}>
        <AppText style={[styles.label, { color: accent }]} numberOfLines={1}>
          {label.toUpperCase()}
        </AppText>
        <AppText
          style={[styles.amount, { color: accent }, compact && styles.amountCompact]}
          tabular
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {formatMoney(amount)}
        </AppText>
        {caption ? (
          <AppText style={styles.caption} numberOfLines={1}>
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      paddingVertical: 10,
    },
    cardCompact: {
      paddingVertical: 7,
    },
    itemGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    item: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 13,
    },
    itemCompact: {
      gap: 8,
      paddingHorizontal: 11,
    },
    divider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.line,
      marginVertical: 1,
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    label: {
      fontFamily: fonts.bold,
      fontSize: 8.5,
      lineHeight: 12,
      letterSpacing: 0.7,
    },
    amount: {
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 23,
      letterSpacing: -0.55,
    },
    amountCompact: {
      fontSize: 17,
      lineHeight: 21,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 9.5,
      lineHeight: 13,
      color: colors.inkMuted,
    },
  });
