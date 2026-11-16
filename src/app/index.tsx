import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { KpiStrip } from '@/components/KpiStrip';
import { Wordmark } from '@/components/Logo';
import { Button, Fab, IconButton, Pill } from '@/components/ui';
import { tapFeedback } from '@/lib/feedback';
import {
  formatHeaderDate,
  formatMoney,
  summarizePerson,
} from '@/lib/format';
import { useStore } from '@/lib/store';
import {
  fonts,
  Palette,
  radius,
  shadowSoft,
  useTheme,
  useThemedStyles,
} from '@/lib/theme';
import { Entry, PersonSummary } from '@/lib/types';

export default function HomeScreen() {
  const { people, entries } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, density, peopleSort, setPeopleSort } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { summaries, toReceive, toGive, receiveCount, giveCount } = useMemo(() => {
    const byPerson = new Map<string, Entry[]>();
    for (const entry of entries) {
      const list = byPerson.get(entry.personId);
      if (list) list.push(entry);
      else byPerson.set(entry.personId, [entry]);
    }

    const items = people.map((person) => summarizePerson(person, byPerson.get(person.id) ?? []));
    items.sort((a, b) => {
      const diff = a.person.createdAt.localeCompare(b.person.createdAt);
      if (diff !== 0) return peopleSort === 'newest' ? -diff : diff;
      return a.person.name.localeCompare(b.person.name);
    });

    let receivable = 0;
    let payable = 0;
    let receiving = 0;
    let giving = 0;
    for (const item of items) {
      if (item.balance > 0.004) {
        receivable += item.balance;
        receiving += 1;
      } else if (item.balance < -0.004) {
        payable += -item.balance;
        giving += 1;
      }
    }

    return {
      summaries: items,
      toReceive: receivable,
      toGive: payable,
      receiveCount: receiving,
      giveCount: giving,
    };
  }, [entries, people, peopleSort]);

  const today = new Date();
  const hasPeople = summaries.length > 0;

  return (
    <AppScreen>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: density.pagePadding, paddingBottom: insets.bottom + 126 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topbar}>
            <Wordmark />
            <View style={styles.topbarRight}>
              <View style={styles.localBadge}>
                <MaterialIcons name="lock-outline" size={12} color={colors.inkMuted} />
                <AppText style={styles.localText}>Local only</AppText>
              </View>
              <IconButton
                name="settings"
                label="Open settings"
                onPress={() => router.push('/settings')}
                size={38}
                iconSize={19}
              />
            </View>
          </View>

          <View style={[styles.hero, { marginTop: density.heroTop }]}>
            <AppText style={styles.eyebrow}>{formatHeaderDate(today).toUpperCase()}</AppText>
            <AppText variant="display">Your ledger</AppText>
            <AppText style={styles.heroSub}>
              Everything you owe, and everyone who owes you.
            </AppText>
          </View>

          <KpiStrip
            style={{ marginTop: density.heroTop > 20 ? 22 : 16 }}
            items={[
              {
                tone: 'green',
                label: 'To receive',
                amount: toReceive,
                icon: 'south-west',
                caption:
                  receiveCount > 0
                    ? `From ${receiveCount} ${receiveCount === 1 ? 'person' : 'people'}`
                    : 'Nothing pending',
              },
              {
                tone: 'red',
                label: 'To give',
                amount: toGive,
                icon: 'north-east',
                caption:
                  giveCount > 0
                    ? `To ${giveCount} ${giveCount === 1 ? 'person' : 'people'}`
                    : 'Nothing pending',
              },
            ]}
          />

          <View style={[styles.sectionHeader, { marginTop: density.sectionGap }]}>
            <View style={styles.sectionTitleWrap}>
              <AppText style={styles.sectionTitle}>People</AppText>
              <View style={styles.countBadge}>
                <AppText style={styles.countText}>{summaries.length}</AppText>
              </View>
            </View>
            {hasPeople ? (
              <View style={styles.sectionActions}>
                <Pressable
                  onPress={() => {
                    setPeopleSort(peopleSort === 'newest' ? 'oldest' : 'newest');
                    tapFeedback();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort people ${
                    peopleSort === 'newest' ? 'oldest first' : 'newest first'
                  }. Currently ${
                    peopleSort === 'newest' ? 'newest first' : 'oldest first'
                  }.`}
                  style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
                >
                  <MaterialIcons
                    name={peopleSort === 'newest' ? 'arrow-downward' : 'arrow-upward'}
                    size={14}
                    color={colors.inkMuted}
                  />
                  <AppText style={styles.sortText}>
                    {peopleSort === 'newest' ? 'Newest' : 'Oldest'}
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/new-person')}
                  accessibilityRole="button"
                  accessibilityLabel="Add a person"
                  style={({ pressed }) => [styles.addSmall, pressed && styles.pressed]}
                >
                  <MaterialIcons name="add" size={16} color={colors.blueDeep} />
                  <AppText style={styles.addSmallText}>Add</AppText>
                </Pressable>
              </View>
            ) : null}
          </View>

          {hasPeople ? (
            <View style={[styles.peopleList, { gap: density.listGap }]}>
              {summaries.map((summary) => (
                <PersonCard key={summary.person.id} summary={summary} />
              ))}
            </View>
          ) : (
            <EmptyLedger onAdd={() => router.push('/new-person')} />
          )}
        </ScrollView>

        <Fab
          label="Add person"
          onPress={() => router.push('/new-person')}
          bottom={insets.bottom + 22}
        />
      </View>
    </AppScreen>
  );
}

function PersonCard({ summary }: { summary: PersonSummary }) {
  const { person, balance, entryCount } = summary;
  const { colors, density } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isReceive = balance > 0.004;
  const isPay = balance < -0.004;
  const tone = isReceive ? colors.green : isPay ? colors.red : colors.inkMuted;
  const status = isReceive ? "You'll receive" : isPay ? "You'll give" : 'Settled';

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/person/[id]', params: { id: person.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`Open account for ${person.name}`}
      style={({ pressed }) => [
        styles.personCard,
        { paddingVertical: density.cardPaddingY },
        pressed && styles.cardPressed,
      ]}
    >
      <Avatar name={person.name} size={46} />
      <View style={styles.personBody}>
        <AppText style={styles.personName} numberOfLines={1}>
          {person.name}
        </AppText>
        <AppText style={styles.personMeta} numberOfLines={1}>
          {person.phone || (entryCount === 0 ? 'No entries yet' : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`)}
        </AppText>
      </View>
      <View style={styles.personRight}>
        <AppText style={[styles.personAmount, { color: tone }]} tabular>
          {formatMoney(balance)}
        </AppText>
        <AppText style={[styles.personStatus, { color: tone }]}>{status}</AppText>
      </View>
      <MaterialIcons name="chevron-right" size={19} color={colors.inkFaint} style={styles.chevron} />
    </Pressable>
  );
}

