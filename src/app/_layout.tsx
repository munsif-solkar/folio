import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { StoreProvider, useStore } from '@/lib/store';
import { ThemeProvider, useTheme, useThemedStyles } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {fontsReady ? (
          <StoreProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </StoreProvider>
        ) : (
          <LoadingScreen />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[baseStyles.loading, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.blue} />
    </View>
  );
}

function AppShell() {
  const { hydrated } = useStore();
  const { ready, resolved } = useTheme();
  const themed = useThemedStyles(createStyles);

  useEffect(() => {
    if (hydrated && ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated, ready]);

  if (!hydrated) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={resolved === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: themed.stack,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="new-person"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}

const baseStyles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const createStyles = (colors: import('@/lib/theme').Palette) => ({
  stack: { backgroundColor: colors.bg },
});
