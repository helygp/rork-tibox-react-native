import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Colors from "@/constants/colors";
import { GiftStoreProvider } from "@/providers/GiftStore";
import { SessionProvider, useSession } from "@/providers/Session";
import { ThemeProvider } from "@/providers/Theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated, isHydrated, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

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
    if (isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.ink },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.ink },
        headerBackTitle: "Voltar",
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="gift/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="g/[publicId]" options={{ headerShown: false }} />
      <Stack.Screen name="gift/[id]/generating" options={{ headerShown: false }} />
      <Stack.Screen name="gift/[id]/ready" options={{ headerShown: false }} />
      <Stack.Screen name="upgrade" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
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
