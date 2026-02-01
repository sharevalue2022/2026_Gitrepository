import { Platform } from "react-native";

export const AppColors = {
  primary: "#0A0A0A",
  accent: "#D4AF37",
  accentLight: "#F5D77A",
  background: "#0A0A0A",
  surface: "#141414",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  border: "#2A2A2A",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
    buttonText: "#0A0A0A",
    tabIconDefault: "#6B7280",
    tabIconSelected: AppColors.accent,
    link: AppColors.accent,
    accent: AppColors.accent,
    success: AppColors.success,
    error: AppColors.error,
    border: "#2A2A2A",
    backgroundRoot: "#0A0A0A",
    backgroundDefault: "#141414",
    backgroundSecondary: "#1F1F1F",
    backgroundTertiary: "#2A2A2A",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
    buttonText: "#0A0A0A",
    tabIconDefault: "#6B7280",
    tabIconSelected: AppColors.accent,
    link: AppColors.accent,
    accent: AppColors.accent,
    success: "#34D399",
    error: "#F87171",
    border: "#2A2A2A",
    backgroundRoot: "#0A0A0A",
    backgroundDefault: "#141414",
    backgroundSecondary: "#1F1F1F",
    backgroundTertiary: "#2A2A2A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
