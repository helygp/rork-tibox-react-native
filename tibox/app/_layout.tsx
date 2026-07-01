import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColors, useTheme } from "@/constants/colors";
import { GiftStoreProvider } from "@/providers/GiftStore";
import { SessionProvider, useSession } from "@/providers/Session";
import { ThemeProvider } from "@/providers/Theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated, isHydrated, user } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const C = useColors();
  const { mode } = useTheme();

  useEffect(() => {
    if (!isHydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inPublic = (segments[0] as string) === "g";
    const guest = user?.isGuest ?? false;

    if (!isAuthenticated && !guest && !inAuthGroup && !inPublic) {
      router.replace("/(auth)/onboarding");
    } else if ((isAuthenticated || guest) && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isHydrated, segments, router, user]);

  useEffect(() => {
    if (isHydrated) { void SplashScreen.hideAsync(); }
  }, [isHydrated]);

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: C.ink },
      headerTintColor: C.textPrimary,
      headerTitleStyle: { fontWeight: "700" as const },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: C.ink },
      headerBackTitle: "Voltar",
    }),
    [C],
  );

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create/index" options={{ headerShown: false }} />
        <Stack.Screen name="gift/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="g/[publicId]" options={{ headerShown: false }} />
        <Stack.Screen name="gift/[id]/generating" options={{ headerShown: false }} />
        <Stack.Screen name="gift/[id]/ready" options={{ headerShown: false }} />
        <Stack.Screen name="upgrade" options={{ presentation: "modal", headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <SessionProvider>
            <GiftStoreProvider>
              <AuthGate />
            </GiftStoreProvider>
          </SessionProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
