import { useEffect } from "react";

import { doc, onSnapshot } from "firebase/firestore";
import { create } from "zustand";

import { db, isFirebaseConfigured } from "../firebase";

import useAuth from "./useAuth";

interface MembersStore {
  /** E-maily správců – vidí admin sekci a jako jediní zapisují do schválených dat. */
  admins: string[];
  /** E-maily zbytku party – smí číst data a posílat návrhy. */
  members: string[];
  /** Než dokument dorazí, nevíme, kdo je admin – synchronizace na to musí počkat. */
  loaded: boolean;
}

// Seznam party žije v dokumentu config/members, ne ve zdrojácích: repo je veřejné
// a e-maily do něj nepatří. Měnit se dá rovnou z Firebase konzole, bez redeploye.
const useMembersStore = create<MembersStore>(() => ({ admins: [], members: [], loaded: false }));

const normalize = (values: unknown): string[] =>
  Array.isArray(values) ? values.filter((v): v is string => typeof v === "string").map(v => v.toLowerCase()) : [];

/** Odběr seznamu party. Mountuje se jednou (v App), stejně jako synchronizace badmintonu. */
export const useMembersSync = () => {
  const uid = useAuth(state => state.user?.uid);

  useEffect(() => {
    // bez konfigurace i bez přihlášení jede appka lokálně – seznam party nemá co řešit
    if (!isFirebaseConfigured || !uid) {
      useMembersStore.setState({ admins: [], members: [], loaded: !isFirebaseConfigured });
      return;
    }

    return onSnapshot(
      doc(db, "config", "members"),
      snapshot => {
        const data = snapshot.data();
        useMembersStore.setState({
          admins: normalize(data?.admins),
          members: normalize(data?.members),
          loaded: true,
        });
      },
      error => {
        // chybějící dokument nebo odepřené čtení – chováme se jako běžný člen bez práv navíc
        console.debug("config/members se nepodařilo načíst", error);
        useMembersStore.setState({ admins: [], members: [], loaded: true });
      }
    );
  }, [uid]);
};

/** Je přihlášený uživatel správce? Jen pro UI – skutečnou kontrolu dělají pravidla Firestore. */
export const useIsAdmin = () => {
  const email = useAuth(state => state.user?.email);
  const admins = useMembersStore(state => state.admins);
  return !!email && admins.includes(email.toLowerCase());
};

/** Víme už, kdo je admin? Dokud ne, nemá smysl rozhodovat, kam se zapisuje. */
export const useMembersLoaded = () => useMembersStore(state => state.loaded);

export default useMembersStore;
