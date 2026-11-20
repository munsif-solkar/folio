import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform, TextStyle, useColorScheme, ViewStyle } from 'react-native';

import { CurrencyCode, DEFAULT_CURRENCY, isCurrencyCode } from './currency';
import { setHapticsEnabled } from './feedback';
import { setActiveCurrency } from './format';

export type ThemeMode = 'system' | 'light' | 'dark' | 'oled';
export type ResolvedTheme = 'light' | 'dark' | 'oled';
export type PeopleSort = 'newest' | 'oldest';

export type Palette = {
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  inkFaint: string;
  line: string;
  lineStrong: string;
  white: string;
  blue: string;
  blueDeep: string;
  blueSoft: string;
  blueLine: string;
  green: string;
  greenDeep: string;
  greenSoft: string;
  greenLine: string;
  red: string;
  redDeep: string;
  redSoft: string;
  redLine: string;
  amber: string;
  amberSoft: string;
  violet: string;
  violetSoft: string;
  pressed: string;
  scrim: string;
};

export const lightColors: Palette = {
  bg: '#F5F7FA',
  bgDeep: '#EDF1F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F3F8',
  surfaceStrong: '#E6EBF2',
  ink: '#14181F',
  inkSoft: '#3C4553',
  inkMuted: '#6B7686',
  inkFaint: '#98A1AF',
  line: '#E6EAF0',
  lineStrong: '#D7DEE8',
  white: '#FFFFFF',
  blue: '#1667F2',
  blueDeep: '#0B4FC4',
  blueSoft: '#E9F0FE',
  blueLine: '#CBD9EE',
  green: '#0A7A4B',
  greenDeep: '#075F3A',
  greenSoft: '#E6F5EE',
  greenLine: '#CFE9DC',
  red: '#C42B2B',
  redDeep: '#9E1F1F',
  redSoft: '#FCEBEA',
  redLine: '#F2D5D2',
  amber: '#946000',
  amberSoft: '#FFF3D8',
  violet: '#6B3FA0',
  violetSoft: '#F1E9FB',
  pressed: '#FAFBFD',
  scrim: 'rgba(13, 18, 28, 0.44)',
};

export const darkColors: Palette = {
  bg: '#0E131A',
  bgDeep: '#080C12',
  surface: '#161E28',
  surfaceMuted: '#1C2632',
  surfaceStrong: '#263241',
  ink: '#F4F7FB',
  inkSoft: '#CFD8E4',
  inkMuted: '#98A5B7',
  inkFaint: '#6E7D90',
  line: '#24303F',
  lineStrong: '#334254',
  white: '#FFFFFF',
  blue: '#2F6FE0',
  blueDeep: '#8FB8FF',
  blueSoft: '#142645',
  blueLine: '#274B7F',
  green: '#45C98C',
  greenDeep: '#82E0B3',
  greenSoft: '#10271D',
  greenLine: '#1E4A37',
  red: '#FF7E76',
  redDeep: '#FFA9A3',
  redSoft: '#2B1718',
  redLine: '#4E2724',
  amber: '#E7B65B',
  amberSoft: '#2B2210',
  violet: '#B18BE8',
  violetSoft: '#241A33',
  pressed: '#1B2532',
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export const oledColors: Palette = {
  ...darkColors,
  bg: '#000000',
  bgDeep: '#000000',
  surface: '#0A0E13',
  surfaceMuted: '#10161E',
  surfaceStrong: '#1A222D',
  line: '#1B2531',
  lineStrong: '#283443',
  pressed: '#121A24',
  scrim: 'rgba(0, 0, 0, 0.78)',
};

/** Kept as the light palette for code that needs a static default. */
export const colors = lightColors;

export const fonts = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  semibold: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
};

export const layout = {
  maxWidth: 560,
  pagePadding: 20,
};

export type Density = {
  pagePadding: number;
  listGap: number;
  cardPaddingY: number;
  entryRowMinHeight: number;
  sectionGap: number;
  heroTop: number;
};

export const regularDensity: Density = {
  pagePadding: 20,
  listGap: 9,
  cardPaddingY: 13,
  entryRowMinHeight: 68,
  sectionGap: 30,
  heroTop: 28,
};

export const compactDensity: Density = {
  pagePadding: 14,
  listGap: 6,
  cardPaddingY: 9,
  entryRowMinHeight: 54,
  sectionGap: 20,
  heroTop: 18,
};

export const shadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 1px 2px rgba(20, 24, 31, 0.04), 0 12px 32px rgba(20, 24, 31, 0.05)',
  } as ViewStyle,
  default: {
    shadowColor: '#14181F',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
}) as ViewStyle;

export const shadowSoft: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 1px 2px rgba(20, 24, 31, 0.03), 0 6px 18px rgba(20, 24, 31, 0.04)',
  } as ViewStyle,
  default: {
    shadowColor: '#14181F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
}) as ViewStyle;

export const shadowFab: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 10px 28px rgba(11, 79, 196, 0.32), 0 2px 6px rgba(11, 79, 196, 0.18)',
  } as ViewStyle,
  default: {
    shadowColor: '#0B4FC4',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
}) as ViewStyle;

export const type = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.1,
  } as TextStyle,
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
  } as TextStyle,
  heading: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
  } as TextStyle,
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.15,
  } as TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
  } as TextStyle,
  micro: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  } as TextStyle,
  number: {
    fontFamily: fonts.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.7,
  } as TextStyle,
};

