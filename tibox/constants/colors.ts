/**
 * Tibox design tokens.
 *
 * Prefer the theme-aware hooks from this module:
 *   import { useColors, useGradients } from "@/constants/colors";
 *
 * The static `Colors` and `Gradients` exports below are the dark-mode defaults.
 * They remain for backward compatibility but won't react to the theme toggle.
 */

export { useColors, useGradients, useTheme } from "@/providers/Theme";

const palette = {
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
} as const;

export const Gradients = {
  brand: ["#A6E06A", "#6FB23A"] as const,
  brandDeep: ["#4C8019", "#6FB23A"] as const,
  canvas: ["#161A16", "#0C100C"] as const,
  hero: ["#4C8019", "#6FB23A", "#8FD14F"] as const,
  gold: ["#E8C45B", "#C99A2E"] as const,
  glow: ["rgba(143,209,79,0.25)", "rgba(143,209,79,0.04)"] as const,
};

const Colors = {
  ...palette,
  // Kept for template compatibility.
  light: {
    text: palette.textPrimary,
    background: palette.ink,
    tint: palette.rose,
    tabIconDefault: palette.textMuted,
    tabIconSelected: palette.rose,
  },
};

export default Colors;
