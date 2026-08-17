import { useEffect } from "react";

import { onSnapshot } from "firebase/firestore";
import { create } from "zustand";

import { isEmptyProposal } from "../utils/proposals";

import { isFirebaseConfigured } from "../firebase";

import { type Proposal, proposalsRef, readData } from "./badmintonCloud";
import { useIsAdmin } from "./useMembers";

interface ProposalsStore {
  /** Návrhy čekající na schválení. Mimo admina zůstává pole prázdné – cizí návrhy nikdo jiný nepřečte. */
  proposals: Proposal[];
}

const useProposalsStore = create<ProposalsStore>(() => ({ proposals: [] }));

/**
 * Odběr návrhů čekajících na schválení. Mountuje se jednou v App, stejně jako ostatní
 * synchronizace – kromě admin stránky z něj žije i odznak s počtem v navigaci.
 */
export const useProposalsSync = () => {
  const isAdmin = useIsAdmin();

  useEffect(() => {
    // cizí návrhy smí číst jen admin, ostatním by dotaz stejně skončil na pravidlech
    if (!isFirebaseConfigured || !isAdmin) {
      useProposalsStore.setState({ proposals: [] });
      return;
    }

    return onSnapshot(
      proposalsRef(),
      snapshot => {
        const all = snapshot.docs.map(document => {
          const data = document.data();
          return { uid: document.id, email: data.email ?? document.id, ...readData(data) } satisfies Proposal;
        });
        // prázdný dokument může zůstat po schválení posledního zápasu – není co ukazovat
        useProposalsStore.setState({ proposals: all.filter(proposal => !isEmptyProposal(proposal)) });
      },
      error => console.debug("Načtení návrhů selhalo", error)
    );
  }, [isAdmin]);
};

/** Návrhy ke schválení. */
export const useProposals = () => useProposalsStore(state => state.proposals);

/** Kolik návrhů čeká na schválení – z toho se plní odznak v navigaci. */
export const usePendingCount = () => useProposalsStore(state => state.proposals.length);

export default useProposalsStore;
