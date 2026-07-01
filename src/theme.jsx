import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "rowdy-theme-mode";

// Shared (mode-independent) brand tokens.
const shared = {
  accentGrad: "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
  accentText: "#020617",
  // The signature pad is always captured on white for legibility.
  sigPadBg: "#ffffff",
  radius: 16,
};

const dark = {
  ...shared,
  mode: "dark",
  pageBg: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",

  cardBg: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.1)",
  nestedBg: "rgba(15,23,42,0.8)",
  nestedBorder: "rgba(255,255,255,0.08)",

  inputBg: "rgba(2,6,23,0.95)",
  inputBorder: "rgba(255,255,255,0.1)",

  subtleBg: "rgba(255,255,255,0.06)",
  subtleBorder: "rgba(255,255,255,0.1)",
  subtleText: "#e2e8f0",

  primaryBtnBg: "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
  primaryBtnText: "#020617",

  successText: "#86efac",
  successBg: "rgba(21,128,61,0.12)",
  successBorder: "rgba(34,197,94,0.2)",

  infoText: "#93c5fd",
  infoBg: "rgba(30,64,175,0.12)",
  infoBorder: "rgba(59,130,246,0.2)",

  cyanText: "#67e8f9",
  cyanBg: "rgba(6,182,212,0.12)",
  cyanBorder: "rgba(34,211,238,0.22)",

  dangerText: "#fca5a5",
  dangerBg: "rgba(127,29,29,0.25)",
  dangerBorder: "rgba(248,113,113,0.25)",

  heroGrad:
    "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(59,130,246,0.08), rgba(16,185,129,0.14))",
  heroSubtext: "#dbeafe",

  popoverBg: "#0f172a",
  popoverDivider: "rgba(255,255,255,0.06)",
  modalBg: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
  overlay: "rgba(2,6,23,0.7)",

  tableHeadBg: "rgba(255,255,255,0.04)",
  tableRowAlt: "rgba(255,255,255,0.02)",

  shadowLg: "0 20px 50px rgba(0,0,0,0.35)",
  shadowMd: "0 16px 40px rgba(0,0,0,0.35)",
};

const light = {
  ...shared,
  mode: "light",
  pageBg: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",

  cardBg: "#ffffff",
  cardBorder: "#e2e8f0",
  nestedBg: "#f8fafc",
  nestedBorder: "#e5e7eb",

  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",

  subtleBg: "#f1f5f9",
  subtleBorder: "#e2e8f0",
  subtleText: "#334155",

  primaryBtnBg: "linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)",
  primaryBtnText: "#ffffff",

  successText: "#15803d",
  successBg: "rgba(34,197,94,0.10)",
  successBorder: "rgba(34,197,94,0.35)",

  infoText: "#1d4ed8",
  infoBg: "rgba(59,130,246,0.08)",
  infoBorder: "rgba(59,130,246,0.30)",

  cyanText: "#0e7490",
  cyanBg: "rgba(6,182,212,0.08)",
  cyanBorder: "rgba(8,145,178,0.30)",

  dangerText: "#b91c1c",
  dangerBg: "rgba(239,68,68,0.08)",
  dangerBorder: "rgba(239,68,68,0.30)",

  heroGrad:
    "linear-gradient(135deg, rgba(34,211,238,0.22), rgba(59,130,246,0.14), rgba(16,185,129,0.22))",
  heroSubtext: "#1e40af",

  popoverBg: "#ffffff",
  popoverDivider: "#f1f5f9",
  modalBg: "#ffffff",
  overlay: "rgba(15,23,42,0.45)",

  tableHeadBg: "#f1f5f9",
  tableRowAlt: "#f8fafc",

  shadowLg: "0 20px 50px rgba(15,23,42,0.12)",
  shadowMd: "0 16px 40px rgba(15,23,42,0.15)",
};

const THEMES = { dark, light };

const ThemeContext = createContext({
  mode: "dark",
  t: dark,
  toggleTheme: () => {},
  setMode: () => {},
});

function readInitialMode() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    // Keeps native controls (date pickers, scrollbars) in sync with the theme.
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      t: THEMES[mode],
      setMode,
      toggleTheme: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