function EmptyLedger({ onAdd }: { onAdd: () => void }) {
  const { colors, resolved } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyArt}>
        <View style={[styles.emptyCircle, { backgroundColor: colors.surfaceMuted }]} />
        {resolved === 'light' ? (
          <LinearGradient
            colors={['#FFFFFF', '#EEF3FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyTile}
          >
            <MaterialIcons name="menu-book" size={31} color={colors.blueDeep} />
          </LinearGradient>
        ) : (
          <View style={[styles.emptyTile, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="menu-book" size={31} color={colors.blueDeep} />
          </View>
        )}
        <View style={styles.emptyPlus}>
          <MaterialIcons name="add" size={14} color={colors.bg} />
        </View>
      </View>
      <AppText style={styles.emptyTitle}>A fresh page</AppText>
      <AppText style={styles.emptyBody}>
        Add someone you lend to or borrow from. Every entry, balance and statement stays in this
        ledger.
      </AppText>
      <Button label="Add your first person" icon="person-add-alt-1" onPress={onAdd} variant="tonal" />
      <View style={styles.emptyHint}>
        <Pill icon="lock-outline" label="No sign-up · saved on device" />
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    content: {
      paddingTop: 8,
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    topbarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    localBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 28,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    localText: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.inkMuted,
      letterSpacing: 0.1,
    },
    hero: {
      marginTop: 28,
    },
    eyebrow: {
      fontFamily: fonts.medium,
      fontSize: 10,
      letterSpacing: 1.3,
      color: colors.inkFaint,
    },
    heroSub: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 20,
      color: colors.inkMuted,
      marginTop: 6,
      maxWidth: 330,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 19,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    countBadge: {
      minWidth: 23,
      height: 23,
      paddingHorizontal: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.inkMuted,
    },
    addSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 32,
      paddingLeft: 8,
      paddingRight: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.blueSoft,
    },
    sectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    sortText: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      letterSpacing: -0.1,
      color: colors.inkMuted,
    },
    addSmallText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.blueDeep,
    },
    peopleList: {
      gap: 9,
    },
    personCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      paddingLeft: 13,
      paddingRight: 11,
      ...shadowSoft,
    },
    cardPressed: {
      backgroundColor: colors.pressed,
      transform: [{ scale: 0.994 }],
    },
    personBody: {
      flex: 1,
      gap: 3,
    },
    personName: {
      fontFamily: fonts.medium,
      fontSize: 15,
      letterSpacing: -0.15,
      color: colors.ink,
    },
    personMeta: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      color: colors.inkMuted,
    },
    personRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    personAmount: {
      fontFamily: fonts.bold,
      fontSize: 15,
      letterSpacing: -0.35,
    },
    personStatus: {
      fontFamily: fonts.medium,
      fontSize: 9.5,
      opacity: 0.9,
    },
    chevron: {
      marginLeft: 2,
      marginTop: 1,
    },
    empty: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.xxl,
      padding: 26,
      alignItems: 'center',
      ...shadowSoft,
    },
    emptyArt: {
      width: 104,
      height: 104,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyCircle: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surfaceMuted,
    },
    emptyTile: {
      width: 68,
      height: 68,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '-6deg' }],
      ...shadowSoft,
    },
    emptyPlus: {
      position: 'absolute',
      right: 8,
      bottom: 12,
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: colors.ink,
      borderWidth: 3,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: fonts.bold,
      fontSize: 20,
      letterSpacing: -0.4,
      color: colors.ink,
      marginTop: 4,
    },
    emptyBody: {
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.inkMuted,
      textAlign: 'center',
      maxWidth: 300,
      marginTop: 6,
      marginBottom: 18,
    },
    emptyHint: {
      marginTop: 16,
      alignItems: 'center',
    },
    pressed: {
      opacity: 0.68,
    },
  });
