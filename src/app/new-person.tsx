import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { useToast } from '@/components/Toast';
import { Button, IconButton } from '@/components/ui';
import { successFeedback } from '@/lib/feedback';
import { sanitizePhoneInput } from '@/lib/format';
import { useStore } from '@/lib/store';
import { fonts, Palette, radius, shadowSoft, useTheme, useThemedStyles } from '@/lib/theme';

export default function PersonFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id;
  const { people, addPerson, updatePerson } = useStore();
  const { showToast } = useToast();
  const { colors, density } = useTheme();
  const styles = useThemedStyles(createStyles);

  const existing = editId ? people.find((item) => item.id === editId) : undefined;
  const editing = Boolean(editId && existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const canSave = name.trim().length > 0;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editing && existing) {
      updatePerson(existing.id, { name: trimmed, phone: phone.trim() });
      showToast('Account updated');
      successFeedback();
      close();
      return;
    }

    addPerson({ name: trimmed, phone: phone.trim() });
    showToast('Account created');
    successFeedback();
    close();
  };

  if (editId && !existing) {
    return (
      <AppScreen edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.topbar, { paddingHorizontal: density.pagePadding }]}>
          <IconButton name="close" label="Close" onPress={close} />
        </View>
        <View style={styles.notFound}>
          <AppText variant="title">Account not found</AppText>
          <AppText style={styles.notFoundBody}>It may already have been deleted.</AppText>
          <Button label="Back to ledger" variant="tonal" onPress={() => router.replace('/')} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topbar, { paddingHorizontal: density.pagePadding }]}>
          <IconButton name="close" label={editing ? 'Cancel editing' : 'Cancel'} onPress={close} />
          <AppText variant="micro">{editing ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</AppText>
          <View style={styles.topbarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: density.pagePadding, paddingTop: density.heroTop > 20 ? 10 : 14 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, { paddingBottom: density.sectionGap }]}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarHalo} />
              <Avatar name={name || 'New person'} size={82} />
              <View style={styles.avatarBadge}>
                <MaterialIcons name={editing ? 'edit' : 'add'} size={13} color={colors.bg} />
              </View>
            </View>
            <AppText variant="display" style={styles.title}>
              {editing ? 'Edit account' : 'New account'}
            </AppText>
            <AppText style={styles.subtitle}>
              {editing
                ? 'Keep the name and contact number up to date.'
                : 'Who are you keeping a tab with?'}
            </AppText>
          </View>

          <View style={[styles.form, { gap: density.sectionGap > 24 ? 20 : 16 }]}>
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <AppText variant="micro" style={styles.fieldLabel}>
                  Person name
                </AppText>
                <AppText style={styles.required}>REQUIRED</AppText>
              </View>
              <View style={[styles.inputCard, name.trim().length > 0 && styles.inputCardFilled]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="person-outline" size={18} color={colors.inkMuted} />
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Ananya Rao"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.input}
                  selectionColor={colors.blue}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  accessibilityLabel="Person name"
                />
                {name.length > 0 ? (
                  <Pressable
                    onPress={() => setName('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear name"
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <MaterialIcons name="close" size={17} color={colors.inkFaint} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <AppText variant="micro" style={styles.fieldLabel}>
                  Contact number
                </AppText>
                <AppText style={styles.optional}>OPTIONAL</AppText>
              </View>
              <View style={styles.inputCard}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="call" size={17} color={colors.inkMuted} />
                </View>
                <TextInput
                  ref={phoneRef}
                  value={phone}
                  onChangeText={(value) => setPhone(sanitizePhoneInput(value))}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.input}
                  selectionColor={colors.blue}
                  keyboardType="phone-pad"
                  inputMode="tel"
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={save}
                  accessibilityLabel="Contact number"
                />
                {phone.length > 0 ? (
                  <Pressable
                    onPress={() => setPhone('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear contact number"
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <MaterialIcons name="close" size={17} color={colors.inkFaint} />
                  </Pressable>
                ) : null}
              </View>
              <AppText style={styles.hint}>Handy when you need to send a reminder.</AppText>
            </View>
          </View>

          <View style={[styles.privacy, { marginTop: density.sectionGap }]}>
            <View style={styles.privacyIcon}>
              <MaterialIcons name="lock-outline" size={17} color={colors.inkSoft} />
            </View>
            <View style={styles.privacyBody}>
              <AppText style={styles.privacyTitle}>Private by design</AppText>
              <AppText style={styles.privacyText}>
                This account is saved to this device only. Nothing is uploaded or synced.
              </AppText>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingHorizontal: density.pagePadding }]}>
          <Button
            label={editing ? 'Save changes' : 'Create account'}
            icon={editing ? 'check' : 'person-add-alt-1'}
            onPress={save}
            disabled={!canSave}
          />
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
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
    },
    topbarSpacer: {
      width: 42,
      height: 42,
    },
    content: {
      paddingBottom: 24,
    },
    hero: {
      alignItems: 'center',
      paddingTop: 6,
    },
    avatarWrap: {
      width: 110,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarHalo: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.surfaceMuted,
    },
    avatarBadge: {
      position: 'absolute',
      right: 13,
      bottom: 6,
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: colors.ink,
      borderWidth: 3,
      borderColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkMuted,
      textAlign: 'center',
      marginTop: 5,
    },
    form: {
      gap: 20,
    },
    fieldGroup: {
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    fieldLabel: {
      color: colors.inkMuted,
    },
    required: {
      fontFamily: fonts.medium,
      fontSize: 8.5,
      letterSpacing: 0.7,
      color: colors.blueDeep,
    },
    optional: {
      fontFamily: fonts.medium,
      fontSize: 8.5,
      letterSpacing: 0.7,
      color: colors.inkFaint,
    },
    inputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 58,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingHorizontal: 13,
      ...shadowSoft,
    },
    inputCardFilled: {
      borderColor: colors.blueLine,
    },
    inputIcon: {
      width: 31,
      height: 31,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 15.5,
      color: colors.ink,
      paddingVertical: 14,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      color: colors.inkFaint,
      paddingHorizontal: 2,
    },
    privacy: {
      flexDirection: 'row',
      gap: 11,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      padding: 14,
    },
    privacyIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    privacyBody: {
      flex: 1,
      gap: 2,
    },
    privacyTitle: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.ink,
    },
    privacyText: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 16,
      color: colors.inkMuted,
    },
    footer: {
      paddingTop: 12,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.bg,
    },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: 28,
    },
    notFoundBody: {
      textAlign: 'center',
      color: colors.inkMuted,
      marginBottom: 10,
    },
    pressed: {
      opacity: 0.6,
    },
  });
