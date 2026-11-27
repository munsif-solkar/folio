import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { AppText } from '@/components/AppText';
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
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <View style={[styles.topbar, { paddingHorizontal: density.pagePadding }]}>
          <IconButton
            name="close"
            label={editing ? 'Cancel editing' : 'Cancel'}
            onPress={close}
            size={38}
            iconSize={20}
          />
          <View style={styles.topbarCopy}>
            <AppText variant="micro" style={styles.eyebrow}>
              {editing ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}
            </AppText>
            <AppText variant="heading" style={styles.headerTitle}>
              {editing ? 'Edit account' : 'New account'}
            </AppText>
          </View>
          <View style={styles.topbarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: density.pagePadding, paddingTop: 6 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <AppText variant="micro" style={styles.fieldLabel}>
                  Person name
                </AppText>
                <AppText style={styles.required}>REQUIRED</AppText>
              </View>
              <View style={[styles.inputCard, name.trim().length > 0 && styles.inputCardFilled]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="person-outline" size={16} color={colors.inkMuted} />
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
                    <MaterialIcons name="close" size={16} color={colors.inkFaint} />
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
                  <MaterialIcons name="call" size={16} color={colors.inkMuted} />
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
                    <MaterialIcons name="close" size={16} color={colors.inkFaint} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingHorizontal: density.pagePadding }]}>
          <Button
            label={editing ? 'Save changes' : 'Create account'}
            icon={editing ? 'check' : 'person-add-alt-1'}
            compact
            style={styles.saveButton}
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
      gap: 10,
      paddingTop: 2,
      paddingBottom: 6,
    },
    topbarCopy: {
      flex: 1,
      gap: 1,
    },
    eyebrow: {
      fontSize: 9.5,
      letterSpacing: 0.7,
      color: colors.inkMuted,
    },
    headerTitle: {
      fontSize: 17,
      lineHeight: 21,
    },
    topbarSpacer: {
      width: 38,
      height: 38,
    },
    content: {
      paddingBottom: 10,
    },
    form: {
      gap: 12,
    },
    fieldGroup: {
      gap: 5,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 1,
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
      gap: 8,
      minHeight: 46,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingHorizontal: 11,
      ...shadowSoft,
    },
    inputCardFilled: {
      borderColor: colors.blueLine,
    },
    inputIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 14.5,
      color: colors.ink,
      paddingVertical: 9,
    },
    footer: {
      paddingTop: 8,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.bg,
    },
    saveButton: {
      height: 42,
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
