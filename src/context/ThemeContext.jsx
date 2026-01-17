import { createContext, useContext, useEffect, useState } from "react";

// 🎨 All Color Palettes
const colorPalettes = {
  professional: {
    primary: "#2563eb", // blue-600
    accent: "#f59e0b", // amber-500
    success: "#10b981", // emerald-500
    warning: "#f59e0b", // amber-500
    danger: "#ef4444", // red-500
    backgroundLight: "#f8fafc", // slate-50
    backgroundDark: "#0f172a", // slate-900
    surfaceLight: "#ffffff",
    surfaceDark: "#1e293b", // slate-800
    textLight: "#1e293b", // slate-800
    textDark: "#f1f5f9", // slate-100
    borderLight: "#e2e8f0", // slate-200
    borderDark: "#334155", // slate-700
    hoverLight: "#e0e7ff", // indigo-100
    hoverDark: "#475569", // slate-600
    activeLight: "#bfdbfe", // blue-200
    activeDark: "#3b82f6", // blue-500
  },
  modern: {
    primary: "#7c3aed", // violet-600
    accent: "#06b6d4", // cyan-500
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    backgroundLight: "#fafafa",
    backgroundDark: "#09090b",
    surfaceLight: "#ffffff",
    surfaceDark: "#18181b",
    textLight: "#18181b",
    textDark: "#fafafa",
    borderLight: "#e4e4e7",
    borderDark: "#27272a",
    hoverLight: "#f3e8ff",
    hoverDark: "#3f3f46",
    activeLight: "#c4b5fd",
    activeDark: "#8b5cf6",
  },
  tech: {
    primary: "#059669",
    accent: "#f97316",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#dc2626",
    backgroundLight: "#f0fdf4",
    backgroundDark: "#0c1e0f",
    surfaceLight: "#ffffff",
    surfaceDark: "#1a2e1a",
    textLight: "#14532d",
    textDark: "#dcfce7",
    borderLight: "#bbf7d0",
    borderDark: "#166534",
    hoverLight: "#dcfce7",
    hoverDark: "#15803d",
    activeLight: "#86efac",
    activeDark: "#22c55e",
  },
  elegant: {
    primary: "#4f46e5",
    accent: "#ec4899",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    backgroundLight: "#f9fafb",
    backgroundDark: "#111827",
    surfaceLight: "#ffffff",
    surfaceDark: "#1f2937",
    textLight: "#111827",
    textDark: "#f9fafb",
    borderLight: "#d1d5db",
    borderDark: "#374151",
    hoverLight: "#f3f4f6",
    hoverDark: "#4b5563",
    activeLight: "#c7d2fe",
    activeDark: "#6366f1",
  },
  warm: {
    primary: "#ea580c",
    accent: "#0891b2",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    backgroundLight: "#fffbeb",
    backgroundDark: "#1c1917",
    surfaceLight: "#ffffff",
    surfaceDark: "#292524",
    textLight: "#1c1917",
    textDark: "#fafaf9",
    borderLight: "#e7e5e4",
    borderDark: "#44403c",
    hoverLight: "#fef3c7",
    hoverDark: "#57534e",
    activeLight: "#fed7aa",
    activeDark: "#f97316",
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 🌗 Get saved theme + palette
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    return savedTheme;
  };

  const getInitialPalette = () => {
    const savedPalette = localStorage.getItem("palette") || "tech";
    return savedPalette;
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);

  useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
    }

    localStorage.setItem("theme", theme);
    localStorage.setItem("palette", palette);
  }, [theme, palette]);

  // 🔄 Toggle light/dark
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // 🎨 Change palette
  const changePalette = (newPalette) => setPalette(newPalette);

  // 🖌️ Extract active palette colors
  const currentPalette = colorPalettes[palette];
  const themeColors = {
    light: {
      background: currentPalette.backgroundLight,
      surface: currentPalette.surfaceLight,
      text: currentPalette.textLight,
      border: currentPalette.borderLight,
      primary: currentPalette.primary,
      accent: currentPalette.accent,
      hover: {
        background: currentPalette.hoverLight,
        text: currentPalette.textLight,
      },
      active: {
        background: currentPalette.activeLight,
        text: currentPalette.primary,
      },
    },
    dark: {
      background: currentPalette.backgroundDark,
      surface: currentPalette.surfaceDark,
      text: currentPalette.textDark,
      border: currentPalette.borderDark,
      primary: currentPalette.primary,
      accent: currentPalette.accent,
      hover: {
        background: currentPalette.hoverDark,
        text: currentPalette.textDark,
      },
      active: {
        background: currentPalette.activeDark,
        text: currentPalette.surfaceDark,
      },
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        palette,
        changePalette,
        themeColors: themeColors[theme],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
