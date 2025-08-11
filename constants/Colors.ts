/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Design system colors based on the UI template
export const AppColors = {
  // Primary colors from the template
  primary: "#10B981", // Green accent
  primaryDark: "#059669", // Darker green
  primaryLight: "#34D399", // Lighter green

  // Background colors
  background: "#111827", // Dark background
  surface: "#FFFFFF", // White cards/panels
  surfaceGray: "#F9FAFB", // Light gray background

  // Text colors
  textPrimary: "#1F2937", // Dark text
  textSecondary: "#6B7280", // Gray text
  textLight: "#9CA3AF", // Light gray text
  textWhite: "#FFFFFF", // White text

  // Border colors
  border: "#E5E7EB", // Light border
  borderDark: "#D1D5DB", // Darker border

  // Status colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Map colors
  mapBackground: "#374151",
  routeLine: "#10B981",
  checkpoint: "#10B981",
  userLocation: "#3B82F6",

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.2)",
  glass: "rgba(255, 255, 255, 0.95)",
};

// Legacy support for existing code
const tintColorLight = AppColors.primary;
const tintColorDark = AppColors.primary;

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    background: AppColors.surfaceGray,
    tint: tintColorLight,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppColors.textWhite,
    background: AppColors.background,
    tint: tintColorDark,
    icon: AppColors.textLight,
    tabIconDefault: AppColors.textLight,
    tabIconSelected: tintColorDark,
  },
};
