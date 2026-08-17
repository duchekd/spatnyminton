import { mdiBadminton, mdiClipboardCheckOutline, mdiPodium, mdiSwordCross } from "@mdi/js";

export type SectionId = "versus" | "badminton" | "badmintonStats" | "admin";

// Adresy sekcí – jediné místo, kde se URL definují. Vychází z nich router i navigace.
export const paths = {
  versus: "/versus",
  badminton: "/badminton",
  badmintonStats: "/stats",
  admin: "/admin",
} satisfies Record<SectionId, string>;

export type Section = {
  id: SectionId;
  path: string;
  icon: string;
  /** Klíč do překladů – stejný název nese položka v navigaci i hlavička stránky. */
  labelKey: "sectionVersus" | "sectionBadminton" | "sectionStats" | "sectionAdmin";
  /** Sekce jen pro správce – ostatním se v navigaci vůbec nezobrazí. */
  adminOnly?: boolean;
};

// Sekce aplikace v pořadí, v jakém se vypisují v navigaci – nejdřív badminton (kvůli němu
// se sem chodí), losovátka až za ním a schvalování jako správcovská agenda na konci.
export const sections: Section[] = [
  { id: "badmintonStats", path: paths.badmintonStats, icon: mdiPodium, labelKey: "sectionStats" },
  { id: "badminton", path: paths.badminton, icon: mdiBadminton, labelKey: "sectionBadminton" },
  { id: "versus", path: paths.versus, icon: mdiSwordCross, labelKey: "sectionVersus" },
  { id: "admin", path: paths.admin, icon: mdiClipboardCheckOutline, labelKey: "sectionAdmin", adminOnly: true },
];

/** Sekce podle adresy – hlavička z ní bere název otevřené stránky. */
export const sectionByPath = (pathname: string) => sections.find(section => section.path === pathname);

/** Sekce, na kterou se přesměruje otevření aplikace na kořenové adrese. */
export const homePath = paths.badmintonStats;
