import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { EntryFormSheet } from '@/components/EntryFormSheet';
import { KpiStrip } from '@/components/KpiStrip';
import { ShareAccountSheet } from '@/components/ShareAccountSheet';
import { useToast } from '@/components/Toast';
import { Button, Fab, IconButton } from '@/components/ui';
import {
  formatBalance,
  formatDayLabel,
  formatMoney,
  formatShortDate,
  groupByDate,
  summarizePerson,
  toDateKey,
  withBalance,
} from '@/lib/format';
import { useStore } from '@/lib/store';
import { useTerms } from '@/lib/terms';
import { fonts, Palette, radius, shadowSoft, useTheme, useThemedStyles } from '@/lib/theme';
import { Entry, EntryWithBalance, Person } from '@/lib/types';

type Filter = 'all' | 'gave' | 'received';

export default function AccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, entries, deletePerson } = useStore();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { colors, density } = useTheme();
  const terms = useTerms();
  const styles = useThemedStyles(createStyles);

  const person = people.find((item) => item.id === id);
  const personEntries = useMemo(
    () => entries.filter((entry) => entry.personId === id),
    [entries, id],
  );
  const summary = person ? summarizePerson(person, personEntries) : null;
  const withBalances = useMemo(() => withBalance(personEntries), [personEntries]);

  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const toReceive = summary ? Math.max(summary.balance, 0) : 0;
  const toGive = summary ? Math.max(-summary.balance, 0) : 0;

  const visibleEntries = useMemo(
    () =>
      withBalances.filter((entry) =>
        filter === 'all' ? true : filter === 'gave' ? entry.type === 'gave' : entry.type === 'received',
      ),
    [filter, withBalances],
  );
  const groups = useMemo(() => groupByDate(visibleEntries), [visibleEntries]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleDeleteAccount = () => {
    if (!person) return;
    setMenuVisible(false);
    deletePerson(person.id);
    showToast('Account deleted');
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setFormVisible(true);
  };

  const openEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setFormVisible(true);
  };

  if (!person || !summary) {
    return (
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.topbar, { paddingHorizontal: density.pagePadding }]}>
          <IconButton name="arrow-back" label="Go back" onPress={goBack} />
        </View>
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <MaterialIcons name="person-off" size={28} color={colors.inkMuted} />
          </View>
          <AppText variant="title">Account not found</AppText>
          <AppText style={styles.notFoundBody}>
            This account may have been deleted from this device.
          </AppText>
          <Button label="Back to ledger" variant="tonal" onPress={() => router.replace('/')} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.root}>
        <View style={[styles.topbar, { paddingHorizontal: density.pagePadding }]}>
          <IconButton name="arrow-back" label="Go back" onPress={goBack} />

          <View style={styles.topbarActions}>
            <Pressable
              onPress={() => setShareVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Share this account"
              style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="share" size={17} color={colors.ink} />
              <AppText style={styles.shareLabel}>Share</AppText>
            </Pressable>
            <IconButton
              name="more-horiz"
              label="Account options"
              onPress={() => setMenuVisible(true)}
              size={42}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: density.pagePadding, paddingBottom: insets.bottom + 128 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profile}>
            <Avatar name={person.name} size={64} />
            <View style={styles.profileBody}>
              <AppText variant="title" numberOfLines={2} style={styles.profileName}>
                {person.name}
              </AppText>
              <View style={styles.metaRow}>
                <MaterialIcons name="call" size={11} color={colors.inkFaint} />
                <AppText style={styles.metaText}>
                  {person.phone || 'No contact number'}
                </AppText>
                <View style={styles.metaDot} />
                <AppText style={styles.metaText}>
                  {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'}
                </AppText>
              </View>
              <AppText style={styles.sinceText}>
                On the books since {formatShortDate(toDateKey(new Date(person.createdAt)))}
              </AppText>
            </View>
          </View>

          <KpiStrip
            items={[
              {
                tone: 'green',
                label: 'To receive',
                amount: toReceive,
                icon: 'south-west',
                caption: toReceive > 0 ? 'In your favour' : 'Nothing pending',
              },
              {
                tone: 'red',
                label: 'To give',
                amount: toGive,
                icon: 'north-east',
                caption: toGive > 0 ? 'You owe this' : 'Nothing pending',
              },
            ]}
          />

          <View style={[styles.sectionHeader, { marginTop: density.sectionGap }]}>
            <View>
              <View style={styles.sectionTitleRow}>
                <AppText style={styles.sectionTitle}>Entries</AppText>
                <View style={styles.countBadge}>
                  <AppText style={styles.countText}>{summary.entryCount}</AppText>
                </View>
              </View>
              <AppText style={styles.sectionCaption}>Balance shown after every entry</AppText>
            </View>
            <View style={styles.totals}>
              <AppText style={styles.totalGave}>− {formatMoney(summary.gave)}</AppText>
              <AppText style={styles.totalReceived}>+ {formatMoney(summary.received)}</AppText>
            </View>
          </View>

          {withBalances.length > 0 ? (
            <View style={styles.filterRow}>
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'gave', label: terms.gavePlural },
                  { key: 'received', label: terms.receivedPlural },
                ] as { key: Filter; label: string }[]
              ).map((option) => {
                const active = filter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setFilter(option.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <AppText style={[styles.filterText, active && styles.filterTextActive]}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {withBalances.length === 0 ? (
            <View style={styles.emptyEntries}>
              <View style={styles.emptyEntriesIcon}>
                <MaterialIcons name="receipt-long" size={27} color={colors.blueDeep} />
              </View>
              <AppText style={styles.emptyEntriesTitle}>No entries yet</AppText>
              <AppText style={styles.emptyEntriesBody}>{terms.recordHint}</AppText>
              <Button
                label="Add first entry"
                icon="add"
                variant="tonal"
                onPress={openNewEntry}
                compact
              />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.filterEmpty}>
              <AppText style={styles.filterEmptyText}>
                No {filter === 'gave' ? terms.gaveNoun : terms.receivedNoun} entries in this
                account.
              </AppText>
            </View>
          ) : (
            <View style={styles.groups}>
              {groups.map((group) => (
                <View key={group.key}>
                  <View style={styles.dayHeader}>
                    <AppText style={styles.dayLabel}>{formatDayLabel(group.key)}</AppText>
                    <View style={styles.dayLine} />
                    <AppText style={styles.dayCount}>
                      {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                    </AppText>
                  </View>
                  <View style={styles.entriesCard}>
                    {group.entries.map((entry, index) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        last={index === group.entries.length - 1}
                        onPress={() => openEntry(entry)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Fab
          label="Add entry"
          onPress={openNewEntry}
          bottom={insets.bottom + 22}
        />

        <EntryFormSheet
          visible={formVisible}
          onClose={() => setFormVisible(false)}
          person={person}
          entry={editingEntry}
        />

        <AccountMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          person={person}
          entryCount={summary.entryCount}
          onEdit={() => {
            setMenuVisible(false);
            router.push({ pathname: '/new-person', params: { id: person.id } });
          }}
          onShare={() => {
            setMenuVisible(false);
            setTimeout(() => {
              setShareVisible(true);
            }, 250);
          }}
          onDelete={handleDeleteAccount}
        />

        <ShareAccountSheet
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          person={person}
          entries={personEntries}
          summary={summary}
        />
      </View>
    </AppScreen>
  );
}

function EntryRow({
  entry,
  last,
  onPress,
}: {
  entry: EntryWithBalance;
  last: boolean;
  onPress: () => void;
}) {
  const { colors, density } = useTheme();
  const terms = useTerms();
  const styles = useThemedStyles(createStyles);
  const gave = entry.type === 'gave';
  const tone = gave ? colors.red : colors.green;
  const details = [entry.method, entry.note].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${gave ? terms.gave : terms.received} ${formatMoney(entry.amount)}. Balance ${formatBalance(entry.balance)}. Tap to edit.`}
      style={({ pressed }) => [
        styles.entryRow,
        { minHeight: density.entryRowMinHeight },
        !last && styles.entryDivider,
        pressed && styles.entryPressed,
      ]}
    >
      <View style={[styles.entryIcon, { backgroundColor: gave ? colors.redSoft : colors.greenSoft }]}>
        <MaterialIcons
          name={gave ? 'north-east' : 'south-west'}
          size={16}
          color={tone}
        />
      </View>
      <View style={styles.entryBody}>
        <AppText style={styles.entryTitle}>{gave ? terms.gave : terms.received}</AppText>
        <AppText style={styles.entryDetails} numberOfLines={1}>
          {details || 'No details added'}
        </AppText>
      </View>
      <View style={styles.entryRight}>
        <AppText style={[styles.entryAmount, { color: tone }]} tabular>
          {formatMoney(entry.amount)}
        </AppText>
        <AppText style={styles.entryBalance} tabular>
          Bal {formatBalance(entry.balance)}
        </AppText>
      </View>
    </Pressable>
  );
}

function AccountMenu({
  visible,
  onClose,
  person,
  entryCount,
  onEdit,
  onShare,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  person: Person;
  entryCount: number;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} maxHeightRatio={0.78}>
      <View style={styles.menuHeader}>
        <AppText variant="micro">ACCOUNT OPTIONS</AppText>
        <IconButton name="close" label="Close" onPress={close} size={38} iconSize={20} />
      </View>

      <View style={styles.menuPerson}>
        <Avatar name={person.name} size={46} />
        <View style={styles.menuPersonBody}>
          <AppText style={styles.menuPersonName} numberOfLines={1}>
            {person.name}
          </AppText>
          <AppText style={styles.menuPersonMeta}>
            {person.phone || 'No contact number'} · {entryCount}{' '}
            {entryCount === 1 ? 'entry' : 'entries'}
          </AppText>
        </View>
      </View>

      {confirmDelete ? (
        <View style={styles.deleteCard}>
          <View style={styles.deleteTitleRow}>
            <MaterialIcons name="delete-forever" size={19} color={colors.red} />
            <AppText style={styles.deleteTitle}>Delete this account?</AppText>
          </View>
          <AppText style={styles.deleteBody}>
            {person.name} and all {entryCount} {entryCount === 1 ? 'entry' : 'entries'} will be
            removed from this device. This can’t be undone.
          </AppText>
          <View style={styles.deleteActions}>
            <Button
              label="Cancel"
              variant="outline"
              compact
              style={styles.deleteAction}
              onPress={() => setConfirmDelete(false)}
            />
            <Button
              label="Delete account"
              variant="danger"
              compact
              style={styles.deleteAction}
              onPress={onDelete}
            />
          </View>
        </View>
      ) : (
        <View style={styles.menuList}>
          <MenuRow
            icon="edit"
            title="Edit account"
            caption="Update name and contact number"
            onPress={onEdit}
          />
          <MenuRow
            icon="share"
            title="Share account"
            caption="Send a snapshot or the full statement"
            onPress={onShare}
          />
          <MenuRow
            icon="delete-outline"
            title="Delete account"
            caption="Remove this account and its entries"
            danger
            onPress={() => setConfirmDelete(true)}
          />
        </View>
      )}

      <View style={styles.menuNote}>
        <MaterialIcons name="lock-outline" size={13} color={colors.inkFaint} />
        <AppText style={styles.menuNoteText}>
          This ledger lives only on this device. No cloud, no sign-in.
        </AppText>
      </View>
    </BottomSheet>
  );
}

function MenuRow({
  icon,
  title,
  caption,
  onPress,
  danger = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  caption: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tone = danger ? colors.red : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: danger ? colors.redSoft : colors.surfaceMuted },
        ]}
      >
        <MaterialIcons name={icon} size={19} color={tone} />
      </View>
      <View style={styles.menuRowBody}>
        <AppText style={[styles.menuRowTitle, { color: tone }]}>{title}</AppText>
        <AppText style={styles.menuRowCaption}>{caption}</AppText>
      </View>
      <MaterialIcons name="chevron-right" size={19} color={colors.inkFaint} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      paddingBottom: 6,
    },
    topbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    shareButton: {
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadowSoft,
    },
    shareLabel: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.ink,
      letterSpacing: -0.1,
    },
    content: {
      paddingTop: 12,
    },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingTop: 4,
      paddingBottom: 22,
    },
    profileBody: {
      flex: 1,
      gap: 3,
    },
    profileName: {
      fontSize: 25,
      lineHeight: 30,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexWrap: 'wrap',
    },
    metaText: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      color: colors.inkMuted,
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.lineStrong,
      marginHorizontal: 2,
    },
    sinceText: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      color: colors.inkFaint,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 13,
    },
    sectionTitleRow: {
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
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.inkMuted,
    },
    sectionCaption: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      color: colors.inkFaint,
      marginTop: 3,
    },
    totals: {
      alignItems: 'flex-end',
      gap: 2,
      paddingBottom: 2,
    },
    totalGave: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.red,
      opacity: 0.9,
    },
    totalReceived: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      color: colors.green,
      opacity: 0.9,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 7,
      marginBottom: 18,
    },
    filterChip: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    filterText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
    },
    filterTextActive: {
      color: colors.bg,
    },
    groups: {
      gap: 20,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    dayLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.inkMuted,
      letterSpacing: 0.1,
    },
    dayLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.line,
    },
    dayCount: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.inkFaint,
    },
    entriesCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadowSoft,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    entryDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    entryPressed: {
      backgroundColor: colors.pressed,
    },
    entryIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    entryBody: {
      flex: 1,
      gap: 3,
    },
    entryTitle: {
      fontFamily: fonts.medium,
      fontSize: 13.5,
      letterSpacing: -0.1,
      color: colors.ink,
    },
    entryDetails: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.inkMuted,
    },
    entryRight: {
      alignItems: 'flex-end',
      gap: 3,
    },
    entryAmount: {
      fontFamily: fonts.bold,
      fontSize: 14,
      letterSpacing: -0.25,
    },
    entryBalance: {
      fontFamily: fonts.medium,
      fontSize: 9.5,
      color: colors.inkFaint,
      letterSpacing: 0.1,
    },
    emptyEntries: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.xxl,
      paddingVertical: 30,
      paddingHorizontal: 24,
      alignItems: 'center',
      ...shadowSoft,
    },
    emptyEntriesIcon: {
      width: 60,
      height: 60,
      borderRadius: 19,
      backgroundColor: colors.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyEntriesTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
      letterSpacing: -0.3,
    },
    emptyEntriesBody: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.inkMuted,
      textAlign: 'center',
      maxWidth: 290,
      marginTop: 5,
      marginBottom: 16,
    },
    filterEmpty: {
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderStyle: 'dashed',
    },
    filterEmptyText: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.inkMuted,
    },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      gap: 10,
    },
    notFoundIcon: {
      width: 66,
      height: 66,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    notFoundBody: {
      textAlign: 'center',
      color: colors.inkMuted,
      maxWidth: 300,
      marginBottom: 12,
    },
    menuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 14,
    },
    menuPerson: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 12,
    },
    menuPersonBody: {
      flex: 1,
      gap: 2,
    },
    menuPersonName: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.ink,
    },
    menuPersonMeta: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      color: colors.inkMuted,
    },
    menuList: {
      gap: 8,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: 12,
    },
    menuRowPressed: {
      opacity: 0.7,
    },
    menuIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuRowBody: {
      flex: 1,
      gap: 2,
    },
    menuRowTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      letterSpacing: -0.1,
    },
    menuRowCaption: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.inkMuted,
    },
    menuNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
      paddingTop: 16,
      paddingBottom: 4,
    },
    menuNoteText: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.inkFaint,
    },
    deleteCard: {
      backgroundColor: colors.redSoft,
      borderRadius: radius.md,
      padding: 15,
    },
    deleteTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deleteTitle: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.redDeep,
    },
    deleteBody: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.redDeep,
      opacity: 0.82,
      marginTop: 6,
    },
    deleteActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    deleteAction: {
      flex: 1,
      height: 42,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
  });
