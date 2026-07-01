import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { CalendarHeart, Home, Plus, User } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors, useGradients } from "@/constants/colors";

function CreateFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const G = useGradients();

  const onPress = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    router.push("/create");
  }, [router]);

  const tabBarHeight = Platform.OS === "ios" ? 88 : 64;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: "absolute" as const,
          right: 20,
          bottom: tabBarHeight + insets.bottom * 0.15 + 16,
          width: 60,
          height: 60,
          borderRadius: 20,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          shadowColor: C.rose,
          shadowOpacity: 0.5,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        },
      }),
    [C, insets.bottom, tabBarHeight],
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]} testID="create-gift">
      <LinearGradient colors={G.brand as readonly [string, string]} style={styles.fab}>
        <Plus size={30} color={C.white} strokeWidth={2.6} />
      </LinearGradient>
    </Pressable>
  );
}

export default function TabLayout() {
  const C = useColors();

  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      tabBarActiveTintColor: C.rose,
      tabBarInactiveTintColor: C.textMuted,
      tabBarStyle: {
        backgroundColor: C.inkSoft,
        borderTopColor: C.border,
        height: Platform.OS === "ios" ? 88 : 64,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
    }),
    [C],
  );

  return (
    <>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
        <Tabs.Screen name="agenda" options={{ title: "Agenda", tabBarIcon: ({ color }) => <CalendarHeart size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
        <Tabs.Screen name="create-tab" options={{ href: null }} />
      </Tabs>
      <CreateFab />
    </>
  );
}
