import { Text, TextProps, TextStyle } from 'react-native';

import { fonts, type, useTheme } from '@/lib/theme';

type Variant = keyof typeof type;
type Weight = keyof typeof fonts;

const VARIANT_COLORS: Record<Variant, 'ink' | 'inkSoft' | 'inkMuted'> = {
  display: 'ink',
  title: 'ink',
  heading: 'ink',
  subtitle: 'ink',
  body: 'inkSoft',
  label: 'inkSoft',
  caption: 'inkMuted',
  micro: 'inkMuted',
  number: 'ink',
};

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
  weight?: Weight;
  size?: number;
  align?: TextStyle['textAlign'];
  letterSpacing?: number;
  tabular?: boolean;
};

export function AppText({
  variant = 'body',
  color,
  weight,
  size,
  align,
  letterSpacing,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        type[variant],
        { color: colors[VARIANT_COLORS[variant]] },
        color ? { color } : null,
        weight ? { fontFamily: fonts[weight] } : null,
        size ? { fontSize: size, lineHeight: Math.round(size * 1.36) } : null,
        align ? { textAlign: align } : null,
        letterSpacing !== undefined ? { letterSpacing } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
