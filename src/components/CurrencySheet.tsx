import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { IconButton } from '@/components/ui';
import { CURRENCIES } from '@/lib/currency';
import { tapFeedback } from '@/lib/feedback';
import { fonts, Palette, radius, useTheme, useThemedStyles } from '@/lib/theme';

export function CurrencySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, currency, setCurrency } = useTheme();
  const styles = useThemedStyles(createStyles);

  const choose = (code: (typeof CURRENCIES)[number]['code']) => {
    setCurrency(code);
    tapFeedback();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.84}>
      <View style={styles.header}>
        <View>
          <AppText variant="micro">CURRENCY</AppText>
          <AppText style={styles.headerTitle}>Display currency</AppText>
        </View>
        <IconButton name="close" label="Close currency picker" onPress={onClose} size={38} iconSize={20} />
      </View>

      <AppText style={styles.subtitle}>
        Every amount, balance, and shared statement uses this currency. Existing entries are not
        converted.
      </AppText>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {CURRENCIES.map((item, index) => {
            const active = currency === item.code;
            return (
              <View key={item.code}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  onPress={() => choose(item.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${item.name}, ${item.code}`}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={[styles.symbolBox, active && styles.symbolBoxActive]}>
                    <AppText style={[styles.symbol, active && styles.symbolActive]}>
                      {item.symbol}
                    </AppText>
                  </View>
                  <View style={styles.rowBody}>
                    <AppText style={styles.rowTitle}>{item.name}</AppText>
                    <AppText style={styles.rowCaption}>{item.code}</AppText>
                  </View>
                  {active ? (
                    <MaterialIcons name="check-circle" size={21} color={colors.blue} />
                  ) : (
                    <View style={styles.radio} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 2,
    },
    headerTitle: {
      fontFamily: fonts.bold,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.4,
      color: colors.ink,
      marginTop: 4,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.inkMuted,
      marginTop: 8,
      maxWidth: 360,
    },
    list: {
      marginTop: 16,
      flexGrow: 0,
    },
    listContent: {
      paddingBottom: 10,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 11,
      minHeight: 62,
    },
    rowPressed: {
      backgroundColor: colors.pressed,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginLeft: 61,
    },
    symbolBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    symbolBoxActive: {
      backgroundColor: colors.blueSoft,
    },
    symbol: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.inkMuted,
    },
    symbolActive: {
      color: colors.blueDeep,
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      fontFamily: fonts.medium,
      fontSize: 14.5,
      letterSpacing: -0.1,
      color: colors.ink,
    },
    rowCaption: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 15,
      color: colors.inkMuted,
    },
    radio: {
      width: 21,
      height: 21,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.lineStrong,
    },
  });
