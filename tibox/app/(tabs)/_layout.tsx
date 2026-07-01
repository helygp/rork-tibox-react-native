import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { CalendarHeart, Home, Plus, User } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { useColors, useGradients } from "@/constants/colors";

function CreateButton() {
  const router = useRouter();
  const C = useColors();
  const G = useGradients();

  const onPress = useCallback(() => {
    if (Platform.OS !== "web") { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
    router.push("/create");
  }, [router]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        createWrap: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const },
        createButton: { width: 58, height: 58, borderRadius: 20, alignItems: "center" as const, justifyContent: "center" as const, marginTop: -18, shadowColor: C.rose, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
      }),
    [C],
  );

  return (
    <Pressable onPress={onPress} style={styles.createWrap} testID="create-gift">
      <LinearGradient colors={G.brand as readonly [string, string]} style={styles.createButton}>
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
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda", tabBarIcon: ({ color }) => <CalendarHeart size={24} color={color} /> }} />
      <Tabs.Screen name="create-tab" options={{ title: "", tabBarButton: () => <CreateButton /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  );
}
