import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { MiniCalendar } from '@/components/MiniCalendar';
import { Button, IconButton } from '@/components/ui';
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/feedback';
import {
  currencyPrefix,
  formatEntryDate,
  parseAmountInput,
  round2,
  todayKey,
} from '@/lib/format';
import { useStore } from '@/lib/store';
import { useTerms } from '@/lib/terms';
import { fonts, Palette, radius, shadowSoft, useTheme, useThemedStyles } from '@/lib/theme';
import { Entry, EntryType, PAYMENT_METHODS, Person } from '@/lib/types';
import { useToast } from '@/components/Toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  person: Person;
  entry?: Entry | null;
};

export function EntryFormSheet({ visible, onClose, person, entry }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useStore();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const terms = useTerms();
  const styles = useThemedStyles(createStyles);
  const [type, setType] = useState<EntryType>('gave');
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Resetting the controlled form when a different entry opens is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(entry?.type ?? 'gave');
    setAmountText(entry ? String(entry.amount) : '');
    setMethod(entry?.method ?? null);
    setNote(entry?.note ?? '');
    setDate(entry?.date ?? todayKey());
    setShowCalendar(false);
    setConfirmDelete(false);
    // Only reset when a different entry (or the sheet itself) opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, entry?.id]);

  const parsedAmount = Number.parseFloat(amountText || '0');
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSave = () => {
    if (!isValid) return;
    const payload = {
      type,
      amount: round2(parsedAmount),
      method,
      note,
      date,
    };
    if (entry) {
      updateEntry(entry.id, payload);
      showToast('Entry updated');
    } else {
      addEntry({ personId: person.id, ...payload });
      showToast('Entry added');
    }
    successFeedback();
    onClose();
  };

  const handleDelete = () => {
    if (!entry) return;
    deleteEntry(entry.id);
    warningFeedback();
    showToast('Entry deleted');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="micro">{entry ? 'EDIT ENTRY' : 'NEW ENTRY'}</AppText>
          <AppText variant="heading" style={styles.title}>
            {entry ? 'Update entry' : 'Record an entry'}
          </AppText>
          <View style={styles.personLine}>
            <Avatar name={person.name} size={22} />
            <AppText style={styles.personName}>{person.name}</AppText>
          </View>
        </View>
        <IconButton name="close" label="Close" onPress={onClose} size={38} iconSize={20} />
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.segment}>
          <SegmentOption
            active={type === 'gave'}
            label={terms.gave}
            icon="north-east"
            tone="red"
            onPress={() => {
              setType('gave');
              tapFeedback();
            }}
          />
          <SegmentOption
            active={type === 'received'}
            label={terms.received}
            icon="south-west"
            tone="green"
            onPress={() => {
              setType('received');
              tapFeedback();
            }}
          />
        </View>

        <AppText variant="micro" style={styles.fieldLabel}>
          Amount
        </AppText>
        <View style={[styles.amountField, type === 'gave' ? styles.amountFieldGave : styles.amountFieldReceived]}>
          <AppText style={styles.currency}>{currencyPrefix()}</AppText>
          <TextInput
            value={amountText}
            onChangeText={(text) => setAmountText(parseAmountInput(text))}
            placeholder="0"
            placeholderTextColor={colors.inkFaint}
            keyboardType="decimal-pad"
            inputMode="decimal"
            selectionColor={colors.blue}
            style={styles.amountInput}
            accessibilityLabel="Amount"
            maxLength={12}
          />
          <View style={styles.typeBadge}>
            <MaterialIcons
              name={type === 'gave' ? 'north-east' : 'south-west'}
              size={12}
              color={type === 'gave' ? colors.red : colors.green}
            />
            <AppText
              style={[
                styles.typeBadgeText,
                { color: type === 'gave' ? colors.red : colors.green },
              ]}
            >
              {type === 'gave' ? 'OUT' : 'IN'}
            </AppText>
          </View>
        </View>

        <AppText variant="micro" style={styles.fieldLabel}>
          Date
        </AppText>
        <Pressable
          onPress={() => {
            setShowCalendar((current) => !current);
            tapFeedback();
          }}
          accessibilityRole="button"
          accessibilityLabel="Choose entry date"
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        >
          <View style={styles.fieldIcon}>
            <MaterialIcons name="calendar-today" size={17} color={colors.inkSoft} />
          </View>
          <AppText style={styles.fieldValue}>{formatEntryDate(date)}</AppText>
          <MaterialIcons
            name={showCalendar ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.inkFaint}
          />
        </Pressable>

        {showCalendar ? (
          <MiniCalendar
            value={date}
            onChange={(next) => {
              setDate(next);
              setShowCalendar(false);
              tapFeedback();
            }}
          />
        ) : null}

        <View style={styles.labelRow}>
          <AppText variant="micro">Payment method</AppText>
          <AppText style={styles.optional}>OPTIONAL</AppText>
        </View>
        <View style={styles.chips}>
          {PAYMENT_METHODS.map((option) => {
            const active = method === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setMethod(active ? null : option);
                  tapFeedback();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                {active ? (
                  <MaterialIcons name="check" size={14} color={colors.blueDeep} />
                ) : null}
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>{option}</AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.labelRow}>
          <AppText variant="micro">Note</AppText>
          <AppText style={styles.optional}>OPTIONAL</AppText>
        </View>
        <View style={styles.noteField}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What was this for?"
            placeholderTextColor={colors.inkFaint}
            selectionColor={colors.blue}
            style={styles.noteInput}
            multiline
            maxLength={120}
            accessibilityLabel="Note"
          />
          <AppText style={styles.noteCount}>{note.length}/120</AppText>
        </View>

        {confirmDelete ? (
          <View style={styles.confirmCard}>
            <View style={styles.confirmTitleRow}>
              <MaterialIcons name="error-outline" size={17} color={colors.red} />
              <AppText style={styles.confirmTitle}>Delete this entry?</AppText>
            </View>
            <AppText style={styles.confirmBody}>
              The account balance will be recalculated. This can’t be undone.
            </AppText>
            <View style={styles.confirmActions}>
              <Button
                label="Keep entry"
                variant="outline"
                compact
                style={styles.confirmButton}
                onPress={() => setConfirmDelete(false)}
              />
              <Button
                label="Delete"
                variant="danger"
                compact
                style={styles.confirmButton}
                onPress={handleDelete}
              />
            </View>
          </View>
        ) : entry ? (
          <Pressable
            onPress={() => setConfirmDelete(true)}
            style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <MaterialIcons name="delete-outline" size={18} color={colors.red} />
            <AppText style={styles.deleteLinkText}>Delete entry</AppText>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={entry ? 'Save changes' : 'Save entry'}
          icon="check"
          onPress={handleSave}
          disabled={!isValid}
        />
      </View>
    </BottomSheet>
  );
}

function SegmentOption({
  active,
  label,
  icon,
  tone,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: 'north-east' | 'south-west';
  tone: 'red' | 'green';
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const accent = tone === 'red' ? colors.red : colors.green;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.segmentOption,
        active && styles.segmentOptionActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.segmentIcon, { backgroundColor: tone === 'red' ? colors.redSoft : colors.greenSoft }]}>
        <MaterialIcons name={icon} size={15} color={accent} />
      </View>
      <AppText style={[styles.segmentText, active && { color: colors.ink, fontFamily: fonts.medium }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingTop: 2,
      paddingBottom: 14,
    },
    headerCopy: {
      gap: 5,
      flex: 1,
    },
    title: {
      marginTop: 1,
    },
    personLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 3,
    },
    personName: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.inkMuted,
    },
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    segment: {
      flexDirection: 'row',
      gap: 4,
      backgroundColor: colors.surfaceMuted,
      padding: 4,
      borderRadius: radius.md,
      marginBottom: 20,
    },
    segmentOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 46,
      borderRadius: 13,
    },
    segmentOptionActive: {
      backgroundColor: colors.surface,
      ...shadowSoft,
    },
    segmentIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.inkMuted,
      letterSpacing: -0.1,
    },
    fieldLabel: {
      marginBottom: 7,
      color: colors.inkMuted,
    },
    amountField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      height: 82,
      marginBottom: 18,
    },
    amountFieldGave: {
      borderColor: colors.redLine,
    },
    amountFieldReceived: {
      borderColor: colors.greenLine,
    },
    currency: {
      fontFamily: fonts.medium,
      fontSize: 28,
      color: colors.inkMuted,
      marginRight: 6,
      marginTop: 3,
    },
    amountInput: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 38,
      letterSpacing: -1.2,
      color: colors.ink,
      height: '100%',
      paddingVertical: 0,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
      height: 24,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
    typeBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 8.5,
      letterSpacing: 0.6,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 54,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: 13,
      marginBottom: 18,
    },
    fieldIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fieldValue: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.ink,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 9,
    },
    optional: {
      fontFamily: fonts.medium,
      fontSize: 8.5,
      letterSpacing: 0.8,
      color: colors.inkFaint,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    chip: {
      height: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    chipActive: {
      borderColor: colors.blue,
      backgroundColor: colors.blueSoft,
    },
    chipText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.inkSoft,
    },
    chipTextActive: {
      color: colors.blueDeep,
      fontFamily: fonts.medium,
    },
    noteField: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 8,
    },
    noteInput: {
      minHeight: 54,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.ink,
      textAlignVertical: 'top',
      padding: 0,
    },
    noteCount: {
      fontFamily: fonts.medium,
      fontSize: 9.5,
      color: colors.inkFaint,
      alignSelf: 'flex-end',
      marginTop: 3,
    },
    confirmCard: {
      backgroundColor: colors.redSoft,
      borderRadius: radius.md,
      padding: 14,
      marginTop: 12,
    },
    confirmTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    confirmTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.redDeep,
    },
    confirmBody: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: colors.redDeep,
      opacity: 0.8,
      marginTop: 5,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    confirmButton: {
      flex: 1,
      height: 40,
      backgroundColor: colors.surface,
    },
    deleteLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 44,
      marginTop: 12,
    },
    deleteLinkText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.red,
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      marginTop: 4,
    },
    pressed: {
      opacity: 0.72,
    },
  });
