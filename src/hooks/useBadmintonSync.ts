import { useEffect } from "react";

import { onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { BadmintonData, diffAdditions, emptyData, mergeProposal } from "../utils/proposals";

import { isFirebaseConfigured } from "../firebase";

import { proposalDocRef, readData, sharedDocRef } from "./badmintonCloud";
import useApprovedStore from "./useApprovedStore";
import useAuth from "./useAuth";
import { useIsAdmin, useMembersLoaded } from "./useMembers";
import { useSetStore } from "./useSetStore";

// Z badminton scope vytáhne jen to, co se synchronizuje (activeId zůstává lokální).
const localData = (): BadmintonData => {
  const scope = useSetStore.getState().scopes.badminton;
  return { sets: scope?.sets ?? [], sharedItems: scope?.sharedItems ?? [] };
};

// Stabilní otisk obsahu pro porovnání lokálního a vzdáleného stavu (echo ochrana).
const hashOf = (data: BadmintonData) => JSON.stringify(data);

const DEBOUNCE_MS = 500;

/**
 * Realtime synchronizace badmintonu s Firestore. Mountuje se jednou (v App).
 * Bez přihlášeného uživatele nebo bez konfigurace Firebase je to no-op – appka jede lokálně.
 *
 * Běží ve dvou režimech:
 * - **admin** – obousměrný sync se schválenými daty (`badminton/shared`), jako dřív;
 * - **člen party** – schválená data jen čte, vlastní přírůstky posílá jako návrh do
 *   `badminton_proposals/{uid}`. V kartách vidí schválená data i své návrhy dohromady,
 *   do statistiky se ale počítají jen ta schválená.
 */
const useBadmintonSync = () => {
  const uid = useAuth(state => state.user?.uid);
  const email = useAuth(state => state.user?.email);
  const isAdmin = useIsAdmin();
  // dokud nevíme, kdo je admin, nesmíme začít zapisovat – šlo by to do špatného dokumentu
  const membersLoaded = useMembersLoaded();

  useEffect(() => {
    if (!isFirebaseConfigured || !uid || !membersLoaded) return;

    const shared = sharedDocRef();
    // Stav, o kterém víme, že odpovídá cloudu – brání zpětnému zápisu toho,
    // co jsme právě přijali (echo smyčka).
    let syncedHash = hashOf(localData());
    let writeTimer: ReturnType<typeof setTimeout> | null = null;

    // Promítne stav z cloudu do lokálního store (jen když se opravdu liší).
    const applyLocal = (next: BadmintonData) => {
      syncedHash = hashOf(next);
      if (syncedHash !== hashOf(localData())) {
        useSetStore.getState().replaceBadmintonData(next.sets, next.sharedItems);
      }
    };

    const scheduleWrite = (flush: () => void) => {
      if (hashOf(localData()) === syncedHash) return; // beze změny nebo jen echo z cloudu
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(flush, DEBOUNCE_MS);
    };

    // ---- Admin: lokální stav je zároveň ten schválený, píše se rovnou do shared ----
    if (isAdmin) {
      const setApproved = (data: BadmintonData) => useApprovedStore.getState().setApproved(data);

      const writeShared = (data: BadmintonData) => {
        void setDoc(shared, { ...data, updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true }).catch(error =>
          console.debug("Zápis schválených dat selhal", error)
        );
      };

      const flush = () => {
        writeTimer = null;
        const local = localData();
        syncedHash = hashOf(local);
        writeShared(local);
      };

      const unsubscribeRemote = onSnapshot(shared, snapshot => {
        if (!snapshot.exists()) {
          // dokument ještě neexistuje – admin ho založí z lokálních dat
          const local = localData();
          syncedHash = hashOf(local);
          setApproved(local);
          writeShared(local);
          return;
        }

        const approved = readData(snapshot.data());
        setApproved(approved);
        applyLocal(approved);
      });

      const unsubscribeLocal = useSetStore.subscribe(() => {
        // admin nemá nic „čekajícího" – co má lokálně, je schválené (zápis doběhne za chvíli)
        if (hashOf(localData()) !== syncedHash) setApproved(localData());
        scheduleWrite(flush);
      });

      return () => {
        if (writeTimer) clearTimeout(writeTimer);
        unsubscribeRemote();
        unsubscribeLocal();
      };
    }

    // ---- Člen party: schválená data jen čte, přírůstky posílá jako návrh ----
    let approved = emptyData();
    let proposal = emptyData();
    // Dokud neznáme obojí, nesmíme sáhnout na lokální stav – přepsali bychom
    // rozpracované návrhy tím, co ze serveru ještě nedorazilo.
    let hasApproved = false;
    let hasProposal = false;

    const flush = () => {
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = null;

      // návrh = všechno, co má uživatel navíc oproti schváleným datům
      const delta = diffAdditions(localData(), approved);
      // optimisticky, ať příchozí snapshot hned nepřepíše to, co jsme právě odeslali
      proposal = delta;
      syncedHash = hashOf(localData());

      void setDoc(proposalDocRef(uid), {
        ...delta,
        uid,
        email: email ?? "",
        updatedAt: serverTimestamp(),
      }).catch(error => console.debug("Odeslání návrhu selhalo", error));
    };

    const recompute = () => {
      if (!hasApproved || !hasProposal) return;
      useApprovedStore.getState().setApproved(approved);
      applyLocal(mergeProposal(approved, proposal));
    };

    const unsubscribeApproved = onSnapshot(shared, snapshot => {
      if (writeTimer) flush(); // rozepsaný návrh musí odejít dřív, než přepíšeme lokální stav
      approved = snapshot.exists() ? readData(snapshot.data()) : emptyData();
      hasApproved = true;
      recompute();
    });

    const unsubscribeProposal = onSnapshot(
      proposalDocRef(uid),
      snapshot => {
        if (writeTimer) flush();
        // dokument zmizel = admin návrh zamítl (nebo schválil a uklidil)
        proposal = snapshot.exists() ? readData(snapshot.data()) : emptyData();
        hasProposal = true;
        recompute();
      },
      error => {
        console.debug("Načtení vlastních návrhů selhalo", error);
        hasProposal = true;
        recompute();
      }
    );

    const unsubscribeLocal = useSetStore.subscribe(() => scheduleWrite(flush));

    return () => {
      if (writeTimer) clearTimeout(writeTimer);
      unsubscribeApproved();
      unsubscribeProposal();
      unsubscribeLocal();
    };
  }, [uid, email, isAdmin, membersLoaded]);
};

export default useBadmintonSync;
