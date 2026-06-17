import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { CalendarHeart, Home, Plus, User } from "lucide-react-native";
import React, { useCallback } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import Colors, { Gradients } from "@/constants/colors";

function CreateButton() {
  const router = useRouter();
  const onPress = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/create");
  }, [router]);

  return (
    <Pressable onPress={onPress} style={styles.createWrap} testID="create-gift">
      <LinearGradient colors={Gradients.brand} style={styles.createButton}>
        <Plus size={30} color={Colors.white} strokeWidth={2.6} />
      </LinearGradient>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.rose,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.inkSoft,
          borderTopColor: Colors.border,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => <CalendarHeart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-tab"
        options={{
          title: "",
          tabBarButton: () => <CreateButton />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: Colors.rose,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