export const avatarPalette = [
  { bg: '#E8F0FE', fg: '#1656BF' },
  { bg: '#E6F5EE', fg: '#0A7046' },
  { bg: '#FFF1DD', fg: '#8F5A00' },
  { bg: '#F1E9FB', fg: '#6B3FA0' },
  { bg: '#E6F4F8', fg: '#0A647F' },
  { bg: '#FCEBEF', fg: '#AC2449' },
  { bg: '#EFF3E3', fg: '#526B12' },
  { bg: '#EDEFF6', fg: '#455682' },
];

export const avatarPaletteDark = [
  { bg: '#1B2C4C', fg: '#9CC0FF' },
  { bg: '#123227', fg: '#82E0B3' },
  { bg: '#332712', fg: '#E7B65B' },
  { bg: '#291C3D', fg: '#CBA9F5' },
  { bg: '#102B36', fg: '#7FD4EA' },
  { bg: '#351720', fg: '#FF9DB5' },
  { bg: '#252C14', fg: '#C2D67C' },
  { bg: '#1C2333', fg: '#A8B8E4' },
];

export function tintFor(seed: string, dark = false) {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) {
    sum = (sum + seed.charCodeAt(i) * (i + 7)) % 9973;
  }
  const palette = dark ? avatarPaletteDark : avatarPalette;
  return palette[sum % palette.length];
}

const SETTINGS_KEY = 'folio.settings.v1';

type StoredSettings = {
  mode: ThemeMode;
  compact: boolean;
  /** Shows entry directions as debit/credit instead of gave/received. */
  creditTerms: boolean;
  /** Order of the people list on the home screen. */
  peopleSort: PeopleSort;
  /** Vibrate on taps, saves, and warnings. */
  haptics: boolean;
  /** Currency used to display every amount. */
  currency: CurrencyCode;
  /** Name printed on statements and snapshots as the sender. */
  statementName: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: Palette;
  compact: boolean;
  creditTerms: boolean;
  peopleSort: PeopleSort;
  haptics: boolean;
  currency: CurrencyCode;
  statementName: string;
  density: Density;
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  setCompact: (compact: boolean) => void;
  setCreditTerms: (creditTerms: boolean) => void;
  setPeopleSort: (sort: PeopleSort) => void;
  setHaptics: (haptics: boolean) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setStatementName: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MODES: ThemeMode[] = ['system', 'light', 'dark', 'oled'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<StoredSettings>({
    mode: 'system',
    compact: false,
    creditTerms: false,
    peopleSort: 'newest',
    haptics: true,
    currency: DEFAULT_CURRENCY,
    statementName: '',
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<StoredSettings>;
          setSettings((prev) => ({
            mode: parsed.mode && MODES.includes(parsed.mode) ? parsed.mode : prev.mode,
            compact:
              typeof parsed.compact === 'boolean' ? parsed.compact : prev.compact,
            creditTerms:
              typeof parsed.creditTerms === 'boolean'
                ? parsed.creditTerms
                : prev.creditTerms,
            peopleSort:
              parsed.peopleSort === 'newest' || parsed.peopleSort === 'oldest'
                ? parsed.peopleSort
                : prev.peopleSort,
            haptics:
              typeof parsed.haptics === 'boolean' ? parsed.haptics : prev.haptics,
            currency: isCurrencyCode(parsed.currency) ? parsed.currency : prev.currency,
            statementName:
              typeof parsed.statementName === 'string'
                ? parsed.statementName
                : prev.statementName,
          }));
        }
      } catch {
        // Settings are best-effort; the app still runs with defaults.
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {
      // Best-effort persistence.
    });
  }, [ready, settings]);

  useEffect(() => {
    setHapticsEnabled(settings.haptics);
  }, [settings.haptics]);

  const setMode = useCallback((mode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  }, []);

  const setCompact = useCallback((compact: boolean) => {
    setSettings((prev) => ({ ...prev, compact }));
  }, []);

  const setCreditTerms = useCallback((creditTerms: boolean) => {
    setSettings((prev) => ({ ...prev, creditTerms }));
  }, []);

  const setPeopleSort = useCallback((peopleSort: PeopleSort) => {
    setSettings((prev) => ({ ...prev, peopleSort }));
  }, []);

  const setHaptics = useCallback((haptics: boolean) => {
    setSettings((prev) => ({ ...prev, haptics }));
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setSettings((prev) => ({ ...prev, currency }));
  }, []);

  const setStatementName = useCallback((statementName: string) => {
    setSettings((prev) => ({ ...prev, statementName }));
  }, []);

  const { mode, compact, creditTerms, peopleSort, haptics, currency, statementName } = settings;
  // Set during render so children never paint the previous currency for a frame.
  setActiveCurrency(currency);
  const resolved: ResolvedTheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const palette =
    resolved === 'oled' ? oledColors : resolved === 'dark' ? darkColors : lightColors;
  const density = compact ? compactDensity : regularDensity;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      colors: palette,
      compact,
      creditTerms,
      peopleSort,
      haptics,
      currency,
      statementName,
      density,
      ready,
      setMode,
      setCompact,
      setCreditTerms,
      setPeopleSort,
      setHaptics,
      setCurrency,
      setStatementName,
    }),
    [
      compact,
      creditTerms,
      currency,
      statementName,
      density,
      haptics,
      mode,
      palette,
      peopleSort,
      ready,
      resolved,
      setCompact,
      setCreditTerms,
      setCurrency,
      setHaptics,
      setPeopleSort,
      setMode,
      setStatementName,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
