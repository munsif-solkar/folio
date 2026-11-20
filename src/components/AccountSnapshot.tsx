import { forwardRef } from 'react';
import { HostInstance, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { formatBalance, formatMoney, formatNumericDate, formatShortDate, toDateKey } from '@/lib/format';
import { fonts } from '@/lib/theme';
import { Person, PersonSummary } from '@/lib/types';

export const SNAPSHOT_WIDTH = 360;
export const SNAPSHOT_HEIGHT = 450;

const C = {
  bg: '#F3F6FA',
  surface: '#FFFFFF',
  ink: '#14181F',
  inkSoft: '#3C4553',
  muted: '#6B7686',
  faint: '#98A1AF',
  line: '#E6EAF0',
  green: '#0A7A4B',
  greenSoft: '#E6F5EE',
  greenLine: '#CFE9DC',
  red: '#C42B2B',
  redSoft: '#FCEBEA',
  redLine: '#F2D5D2',
  blue: '#1667F2',
  blueSoft: '#E9F0FE',
} as const;

/**
 * The image shared from an account. Kept on a fixed light palette so it looks
 * the same in WhatsApp regardless of the theme the app is using.
 */
export const AccountSnapshot = forwardRef<
  HostInstance,
  { person: Person; summary: PersonSummary; statementName?: string }
>(function AccountSnapshot({ person, summary, statementName = '' }, ref) {
    const sender = statementName.trim();
    const toReceive = Math.max(summary.balance, 0);
    const toGive = Math.max(-summary.balance, 0);
    const net = Math.abs(summary.balance);
    const netTone = summary.balance >= 0 ? C.green : C.red;
    const netCaption =
      summary.balance > 0.004
        ? 'In your favour'
        : summary.balance < -0.004
          ? 'You owe this amount'
          : 'All settled';
    const initials = person.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <View ref={ref} collapsable={false} style={styles.canvas}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.mark}>
              <AppText style={styles.markLetter}>F</AppText>
              <View style={styles.markDot} />
            </View>
            <View>
              <AppText style={styles.brandName}>Folio</AppText>
              <AppText style={styles.brandTag}>PERSONAL LEDGER</AppText>
            </View>
          </View>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>ACCOUNT</AppText>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initials || 'F'}</AppText>
          </View>
          <View style={styles.identityBody}>
            <AppText
              style={styles.name}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {person.name}
            </AppText>
            <AppText style={styles.since}>
              On the books since {formatShortDate(toDateKey(new Date(person.createdAt)))}
            </AppText>
            {sender ? (
              <AppText style={styles.sender} numberOfLines={1}>
                From {sender}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.balanceCard}>
          <AppText style={styles.balanceLabel}>NET BALANCE</AppText>
          <AppText style={[styles.balanceAmount, { color: netTone }]} numberOfLines={1} tabular>
            {formatBalance(net)}
          </AppText>
          <AppText style={styles.balanceCaption}>{netCaption}</AppText>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpi, { backgroundColor: C.greenSoft, borderColor: C.greenLine }]}>
            <View style={styles.kpiLabelRow}>
              <View style={[styles.kpiDot, { backgroundColor: C.green }]} />
              <AppText style={[styles.kpiLabel, { color: C.green }]}>TO RECEIVE</AppText>
            </View>
            <AppText style={[styles.kpiAmount, { color: C.green }]} numberOfLines={1} tabular>
              {formatMoney(toReceive)}
            </AppText>
          </View>
          <View style={[styles.kpi, { backgroundColor: C.redSoft, borderColor: C.redLine }]}>
            <View style={styles.kpiLabelRow}>
              <View style={[styles.kpiDot, { backgroundColor: C.red }]} />
              <AppText style={[styles.kpiLabel, { color: C.red }]}>TO GIVE</AppText>
            </View>
            <AppText style={[styles.kpiAmount, { color: C.red }]} numberOfLines={1} tabular>
              {formatMoney(toGive)}
            </AppText>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'}
          </AppText>
          <View style={styles.footerDot} />
          <AppText style={styles.footerText}>Generated {formatNumericDate(new Date())}</AppText>
        </View>
        <AppText style={styles.footerNote}>
          Totals only · No individual entries · Created on this device
        </AppText>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  canvas: {
    width: SNAPSHOT_WIDTH,
    height: SNAPSHOT_HEIGHT,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    color: C.surface,
    marginTop: -1,
  },
  markDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    right: 5,
    bottom: 5,
    backgroundColor: '#8CE0A8',
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 17,
    letterSpacing: -0.3,
    color: C.ink,
  },
  brandTag: {
    fontFamily: fonts.medium,
    fontSize: 7,
    lineHeight: 9,
    letterSpacing: 1.2,
    color: C.faint,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.blueSoft,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 7.5,
    letterSpacing: 1,
    color: C.blue,
  },
  rule: {
    height: 1,
    backgroundColor: C.line,
    marginTop: 18,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 0.2,
    color: C.blue,
  },
  identityBody: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.8,
    color: C.ink,
  },
  since: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 14,
    color: C.muted,
    marginTop: 3,
  },
  sender: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    color: C.inkSoft,
    marginTop: 2,
  },
  balanceCard: {
    marginTop: 20,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  balanceLabel: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1,
    color: C.faint,
  },
  balanceAmount: {
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.3,
    marginTop: 3,
  },
  balanceCaption: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: C.muted,
    marginTop: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  kpi: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  kpiLabel: {
    fontFamily: fonts.bold,
    fontSize: 7.5,
    letterSpacing: 0.7,
  },
  kpiAmount: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.7,
    marginTop: 5,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    fontFamily: fonts.medium,
    fontSize: 8.5,
    letterSpacing: 0.2,
    color: C.faint,
  },
  footerDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: C.faint,
  },
  footerNote: {
    fontFamily: fonts.regular,
    fontSize: 7.5,
    lineHeight: 10,
    textAlign: 'center',
    color: C.faint,
    marginTop: 5,
  },
});
