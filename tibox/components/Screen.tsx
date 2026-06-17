import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useGradients } from "@/providers/Theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Atmospheric canvas with soft brand glow at the top — theme-aware. */
export default function Screen({ children, style }: Props) {
  const gradients = useGradients();

  return (
    <LinearGradient colors={gradients.canvas as readonly [string, string]} style={styles.fill}>
      <LinearGradient
        colors={gradients.glow as readonly [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
        pointerEvents="none"
      />
      <View style={[styles.content, style]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  content: {
    flex: 1,
  },
});
