import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { fonts, radius, shadow, useTheme } from '@/lib/theme';

type ToastState = {
  message: string;
  tone: 'default' | 'success';
  id: number;
};

type ToastContextValue = {
  showToast: (message: string, tone?: 'default' | 'success') => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: 'default' | 'success' = 'success') => {
    if (timeout.current) clearTimeout(timeout.current);
    setToast({ message, tone, id: Date.now() });
    timeout.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastHost toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastHost({ toast }: { toast: ToastState | null }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [progress, toast]);

  if (!toast) return null;

  const success = toast.tone === 'success';
  const iconColor = success ? colors.green : colors.inkMuted;
  const iconBg = success ? colors.greenSoft : colors.surfaceMuted;

  return (
    <View pointerEvents="none" style={[styles.layer, { bottom: insets.bottom + 28 }]}>
      <Animated.View
        key={toast.id}
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: iconBg }]}>
          <MaterialIcons name={success ? 'check' : 'info-outline'} size={15} color={iconColor} />
        </View>
        <AppText style={[styles.text, { color: colors.ink }]} numberOfLines={2}>
          {toast.message}
        </AppText>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const value = React.useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 18,
    maxWidth: 420,
    marginHorizontal: 20,
    borderWidth: 1,
    ...shadow,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
    flexShrink: 1,
  },
});
