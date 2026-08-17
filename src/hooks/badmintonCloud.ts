import { collection, doc, DocumentData } from "firebase/firestore";

import { BadmintonData } from "../utils/proposals";

import { db } from "../firebase";

// Schválená data – jeden společný dokument, do kterého smí zapisovat jen admin.
export const sharedDocRef = () => doc(db, "badminton", "shared");

// Návrhy čekající na schválení – jeden dokument na uživatele, klíčem je jeho uid.
// Do svého dokumentu smí každý člen party zapisovat, číst je smí jen on a admin.
export const PROPOSALS = "badminton_proposals";
export const proposalDocRef = (uid: string) => doc(db, PROPOSALS, uid);
export const proposalsRef = () => collection(db, PROPOSALS);

// Návrh jednoho uživatele – přírůstek nad schválenými daty plus podpis autora.
export interface Proposal extends BadmintonData {
  uid: string;
  /** Kvůli zobrazení v admin sekci – uid samo o sobě nikomu nic neřekne. */
  email: string;
}

/** Bezpečné načtení dokumentu (starší nebo rozepsaná data můžou mít pole prázdná). */
export const readData = (data: DocumentData | undefined): BadmintonData => ({
  sets: data?.sets ?? [],
  sharedItems: data?.sharedItems ?? [],
});
