import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import {
  addDays,
  formatMonthYear,
  fromDateKey,
  monthShort,
  toDateKey,
  todayKey,
} from '@/lib/format';
import { fonts, Palette, radius, useTheme, useThemedStyles } from '@/lib/theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  value: string;
  onChange: (dateKey: string) => void;
};

export function MiniCalendar({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const initial = fromDateKey(value);
  const [view, setView] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const today = todayKey();
  const selected = value;

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const offset = first.getDay();
    const items: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push(toDateKey(new Date(view.getFullYear(), view.getMonth(), day)));
    }
    while (items.length % 7 !== 0) items.push(null);
    return items;
  }, [view]);

  const goMonth = (delta: number) => {
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setView(new Date(now.getFullYear(), now.getMonth(), 1));
    onChange(todayKey(now));
  };

  const goYesterday = () => {
    const date = addDays(new Date(), -1);
    setView(new Date(date.getFullYear(), date.getMonth(), 1));
    onChange(toDateKey(date));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.quickRow}>
        <QuickChip label="Today" onPress={goToday} active={selected === today} />
        <QuickChip
          label="Yesterday"
          onPress={goYesterday}
          active={selected === todayKey(addDays(new Date(), -1))}
        />
        <View style={styles.quickSpacer} />
        <AppText style={styles.selectedLabel}>{formatSelected(selected)}</AppText>
      </View>

      <View style={styles.header}>
        <AppText style={styles.month}>{formatMonthYear(view)}</AppText>
        <View style={styles.nav}>
          <Pressable
            onPress={() => goMonth(-1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <MaterialIcons name="chevron-left" size={20} color={colors.inkSoft} />
          </Pressable>
          <Pressable
            onPress={() => goMonth(1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <MaterialIcons name="chevron-right" size={20} color={colors.inkSoft} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <AppText style={styles.weekday}>{label}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, index) => {
          if (!key) return <View key={`empty-${index}`} style={styles.cell} />;
          const isSelected = key === selected;
          const isToday = key === today;
          const isFuture = key > today;
          const date = fromDateKey(key);
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                onPress={() => onChange(key)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityLabel={`${date.getDate()} ${monthShort(date.getMonth())}`}
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                style={[
                  styles.day,
                  isToday && !isSelected && styles.today,
                  isSelected && styles.selectedDay,
                  isFuture && styles.futureDay,
                ]}
              >
                <AppText
                  style={[
                    styles.dayText,
                    isToday && !isSelected && styles.todayText,
                    isSelected && styles.selectedText,
                    isFuture && styles.futureText,
                  ]}
                >
                  {date.getDate()}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function QuickChip({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.quickChip, active && styles.quickChipActive]}
    >
      <AppText style={[styles.quickChipText, active && styles.quickChipTextActive]}>{label}</AppText>
    </Pressable>
  );
}

function formatSelected(key: string) {
  const date = fromDateKey(key);
  return `${date.getDate()} ${monthShort(date.getMonth())} ${date.getFullYear()}`;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      padding: 14,
      marginTop: 10,
    },
    quickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
    },
    quickChip: {
      height: 30,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    quickChipActive: {
      backgroundColor: colors.blueSoft,
    },
    quickChipText: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      color: colors.inkMuted,
    },
    quickChipTextActive: {
      color: colors.blueDeep,
    },
    quickSpacer: {
      flex: 1,
    },
    selectedLabel: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      color: colors.inkFaint,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    month: {
      fontFamily: fonts.bold,
      fontSize: 14.5,
      color: colors.ink,
      letterSpacing: -0.2,
    },
    nav: {
      flexDirection: 'row',
      gap: 4,
    },
    navButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    weekday: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.inkFaint,
      textTransform: 'uppercase',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
    },
    day: {
      width: '100%',
      height: '100%',
      maxWidth: 38,
      maxHeight: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.inkSoft,
    },
    today: {
      borderWidth: 1,
      borderColor: colors.lineStrong,
    },
    todayText: {
      color: colors.ink,
      fontFamily: fonts.bold,
    },
    selectedDay: {
      backgroundColor: colors.ink,
    },
    selectedText: {
      color: colors.bg,
      fontFamily: fonts.bold,
    },
    futureDay: {
      opacity: 0.34,
    },
    futureText: {
      color: colors.inkFaint,
    },
  });
