import { create } from "zustand";

import { BadmintonData } from "../utils/proposals";

import { useSetStore } from "./useSetStore";

interface ApprovedStore {
  /** Poslední stav badminton/shared. `null` = synchronizace neběží (offline / nepřihlášeno). */
  data: BadmintonData | null;
  setApproved: (data: BadmintonData | null) => void;
}

// Schválená data držíme zvlášť od lokálního store, protože lokální store u běžného člena
// obsahuje i jeho vlastní návrhy. Statistika musí počítat jen to schválené.
const useApprovedStore = create<ApprovedStore>(set => ({
  data: null,
  setApproved: data => set({ data }),
}));

/**
 * Schválená badmintonová data. Když synchronizace neběží, není co odlišovat –
 * vrací se rovnou lokální stav, takže appka funguje i čistě offline.
 */
export const useApprovedBadminton = (): BadmintonData => {
  const approved = useApprovedStore(state => state.data);
  const scope = useSetStore(state => state.scopes.badminton);

  if (approved) return approved;
  return { sets: scope?.sets ?? [], sharedItems: scope?.sharedItems ?? [] };
};

export default useApprovedStore;
