import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { CurrencySheet } from '@/components/CurrencySheet';
import { useToast } from '@/components/Toast';
import { Button, IconButton } from '@/components/ui';
import { appConfig } from '@/lib/app-config';
import { backupFileName, createBackupJson, parseBackup } from '@/lib/backup';
import { resolveCurrency } from '@/lib/currency';
import { successFeedback, tapFeedback } from '@/lib/feedback';
import { useStore } from '@/lib/store';
import {
  fonts,
  Palette,
  radius,
  shadowSoft,
  ThemeMode,
  useTheme,
  useThemedStyles,
} from '@/lib/theme';
import { exportLedger, importLedgerFile } from '@/lib/transfer';
import { StoredData } from '@/lib/types';

type IconName = keyof typeof MaterialIcons.glyphMap;

const THEME_OPTIONS: {
  key: ThemeMode;
  icon: IconName;
  title: string;
  caption: string;
}[] = [
  {
    key: 'system',
    icon: 'brightness-auto',
    title: 'System default',
    caption: 'Follow your device appearance',
  },
  { key: 'light', icon: 'light-mode', title: 'Light', caption: 'Bright and paper-white' },
  { key: 'dark', icon: 'dark-mode', title: 'Dark', caption: 'Easy on the eyes at night' },
  { key: 'oled', icon: 'contrast', title: 'Black (OLED)', caption: 'True black for OLED screens' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    colors,
    density,
    mode,
    compact,
    creditTerms,
    haptics,
    currency,
    statementName,
    setMode,
    setCompact,
    setCreditTerms,
    setHaptics,
    setStatementName,
  } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { people, entries, replaceData } = useStore();
  const { showToast } = useToast();

  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [pendingImport, setPendingImport] = useState<StoredData | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const currencyInfo = resolveCurrency(currency);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const accountLabel = `${people.length} ${people.length === 1 ? 'account' : 'accounts'}`;
  const entryLabel = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleExport = async () => {
    if (busy) return;
    setBusy('export');
    try {
      const result = await exportLedger(
        createBackupJson(people, entries),
        backupFileName(),
      );
      showToast(
        result === 'downloaded'
          ? 'Backup downloaded'
          : result === 'shared'
            ? 'Backup ready to save'
            : 'Backup saved to this device',
      );
      successFeedback();
    } catch (error) {
      console.error('Backup export failed', error);
      showToast('Could not export your data', 'default');
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const raw = await importLedgerFile();
      if (!raw) return;
      const data = parseBackup(raw);
      setPendingImport(data);
      tapFeedback();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "That file isn't a Folio backup", 'default');
    } finally {
      setBusy(null);
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    replaceData(pendingImport);
    setPendingImport(null);
    successFeedback();
    showToast('Ledger imported');
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open link', error);
      showToast('Could not open that link', 'default');
    }
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: density.pagePadding,
            paddingBottom: insets.bottom + 40,
            paddingTop: 6,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <IconButton name="close" label="Close settings" onPress={close} />
          <AppText variant="micro">SETTINGS</AppText>
          <View style={styles.topbarSpacer} />
        </View>

        <View style={[styles.hero, { marginTop: density.heroTop }]}>
          <AppText variant="display">Settings</AppText>
          <AppText style={styles.heroSub}>
            Appearance, backups, and the person behind Folio.
          </AppText>
        </View>

        <SettingsSection label="Appearance">
          <View style={styles.card}>
            {THEME_OPTIONS.map((option, index) => (
              <View key={option.key}>
                {index > 0 ? <Divider /> : null}
                <ThemeRow
                  icon={option.icon}
                  title={option.title}
                  caption={option.caption}
                  active={mode === option.key}
                  onPress={() => {
                    setMode(option.key);
                    tapFeedback();
                  }}
                />
              </View>
            ))}
            <Divider />
            <View style={styles.switchRow}>
              <View style={styles.rowIcon}>
                <MaterialIcons name="density-small" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>Compact view</AppText>
                <AppText style={styles.rowCaption}>Tighter spacing, more rows on screen</AppText>
              </View>
              <Switch
                value={compact}
                onValueChange={(next) => {
                  setCompact(next);
                  tapFeedback();
                }}
                trackColor={{ false: colors.surfaceStrong, true: colors.blue }}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                ios_backgroundColor={colors.surfaceStrong}
                accessibilityLabel="Compact view"
              />
            </View>
            <Divider />
            <View style={styles.switchRow}>
              <View style={styles.rowIcon}>
                <MaterialIcons name="swap-vert" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>Use credit / debit</AppText>
                <AppText style={styles.rowCaption}>
                  Label entries as debit and credit instead of gave and received
                </AppText>
              </View>
              <Switch
                value={creditTerms}
                onValueChange={(next) => {
                  setCreditTerms(next);
                  tapFeedback();
                }}
                trackColor={{ false: colors.surfaceStrong, true: colors.blue }}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                ios_backgroundColor={colors.surfaceStrong}
                accessibilityLabel="Use credit and debit terms"
              />
            </View>
          </View>
        </SettingsSection>

        <SettingsSection label="Money">
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                setCurrencyOpen(true);
                tapFeedback();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Currency. Currently ${currencyInfo.name} (${currencyInfo.code}).`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowIcon}>
                <MaterialIcons name="payments" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>Currency</AppText>
                <AppText style={styles.rowCaption}>
                  Amounts, balances, and statements use this currency
                </AppText>
              </View>
              <View style={styles.currencyValue}>
                {currencyInfo.symbol !== currencyInfo.code ? (
                  <AppText style={styles.currencySymbol}>{currencyInfo.symbol}</AppText>
                ) : null}
                <AppText style={styles.currencyCode}>{currencyInfo.code}</AppText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.inkFaint} />
            </Pressable>
          </View>
        </SettingsSection>

        <SettingsSection label="Statements">
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.rowIcon}>
                <MaterialIcons name="badge" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.inputBody}>
                <AppText style={styles.rowTitle}>Name on statement</AppText>
                <AppText style={styles.rowCaption}>
                  Printed as the sender on snapshots and PDF statements
                </AppText>
                <TextInput
                  value={statementName}
                  onChangeText={setStatementName}
                  onBlur={() => setStatementName(statementName.trim())}
                  placeholder="Your name"
                  placeholderTextColor={colors.inkFaint}
                  accessibilityLabel="Name on statement"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={60}
                  returnKeyType="done"
                  blurOnSubmit
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>
          <View style={styles.dataNote}>
            <MaterialIcons name="lock-outline" size={13} color={colors.inkFaint} />
            <AppText style={styles.dataNoteText}>
              Saved on this device. Leave it empty to print without a sender name.
            </AppText>
          </View>
        </SettingsSection>

        <SettingsSection label="Feedback">
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.rowIcon}>
                <MaterialIcons name="vibration" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>Haptic feedback</AppText>
                <AppText style={styles.rowCaption}>
                  Vibrate on taps, saves, and warnings
                </AppText>
              </View>
              <Switch
                value={haptics}
                onValueChange={(next) => {
                  setHaptics(next);
                  tapFeedback();
                }}
                trackColor={{ false: colors.surfaceStrong, true: colors.blue }}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                ios_backgroundColor={colors.surfaceStrong}
                accessibilityLabel="Haptic feedback"
              />
            </View>
          </View>
        </SettingsSection>

        <SettingsSection label="Data">
          <View style={styles.card}>
            <ActionRow
              icon="file-download"
              title="Export data"
              caption={`Save ${accountLabel} and ${entryLabel} as JSON`}
              busy={busy === 'export'}
              onPress={handleExport}
            />
            <Divider />
            <ActionRow
              icon="file-upload"
              title="Import data"
              caption="Replace this ledger from a backup file"
              busy={busy === 'import'}
              onPress={handleImport}
            />
          </View>

          {pendingImport ? (
            <View style={styles.pendingCard}>
              <View style={styles.pendingTitleRow}>
                <MaterialIcons name="restore" size={19} color={colors.blueDeep} />
                <AppText style={styles.pendingTitle}>Replace this ledger?</AppText>
              </View>
              <AppText style={styles.pendingBody}>
                The backup holds {pendingImport.people.length}{' '}
                {pendingImport.people.length === 1 ? 'account' : 'accounts'} and{' '}
                {pendingImport.entries.length}{' '}
                {pendingImport.entries.length === 1 ? 'entry' : 'entries'}. Importing replaces
                everything currently in Folio.
              </AppText>
              <View style={styles.pendingActions}>
                <Button
                  label="Cancel"
                  variant="outline"
                  compact
                  style={styles.pendingButton}
                  onPress={() => setPendingImport(null)}
                />
                <Button
                  label="Replace ledger"
                  variant="danger"
                  compact
                  style={styles.pendingButton}
                  onPress={confirmImport}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.dataNote}>
            <MaterialIcons name="lock-outline" size={13} color={colors.inkFaint} />
            <AppText style={styles.dataNoteText}>
              Backups are plain JSON and only leave this device when you share them.
            </AppText>
          </View>
        </SettingsSection>

        <SettingsSection label="Developer">
          <View style={styles.card}>
            <View style={styles.developerRow}>
              <Avatar name={appConfig.developer.name} size={46} />
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>{appConfig.developer.name}</AppText>
                <AppText style={styles.rowCaption}>{appConfig.developer.role}</AppText>
              </View>
              <AppText style={styles.handle}>{appConfig.developer.handle}</AppText>
            </View>
            <Divider />
            <ActionRow
              icon="code"
              title="Code"
              caption="github.com/munsif-solkar/folio"
              onPress={() => openLink(appConfig.githubUrl)}
            />
            <Divider />
            <ActionRow
              icon="favorite-border"
              title="Support the developer"
              caption="A small gesture keeps Folio going"
              onPress={() => openLink(appConfig.supportUrl)}
            />
            <Divider />
            <View style={styles.versionRow}>
              <View style={styles.rowIcon}>
                <MaterialIcons name="info-outline" size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.rowBody}>
                <AppText style={styles.rowTitle}>Version {version}</AppText>
                <AppText style={styles.rowCaption}>Built with Expo and React Native</AppText>
              </View>
            </View>
          </View>
        </SettingsSection>

        <View style={styles.footer}>
          <MaterialIcons name="lock-outline" size={13} color={colors.inkFaint} />
          <AppText style={styles.footerText}>Folio keeps everything on this device.</AppText>
        </View>
      </ScrollView>

      <CurrencySheet visible={currencyOpen} onClose={() => setCurrencyOpen(false)} />
    </AppScreen>
  );
}

function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText variant="micro" style={styles.sectionLabel}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

function ThemeRow({
  icon,
  title,
  caption,
  active,
  onPress,
}: {
  icon: IconName;
  title: string;
  caption: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, active && { backgroundColor: colors.blueSoft }]}>
        <MaterialIcons name={icon} size={18} color={active ? colors.blueDeep : colors.inkMuted} />
      </View>
      <View style={styles.rowBody}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        <AppText style={styles.rowCaption}>{caption}</AppText>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function ActionRow({
  icon,
  title,
  caption,
  onPress,
  busy = false,
}: {
  icon: IconName;
  title: string;
  caption: string;
  onPress: () => void;
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: busy }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={18} color={colors.inkMuted} />
      </View>
      <View style={styles.rowBody}>
        <AppText style={styles.rowTitle}>{busy ? 'Working…' : title}</AppText>
        <AppText style={styles.rowCaption}>{caption}</AppText>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.inkMuted} />
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={colors.inkFaint} />
      )}
    </Pressable>
  );
}

function Divider() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.divider} />;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    content: {
      paddingBottom: 30,
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    topbarSpacer: {
      width: 42,
      height: 42,
    },
    hero: {
      marginTop: 24,
    },
    heroSub: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 20,
      color: colors.inkMuted,
      marginTop: 6,
      maxWidth: 340,
    },
    section: {
      marginTop: 28,
    },
    sectionLabel: {
      color: colors.inkFaint,
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadowSoft,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
      minHeight: 66,
    },
    rowPressed: {
      backgroundColor: colors.pressed,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
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
      lineHeight: 16,
      color: colors.inkMuted,
    },
    currencyValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    currencySymbol: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    currencyCode: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.inkFaint,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
    },
    inputBody: {
      flex: 1,
      gap: 2,
    },
    textInput: {
      height: 44,
      marginTop: 10,
      paddingHorizontal: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.lineStrong,
      backgroundColor: colors.surfaceMuted,
      color: colors.ink,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginLeft: 61,
    },
    radio: {
      width: 21,
      height: 21,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.lineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: {
      borderColor: colors.blue,
    },
    radioDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: colors.blue,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
      minHeight: 66,
    },
    pendingCard: {
      backgroundColor: colors.blueSoft,
      borderWidth: 1,
      borderColor: colors.blueLine,
      borderRadius: radius.lg,
      padding: 15,
      marginTop: 10,
    },
    pendingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    pendingTitle: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.blueDeep,
    },
    pendingBody: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkSoft,
      marginTop: 6,
    },
    pendingActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    pendingButton: {
      flex: 1,
      height: 42,
    },
    dataNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: 3,
      paddingVertical: 10,
    },
    dataNoteText: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      lineHeight: 15,
      color: colors.inkFaint,
      flex: 1,
    },
    developerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
      minHeight: 72,
    },
    handle: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.inkFaint,
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
      minHeight: 66,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 26,
      paddingHorizontal: 20,
    },
    footerText: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      color: colors.inkFaint,
    },
  });
