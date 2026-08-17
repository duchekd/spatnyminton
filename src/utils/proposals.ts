import { Match, NameItem, NameSet } from "../hooks/useSetStore";

// Tvar badmintonových dat, který putuje do cloudu (activeId zůstává lokální).
export interface BadmintonData {
  sets: NameSet[];
  sharedItems: NameItem[];
}

export const emptyData = (): BadmintonData => ({ sets: [], sharedItems: [] });

const matchesOf = (set: NameSet): Match[] => set.matches ?? [];

const idsOf = (values: { id: string }[]) => new Set(values.map(value => value.id));

/**
 * Co má `local` navíc oproti schváleným datům – tedy návrh jednoho uživatele.
 *
 * Diff je záměrně **jen přírůstkový**: mazání ani úpravy schválených záznamů se do
 * návrhu nepromítnou. Díky tomu nemůže ne-admin nic zničit ani omylem a schvalování
 * nemusí řešit konflikty – návrh se vždycky dá přiložit k jakémukoli pozdějšímu stavu.
 */
export const diffAdditions = (local: BadmintonData, approved: BadmintonData): BadmintonData => {
  const approvedItemIds = idsOf(approved.sharedItems);
  const approvedSets = new Map(approved.sets.map(set => [set.id, set]));

  const sets: NameSet[] = [];
  local.sets.forEach(set => {
    const approvedSet = approvedSets.get(set.id);

    // turnaj, který ve schválených datech vůbec není – jde celý jako návrh
    if (!approvedSet) {
      sets.push(set);
      return;
    }

    // existující turnaj – zajímají nás jen zápasy, které v něm ještě nejsou
    const approvedMatchIds = idsOf(matchesOf(approvedSet));
    const addedMatches = matchesOf(set).filter(match => !approvedMatchIds.has(match.id));
    if (addedMatches.length > 0) sets.push({ ...set, matches: addedMatches });
  });

  return {
    sets,
    sharedItems: local.sharedItems.filter(item => !approvedItemIds.has(item.id)),
  };
};

/**
 * Přiloží návrh ke schváleným datům. Protistrana k `diffAdditions` – používá se jak při
 * schválení adminem, tak průběžně u ne-admina, aby ve svých kartách viděl i to, co ještě
 * čeká na schválení.
 *
 * Vždycky jen přidává; co v návrhu chybí, se ze schválených dat nemaže.
 */
export const mergeProposal = (approved: BadmintonData, proposal: BadmintonData): BadmintonData => {
  const approvedItemIds = idsOf(approved.sharedItems);
  // uvnitř merge pracujeme se zaručeným polem zápasů, ať se nemusí všude řešit undefined
  const sets: (NameSet & { matches: Match[] })[] = approved.sets.map(set => ({
    ...set,
    matches: [...matchesOf(set)],
  }));
  const byId = new Map(sets.map(set => [set.id, set]));

  proposal.sets.forEach(proposed => {
    const target = byId.get(proposed.id);

    // navržený turnaj zatím neexistuje – přidá se na konec
    if (!target) {
      const created = { ...proposed, matches: [...matchesOf(proposed)] };
      sets.push(created);
      byId.set(created.id, created);
      return;
    }

    const existingMatchIds = idsOf(target.matches);
    target.matches.push(...matchesOf(proposed).filter(match => !existingMatchIds.has(match.id)));
  });

  return {
    sets,
    sharedItems: [
      ...approved.sharedItems,
      ...proposal.sharedItems.filter(item => !approvedItemIds.has(item.id)),
    ],
  };
};

/** Id všech zápasů ve schválených datech – z toho se v UI pozná, co ještě čeká na schválení. */
export const approvedMatchIds = (approved: BadmintonData): Set<string> =>
  new Set(approved.sets.flatMap(set => matchesOf(set).map(match => match.id)));

/** Kolik toho návrh přináší – pro přehled v admin sekci. */
export const proposalSize = (proposal: BadmintonData) => {
  const matches = proposal.sets.reduce((total, set) => total + matchesOf(set).length, 0);
  return { sets: proposal.sets.length, matches, players: proposal.sharedItems.length };
};

/** Prázdný návrh nemá smysl posílat ani zobrazovat. */
export const isEmptyProposal = (proposal: BadmintonData) =>
  proposal.sets.length === 0 && proposal.sharedItems.length === 0;
