import React, { useCallback, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/constants/colors";

interface Props {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/** 4-digit "disc" style unlock code input. */
export default function CodeInput({ value, onChange, length = 4, autoFocus }: Props) {
  const C = useColors();
  const inputRef = useRef<TextInput>(null);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, "").slice(0, length);
      onChange(digits);
    },
    [length, onChange],
  );

  const cells = useMemo(() => Array.from({ length }), [length]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row" as const,
          gap: 14,
          justifyContent: "center" as const,
        },
        cell: {
          width: 60,
          height: 72,
          borderRadius: 18,
          backgroundColor: C.inkCard,
          borderWidth: 1.5,
          borderColor: C.border,
          alignItems: "center" as const,
          justifyContent: "center" as const,
        },
        cellActive: {
          borderColor: C.rose,
          backgroundColor: C.inkCardSoft,
        },
        char: {
          color: C.textPrimary,
          fontSize: 34,
          fontWeight: "800" as const,
          lineHeight: 40,
        },
        hiddenInput: {
          position: "absolute" as const,
          opacity: 0,
          width: 1,
          height: 1,
        },
      }),
    [C],
  );

  return (
    <Pressable onPress={focus} style={styles.row}>
      {cells.map((_, i) => {
        const char = value[i] ?? "";
        const isActive = i === value.length;
        return (
          <View key={i} style={[styles.cell, (char || isActive) && styles.cellActive]}>
            <Text style={styles.char}>{char ? "\u2022" : ""}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        caretHidden
        textContentType="oneTimeCode"
        {...(Platform.OS === "web" ? { inputMode: "numeric" as const } : {})}
      />
    </Pressable>
  );
}
