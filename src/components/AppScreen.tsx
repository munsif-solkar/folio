import { PropsWithChildren } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { layout, shadowSoft, useTheme } from '@/lib/theme';

type Props = PropsWithChildren<{
  edges?: Edge[];
  wideFrame?: boolean;
}>;

/**
 * The app column. On phones it fills the screen, on the web preview it keeps a
 * readable phone-like column against a quieter desktop backdrop.
 */
export function AppScreen({ children, edges = ['top', 'left', 'right'], wideFrame = true }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const wide = wideFrame && width > 700;

  return (
    <View style={[styles.outer, { backgroundColor: colors.bgDeep }]}>
      <SafeAreaView edges={edges} style={styles.safe}>
        <View
          style={[
            styles.column,
            { backgroundColor: colors.bg },
            wide && [styles.columnWide, { borderColor: colors.line }],
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
  },
  columnWide: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...shadowSoft,
  },
});
