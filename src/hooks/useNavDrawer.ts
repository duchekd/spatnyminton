import { create } from "zustand";

interface NavDrawerStore {
  open: boolean;
  openNav: () => void;
  closeNav: () => void;
}

// Stav levého navigačního menu. Je globální, aby ho mohla otevřít kterákoli lišta bez protahování propů.
const useNavDrawer = create<NavDrawerStore>(set => ({
  open: false,
  openNav: () => set({ open: true }),
  closeNav: () => set({ open: false }),
}));

export default useNavDrawer;
