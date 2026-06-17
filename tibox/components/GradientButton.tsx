import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import Colors, { Gradients } from "@/constants/colors";

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
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [disabled, loading, onPress]);

  const inner = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? Colors.white : Colors.rose} />
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
        colors={Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {inner}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ghost: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inkCard,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  labelGhost: {
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
