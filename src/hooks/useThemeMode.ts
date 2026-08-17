import { create } from "zustand";
import { persist } from "zustand/middleware";

import { adoptLegacyKey } from "../utils/storage";

export type ThemeMode = "light" | "dark";

interface ThemeModeStore {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const getSystemMode = (): ThemeMode =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const STORAGE_KEY = "spatnyMinton-theme-mode";

// nastavení z časů, kdy se appka jmenovala randomizer
adoptLegacyKey("randomizer-theme-mode", STORAGE_KEY);

const useThemeMode = create<ThemeModeStore>()(
  persist(
    set => ({
      mode: getSystemMode(),
      toggle: () => set(state => ({ mode: state.mode === "light" ? "dark" : "light" })),
      setMode: mode => set({ mode }),
    }),
    { name: STORAGE_KEY }
  )
);

export default useThemeMode;
