import { ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, shadow, useTheme } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeightRatio?: number;
};

export function BottomSheet({ visible, onClose, children, maxHeightRatio = 0.92 }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [rendered, setRendered] = useState(visible);
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- remount when reopening
      setRendered(true);
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        damping: 24,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      return;
    }

    if (!rendered) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 190,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [progress, rendered, visible]);

  if (!rendered) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress, backgroundColor: colors.scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
        </Animated.View>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardDock}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
                paddingBottom: Math.max(insets.bottom, 14),
                opacity: progress,
                backgroundColor: colors.bg,
                borderColor: colors.line,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.lineStrong }]} />
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  keyboardDock: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: layout.maxWidth,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    ...shadow,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  content: {
    flexShrink: 1,
  },
});
