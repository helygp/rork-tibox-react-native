import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColors, useGradients } from "@/constants/colors";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
}

export default function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  variant = "primary",
  style,
}: Props) {
  const C = useColors();
  const G = useGradients();

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [disabled, loading, onPress]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        gradient: {
          height: 56,
          borderRadius: 18,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          paddingHorizontal: 24,
        },
        ghost: {
          height: 56,
          borderRadius: 18,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          paddingHorizontal: 24,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.inkCard,
        },
        content: {
          flexDirection: "row" as const,
          alignItems: "center" as const,
          gap: 10,
        },
        label: {
          color: C.white,
          fontSize: 16,
          fontWeight: "700" as const,
        },
        labelGhost: {
          color: C.textPrimary,
        },
        pressed: {
          opacity: 0.85,
          transform: [{ scale: 0.98 }],
        },
        disabled: {
          opacity: 0.45,
        },
      }),
    [C],
  );

  const inner = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? C.white : C.rose} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, variant === "ghost" && styles.labelGhost]}>{label}</Text>
        </>
      )}
    </View>
  );

  if (variant === "ghost") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.ghost, pressed && styles.pressed, disabled && styles.disabled, style]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={G.brand as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {inner}
      </LinearGradient>
    </Pressable>
  );
}
