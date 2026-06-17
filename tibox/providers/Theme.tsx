import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

/** Theme-aware color tokens. */
export interface TiboxColors {
  ink: string;
  inkSoft: string;
  inkCard: string;
  inkCardSoft: string;
  border: string;
  rose: string;
  roseSoft: string;
  coral: string;
  gold: string;
  plum: string;
  plumDeep: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  white: string;
  overlay: string;
}

export interface ThemeGradients {
  brand: readonly [string, string];
  brandDeep: readonly [string, string];
  canvas: readonly [string, string];
  hero: readonly [string, string, string];
  gold: readonly [string, string];
  glow: readonly [string, string];
}

/* ── Palettes ── */

const dark: TiboxColors = {
  ink: "#0C100C",
  inkSoft: "#161A16",
  inkCard: "#1B201B",
  inkCardSoft: "#222722",
  border: "#2A302A",
  rose: "#8FD14F",
  roseSoft: "#A6E06A",
  coral: "#6FB23A",
  gold: "#E8C45B",
  plum: "#6FB23A",
  plumDeep: "#4C8019",
  textPrimary: "#F2F5EF",
  textSecondary: "#B9BFB4",
  textMuted: "#7E847A",
  success: "#5AB7F0",
  white: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.6)",
};

const light: TiboxColors = {
  ink: "#E9EEE3",
  inkSoft: "#F1F4ED",
  inkCard: "#FBFCFA",
  inkCardSoft: "#F4F6F1",
  border: "#DBE0D3",
  rose: "#6FB23A",
  roseSoft: "#59951F",
  coral: "#4C8019",
  gold: "#C99A2E",
  plum: "#6FB23A",
  plumDeep: "#4C8019",
  textPrimary: "#2B2D2A",
  textSecondary: "#6E706B",
  textMuted: "#9A9C97",
  success: "#2563B0",
  white: "#FFFFFF",
  overlay: "rgba(28, 34, 22, 0.42)",
};

function palette(mode: ThemeMode): TiboxColors {
  return mode === "light" ? light : dark;
}

export const lightGradients: ThemeGradients = {
  brand: ["#7AC143", "#59951F"] as const,
  brandDeep: ["#4C8019", "#6FB23A"] as const,
  canvas: ["#F1F4ED", "#E9EEE3"] as const,
  hero: ["#4C8019", "#6FB23A", "#8FD14F"] as const,
  gold: ["#C99A2E", "#E8C45B"] as const,
  glow: ["rgba(122,193,67,0.15)", "rgba(122,193,67,0.02)"] as const,
};

export const darkGradients: ThemeGradients = {
  brand: ["#A6E06A", "#6FB23A"] as const,
  brandDeep: ["#4C8019", "#6FB23A"] as const,
  canvas: ["#161A16", "#0C100C"] as const,
  hero: ["#4C8019", "#6FB23A", "#8FD14F"] as const,
  gold: ["#E8C45B", "#C99A2E"] as const,
  glow: ["rgba(143,209,79,0.25)", "rgba(143,209,79,0.04)"] as const,
};

function gradients(mode: ThemeMode): ThemeGradients {
  return mode === "light" ? lightGradients : darkGradients;
}

/* ── Provider ── */

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("tibox.theme").then((stored) => {
      if (stored === "light" || stored === "dark") {
        setMode(stored);
      }
      setHydrated(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      void AsyncStorage.setItem("tibox.theme", next);
      return next;
    });
  }, []);

  const colors = useMemo(() => palette(mode), [mode]);
  const themeGradients = useMemo(() => gradients(mode), [mode]);

  return { mode, colors, gradients: themeGradients, toggleTheme, hydrated };
});

/** Convenience hook: returns the current palette. */
export function useColors(): TiboxColors {
  const { colors } = useTheme();
  return colors;
}

/** Convenience hook: returns the current gradients. */
export function useGradients(): ThemeGradients {
  const { gradients: g } = useTheme();
  return g;
}
