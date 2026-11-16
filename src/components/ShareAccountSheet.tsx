import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, HostInstance, Pressable, StyleSheet, View } from 'react-native';

import { AccountSnapshot } from '@/components/AccountSnapshot';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { useToast } from '@/components/Toast';
import { IconButton } from '@/components/ui';
import { shareStatement } from '@/lib/export-statement';
import { shareSnapshot } from '@/lib/share-snapshot';
import { fonts, Palette, radius, useTheme, useThemedStyles } from '@/lib/theme';
import { Entry, Person, PersonSummary } from '@/lib/types';

type Busy = 'snapshot' | 'statement' | null;

export function ShareAccountSheet({
  visible,
  onClose,
  person,
  entries,
  summary,
}: {
  visible: boolean;
  onClose: () => void;
  person: Person;
  entries: Entry[];
  summary: PersonSummary;
}) {
  const { colors, creditTerms } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const snapshotRef = useRef<HostInstance>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState<Busy>(null);

  const begin = (kind: Exclude<Busy, null>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(kind);
    return true;
  };

  const finish = () => {
    busyRef.current = false;
    setBusy(null);
  };

  const close = () => {
    if (!busyRef.current) onClose();
  };

  const handleSnapshot = async () => {
    if (!begin('snapshot')) return;
    try {
      const result = await shareSnapshot(snapshotRef, person);
      onClose();
      showToast(result === 'downloaded' ? 'Snapshot image downloaded' : 'Snapshot ready to share');
    } catch (error) {
      console.error('Snapshot share failed', error);
      showToast('Could not create the snapshot', 'default');
    } finally {
      finish();
    }
  };

  const handleStatement = async () => {
    if (!begin('statement')) return;
    try {
      const result = await shareStatement(person, entries, creditTerms);
      onClose();
      showToast(
        result === 'downloaded'
          ? 'Statement PDF downloaded'
          : result === 'printed'
            ? 'Statement opened for printing'
            : 'Statement ready to share',
      );
    } catch (error) {
      console.error('Statement export failed', error);
      showToast('Could not create the statement', 'default');
    } finally {
      finish();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close} maxHeightRatio={0.72}>
      <View style={styles.header}>
        <View>
          <AppText variant="micro">SHARE ACCOUNT</AppText>
          <AppText style={styles.headerTitle}>What would you like to send?</AppText>
        </View>
        <IconButton name="close" label="Close" onPress={close} size={38} iconSize={20} />
      </View>

      <View style={styles.personRow}>
        <View style={styles.personAvatar}>
          <AppText style={styles.personInitial}>
            {person.name.trim().charAt(0).toUpperCase() || 'F'}
          </AppText>
        </View>
        <View style={styles.personBody}>
          <AppText style={styles.personName} numberOfLines={1}>
            {person.name}
          </AppText>
          <AppText style={styles.personMeta}>
            {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'} ·{' '}
            {person.phone || 'No contact number'}
          </AppText>
        </View>
      </View>

      <View style={styles.options}>
        <Option
          icon="image"
          title="Share snapshot"
          caption="Image with name, balance and account age"
          tag="IMAGE"
          busy={busy === 'snapshot'}
          disabled={busy !== null}
          onPress={handleSnapshot}
        />
        <Option
          icon="picture-as-pdf"
          title="Full statement"
          caption="PDF with every entry and running balance"
          tag="PDF"
          busy={busy === 'statement'}
          disabled={busy !== null}
          onPress={handleStatement}
        />
      </View>

      <View style={styles.note}>
        <MaterialIcons name="lock-outline" size={13} color={colors.inkFaint} />
        <AppText style={styles.noteText}>
          Snapshot leaves out individual entries. Both files are created on this device.
        </AppText>
      </View>

      {/* Kept off-screen so the image is rendered at full size before sharing. */}
      <View
        style={styles.captureHost}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <AccountSnapshot ref={snapshotRef} person={person} summary={summary} />
      </View>
    </BottomSheet>
  );
}

function Option({
  icon,
  title,
  caption,
  tag,
  busy,
  disabled,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  caption: string;
  tag: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.option,
        pressed && !disabled && styles.optionPressed,
        disabled && !busy && styles.optionDisabled,
      ]}
    >
      <View style={styles.optionIcon}>
        <MaterialIcons name={icon} size={20} color={colors.blueDeep} />
      </View>
      <View style={styles.optionBody}>
        <AppText style={styles.optionTitle}>{title}</AppText>
        <AppText style={styles.optionCaption}>{caption}</AppText>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.inkMuted} />
      ) : (
        <View style={styles.tag}>
          <AppText style={styles.tagText}>{tag}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      paddingBottom: 16,
    },
    headerTitle: {
      fontFamily: fonts.bold,
      fontSize: 19,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: colors.ink,
      marginTop: 4,
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: 11,
      marginBottom: 12,
    },
    personAvatar: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: colors.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    personInitial: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.blueDeep,
    },
    personBody: {
      flex: 1,
    },
    personName: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.ink,
    },
    personMeta: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.inkMuted,
      marginTop: 1,
    },
    options: {
      gap: 9,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      paddingHorizontal: 13,
      paddingVertical: 13,
    },
    optionPressed: {
      backgroundColor: colors.pressed,
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionBody: {
      flex: 1,
    },
    optionTitle: {
      fontFamily: fonts.semibold,
      fontSize: 14.5,
      color: colors.ink,
    },
    optionCaption: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.inkMuted,
      marginTop: 2,
    },
    tag: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
    tagText: {
      fontFamily: fonts.bold,
      fontSize: 7.5,
      letterSpacing: 0.8,
      color: colors.inkMuted,
    },
    note: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingTop: 14,
      paddingHorizontal: 2,
    },
    noteText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 10.5,
      lineHeight: 15,
      color: colors.inkFaint,
    },
    captureHost: {
      position: 'absolute',
      left: -10000,
      top: 0,
      width: 360,
      height: 450,
    },
  });
