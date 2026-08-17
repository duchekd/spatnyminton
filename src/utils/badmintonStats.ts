import { Match, MatchSet, NameItem } from "../hooks/useSetStore";

// Jeden hrací den = jedna sada. Název je datum (YYYY-MM-DD), díky tomu jde
// seřadit zápasy chronologicky (potřeba pro Elo) a spočítat počet hracích dnů.
export interface StatsDay {
  name: string;
  matches: Match[];
}

// Jak zápas dopadl z pohledu jednoho hráče.
export type MatchResult = "win" | "loss" | "draw";

// Jeden zápas ve formě hráče – kromě výsledku i to, s kým a jak, ať jde ukázat v tooltipu.
export interface FormEntry {
  result: MatchResult;
  opponent: string;
  score: string; // vyhrané sety z pohledu hráče, např. „2 : 1"
  day: string;
}

// Elo po odehraném hracím dni – z těchhle bodů se kreslí křivka v detailu hráče.
export interface EloPoint {
  day: string;
  elo: number;
}

// Řádek žebříčku – vše dopočítané z odehraných zápasů.
export interface PlayerStat {
  id: string;
  name: string;
  matches: number; // odehrané zápasy
  wins: number; // vyhrané zápasy
  losses: number; // prohrané zápasy
  draws: number; // zápas skončil dělenými sety (1:1)
  winRate: number; // úspěšnost 0–1
  setsWon: number; // vyhrané sety
  setsLost: number; // prohrané sety
  setsPlayed: number; // odehrané sety (včetně nerozhodnutých)
  setDiff: number; // bilance setů
  setWinRate: number; // úspěšnost v setech 0–1
  pointsFor: number; // míčky pro
  pointsAgainst: number; // míčky proti
  pointRate: number; // úspěšnost míčků 0–1 (pro / všechny odehrané)
  diff: number; // rozdíl (pro − proti)
  pointsForPerSet: number; // míčky pro na set
  pointsAgainstPerSet: number; // míčky proti na set
  diffPerSet: number; // průměrný rozdíl na set
  elo: number; // žebříčkové body zohledňující sílu soupeře
  form: FormEntry[]; // posledních pár zápasů, od nejstaršího po nejnovější
  streak: number; // aktuální série: kladná = výhry v řadě, záporná = prohry, 0 = remíza / bez zápasu
  bestStreak: number; // nejdelší série výher
  eloHistory: EloPoint[]; // Elo po každém odehraném hracím dni
}

// Souhrnná čísla přes všechny započítané zápasy.
export interface StatsSummary {
  matches: number;
  sets: number;
  points: number;
  days: number;
  avgWinnerPoints: number; // průměrné skóre setu – vítěz setu
  avgLoserPoints: number; // průměrné skóre setu – poražený
  avgSets: number; // z kolika setů je průměr spočítaný (zkrácené sety se nepočítají)
}

export interface PlayerAward {
  name: string;
  value: number;
  outOf?: number; // z kolika (např. vyhrané prodloužené sety z odehraných)
}

export interface MatchAward {
  winner: string;
  loser: string;
  score: string; // sety z pohledu vítěze, např. „21:12, 21:9"
  diff: number; // rozdíl míčků v celém zápase
  day: string;
}

export interface SetAward {
  a: string;
  b: string;
  score: string;
  total: number; // odehrané míčky v setu
  day: string;
}

export interface PairAward {
  a: string;
  b: string;
  winsA: number;
  winsB: number;
  matches: number;
}

// Zajímavosti do síně slávy. null = na danou cenu zatím nejsou data.
export interface StatsAwards {
  mostActive: PlayerAward | null;
  comebackKing: PlayerAward | null;
  deuceKing: PlayerAward | null;
  streakKing: PlayerAward | null;
  balancedPair: PairAward | null;
  longestSet: SetAward | null;
  biggestWin: MatchAward | null;
  closestMatch: MatchAward | null;
}

export interface BadmintonStats {
  players: PlayerStat[];
  summary: StatsSummary;
  awards: StatsAwards;
}

interface Acc {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  setsWon: number;
  setsLost: number;
  setsPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  elo: number;
  comebacks: number; // výhry po prohraném prvním setu
  deuceWon: number;
  deucePlayed: number;
  form: FormEntry[];
  streak: number;
  bestStreak: number;
  eloHistory: EloPoint[];
}

interface PairAcc {
  aId: string;
  bId: string;
  winsA: number;
  winsB: number;
  matches: number;
}

// Elo: každý začíná na 1000, K je zvolené tak, aby se žebříček hýbal i při málo zápasech.
export const ELO_START = 1000;
const ELO_K = 24;

// Set přes 21 bodů znamená prodloužení (v badmintonu se za stavu 20:20 hraje na rozdíl dvou míčků).
const isDeuceSet = (gameSet: MatchSet) => Math.max(gameSet.a, gameSet.b) > 21;

// Plný set jde do 21 bodů. Kratší sety (typicky doplňkové sety do 11) by průměrné
// skóre setu stáhly dolů, takže se do něj nezapočítávají.
const isFullSet = (gameSet: MatchSet) => Math.max(gameSet.a, gameSet.b) >= 21;

// Minima, aby „úspěšnost" nevyhrál někdo s jediným šťastným setem / zápasem.
const MIN_DEUCE_SETS = 2;
const MIN_PAIR_MATCHES = 2;
// Dvě výhry po sobě ještě není šňůra, kterou má cenu vyhlašovat.
const MIN_STREAK = 3;

// Kolik posledních zápasů ukazuje sloupec „forma" v žebříčku…
export const FORM_LENGTH = 5;
// …a kolik se jich drží pro detail hráče, kde je na ně místa víc.
const FORM_HISTORY = 10;

const emptyStats = (): BadmintonStats => ({
  players: [],
  summary: { matches: 0, sets: 0, points: 0, days: 0, avgWinnerPoints: 0, avgLoserPoints: 0, avgSets: 0 },
  awards: {
    mostActive: null,
    comebackKing: null,
    deuceKing: null,
    streakKing: null,
    balancedPair: null,
    longestSet: null,
    biggestWin: null,
    closestMatch: null,
  },
});

const safeDiv = (value: number, count: number) => (count === 0 ? 0 : value / count);

// Spočítá kompletní statistiku badmintonu ze zadaných hracích dnů.
// Počítají se jen kompletní zápasy (oba hráči vyplnění) s aspoň jedním setem.
export const computeBadmintonStats = (days: StatsDay[], players: NameItem[]): BadmintonStats => {
  const labels = new Map(players.map(player => [player.id, player.label]));
  const nameOf = (id: string) => labels.get(id) ?? "—";

  const result = emptyStats();
  const { summary, awards } = result;

  const acc = new Map<string, Acc>();
  const ensure = (id: string): Acc => {
    let entry = acc.get(id);
    if (!entry) {
      entry = {
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        setsWon: 0,
        setsLost: 0,
        setsPlayed: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        elo: ELO_START,
        comebacks: 0,
        deuceWon: 0,
        deucePlayed: 0,
        form: [],
        streak: 0,
        bestStreak: 0,
        eloHistory: [],
      };
      acc.set(id, entry);
    }
    return entry;
  };

  // Zapíše zápas do formy a posune sérii: výhry v řadě se počítají kladně, prohry záporně,
  // remíza sérii ukončí (ani nepokračuje, ani nezačíná opačná).
  const record = (entry: Acc, outcome: MatchResult, opponent: string, score: string, day: string) => {
    entry.form.push({ result: outcome, opponent, score, day });
    if (outcome === "win") entry.streak = entry.streak > 0 ? entry.streak + 1 : 1;
    else if (outcome === "loss") entry.streak = entry.streak < 0 ? entry.streak - 1 : -1;
    else entry.streak = 0;
    if (entry.streak > entry.bestStreak) entry.bestStreak = entry.streak;
  };

  const pairs = new Map<string, PairAcc>();
  const playedDays = new Set<string>();
  let totalPoints = 0;
  // průměrné skóre setu se počítá jen z plných setů
  let fullSets = 0;
  let fullWinnerPoints = 0;
  let fullLoserPoints = 0;

  // chronologicky – jinak by Elo počítalo zápasy v náhodném pořadí
  const ordered = [...days].sort((x, y) => x.name.localeCompare(y.name));

  for (const day of ordered) {
    // kdo se dnes dostal na kurt – po dohrání dne jim odložíme Elo do historie
    const playedToday = new Set<string>();

    for (const match of day.matches) {
      if (!match.aId || !match.bId || match.sets.length === 0) continue;

      playedDays.add(day.name);
      playedToday.add(match.aId);
      playedToday.add(match.bId);
      const a = ensure(match.aId);
      const b = ensure(match.bId);

      let aSets = 0;
      let bSets = 0;
      let aPoints = 0;
      let bPoints = 0;

      for (const gameSet of match.sets) {
        aPoints += gameSet.a;
        bPoints += gameSet.b;
        if (gameSet.a > gameSet.b) aSets += 1;
        else if (gameSet.b > gameSet.a) bSets += 1;

        const high = Math.max(gameSet.a, gameSet.b);
        const low = Math.min(gameSet.a, gameSet.b);
        totalPoints += high + low;
        if (isFullSet(gameSet)) {
          fullSets += 1;
          fullWinnerPoints += high;
          fullLoserPoints += low;
        }

        if (isDeuceSet(gameSet)) {
          a.deucePlayed += 1;
          b.deucePlayed += 1;
          if (gameSet.a > gameSet.b) a.deuceWon += 1;
          else if (gameSet.b > gameSet.a) b.deuceWon += 1;
        }

        // nejdelší set = nejvíc odehraných míčků
        const total = gameSet.a + gameSet.b;
        if (total > 0 && (!awards.longestSet || total > awards.longestSet.total)) {
          awards.longestSet = {
            a: nameOf(match.aId),
            b: nameOf(match.bId),
            score: `${gameSet.a} : ${gameSet.b}`,
            total,
            day: day.name,
          };
        }
      }

      summary.matches += 1;
      summary.sets += match.sets.length;

      a.matches += 1;
      b.matches += 1;
      a.setsPlayed += match.sets.length;
      b.setsPlayed += match.sets.length;
      a.setsWon += aSets;
      a.setsLost += bSets;
      b.setsWon += bSets;
      b.setsLost += aSets;
      a.pointsFor += aPoints;
      a.pointsAgainst += bPoints;
      b.pointsFor += bPoints;
      b.pointsAgainst += aPoints;

      // výsledek zápasu z pohledu hráče A: 1 výhra, 0,5 remíza, 0 prohra
      let scoreA: number;
      if (aSets > bSets) {
        a.wins += 1;
        b.losses += 1;
        scoreA = 1;
      } else if (bSets > aSets) {
        b.wins += 1;
        a.losses += 1;
        scoreA = 0;
      } else {
        a.draws += 1;
        b.draws += 1;
        scoreA = 0.5;
      }

      // forma a série – skóre se ukládá v setech, pokaždé z pohledu daného hráče
      const resultA: MatchResult = scoreA === 1 ? "win" : scoreA === 0 ? "loss" : "draw";
      const resultB: MatchResult = resultA === "win" ? "loss" : resultA === "loss" ? "win" : "draw";
      record(a, resultA, nameOf(match.bId), `${aSets} : ${bSets}`, day.name);
      record(b, resultB, nameOf(match.aId), `${bSets} : ${aSets}`, day.name);

      // Elo se počítá z hodnocení PŘED zápasem, změna je pro oba stejně velká opačným směrem
      const expectedA = 1 / (1 + 10 ** ((b.elo - a.elo) / 400));
      const delta = ELO_K * (scoreA - expectedA);
      a.elo += delta;
      b.elo -= delta;

      // obrat – prohraný první set, a přesto vyhraný zápas
      const first = match.sets[0];
      if (match.sets.length >= 2) {
        if (aSets > bSets && first.b > first.a) a.comebacks += 1;
        if (bSets > aSets && first.a > first.b) b.comebacks += 1;
      }

      // vzájemná bilance dvojice (klíč nezávislý na tom, kdo byl A a kdo B)
      const [firstId, secondId] = match.aId < match.bId ? [match.aId, match.bId] : [match.bId, match.aId];
      const key = `${firstId}|${secondId}`;
      let pair = pairs.get(key);
      if (!pair) {
        pair = { aId: firstId, bId: secondId, winsA: 0, winsB: 0, matches: 0 };
        pairs.set(key, pair);
      }
      pair.matches += 1;
      if (aSets !== bSets) {
        const winnerId = aSets > bSets ? match.aId : match.bId;
        if (winnerId === firstId) pair.winsA += 1;
        else pair.winsB += 1;
      }

      // rekordní zápasy – jen ty rozhodnuté
      if (aSets !== bSets) {
        const winnerIsA = aSets > bSets;
        const highlight: MatchAward = {
          winner: nameOf(winnerIsA ? match.aId : match.bId),
          loser: nameOf(winnerIsA ? match.bId : match.aId),
          score: match.sets
            .map(gameSet => (winnerIsA ? `${gameSet.a}:${gameSet.b}` : `${gameSet.b}:${gameSet.a}`))
            .join(", "),
          diff: winnerIsA ? aPoints - bPoints : bPoints - aPoints,
          day: day.name,
        };
        if (!awards.biggestWin || highlight.diff > awards.biggestWin.diff) awards.biggestWin = highlight;
        if (!awards.closestMatch || Math.abs(highlight.diff) < Math.abs(awards.closestMatch.diff))
          awards.closestMatch = highlight;
      }
    }

    // jeden bod křivky na hrací den – uvnitř dne by body neměly osu, zápasy nemají čas
    for (const id of playedToday) {
      const entry = ensure(id);
      entry.eloHistory.push({ day: day.name, elo: entry.elo });
    }
  }

  if (acc.size === 0) return result;

  summary.points = totalPoints;
  summary.days = playedDays.size;
  summary.avgSets = fullSets;
  summary.avgWinnerPoints = safeDiv(fullWinnerPoints, fullSets);
  summary.avgLoserPoints = safeDiv(fullLoserPoints, fullSets);

  // ceny vázané na hráče
  for (const [id, v] of acc) {
    const name = nameOf(id);

    if (!awards.mostActive || v.matches > awards.mostActive.value) awards.mostActive = { name, value: v.matches };

    if (v.comebacks > 0 && (!awards.comebackKing || v.comebacks > awards.comebackKing.value))
      awards.comebackKing = { name, value: v.comebacks };

    if (v.bestStreak >= MIN_STREAK && (!awards.streakKing || v.bestStreak > awards.streakKing.value))
      awards.streakKing = { name, value: v.bestStreak };

    if (v.deucePlayed >= MIN_DEUCE_SETS) {
      const rate = v.deuceWon / v.deucePlayed;
      const best = awards.deuceKing;
      const bestRate = best ? best.value / (best.outOf ?? 1) : -1;
      if (!best || rate > bestRate || (rate === bestRate && v.deuceWon > best.value))
        awards.deuceKing = { name, value: v.deuceWon, outOf: v.deucePlayed };
    }
  }

  // nejvyrovnanější dvojice – nejtěsnější vzájemná bilance, při shodě rozhoduje víc odehraných zápasů
  const balanced = [...pairs.values()]
    .filter(pair => pair.matches >= MIN_PAIR_MATCHES)
    .sort((x, y) => Math.abs(x.winsA - x.winsB) - Math.abs(y.winsA - y.winsB) || y.matches - x.matches)[0];
  if (balanced)
    awards.balancedPair = {
      a: nameOf(balanced.aId),
      b: nameOf(balanced.bId),
      winsA: balanced.winsA,
      winsB: balanced.winsB,
      matches: balanced.matches,
    };

  result.players = [...acc.entries()].map(([id, v]) => ({
    id,
    name: nameOf(id),
    matches: v.matches,
    wins: v.wins,
    losses: v.losses,
    draws: v.draws,
    winRate: safeDiv(v.wins, v.matches),
    setsWon: v.setsWon,
    setsLost: v.setsLost,
    setsPlayed: v.setsPlayed,
    setDiff: v.setsWon - v.setsLost,
    setWinRate: safeDiv(v.setsWon, v.setsPlayed),
    pointsFor: v.pointsFor,
    pointsAgainst: v.pointsAgainst,
    pointRate: safeDiv(v.pointsFor, v.pointsFor + v.pointsAgainst),
    diff: v.pointsFor - v.pointsAgainst,
    pointsForPerSet: safeDiv(v.pointsFor, v.setsPlayed),
    pointsAgainstPerSet: safeDiv(v.pointsAgainst, v.setsPlayed),
    diffPerSet: safeDiv(v.pointsFor - v.pointsAgainst, v.setsPlayed),
    elo: v.elo,
    form: v.form.slice(-FORM_HISTORY),
    streak: v.streak,
    bestStreak: v.bestStreak,
    eloHistory: v.eloHistory,
  }));

  // nejlepší → nejhorší: výhry → vyhrané sety → rozdíl míčků → jméno
  result.players.sort(
    (x, y) => y.wins - x.wins || y.setsWon - x.setsWon || y.diff - x.diff || x.name.localeCompare(y.name)
  );

  return result;
};

// Vzájemná bilance proti jednomu soupeři.
export interface HeadToHead {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  setsWon: number;
  setsLost: number;
  diff: number; // rozdíl míčků proti tomuhle soupeři
}

// Jak hráči dopadl jeden hrací den.
export interface DayResult {
  day: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  diff: number;
}

// Podrobnosti k jednomu hráči – to, co se do žebříčku nevejde.
export interface PlayerDetail {
  h2h: HeadToHead[]; // od nejčastějšího soupeře
  days: DayResult[]; // chronologicky
  bestDay: DayResult | null;
  worstDay: DayResult | null;
}

// Rozpad výsledků jednoho hráče – po soupeřích a po hracích dnech. Počítá se zvlášť
// (a jen když je otevřený detail), protože pro žebříček by to byla zbytečná práce.
export const computePlayerDetail = (days: StatsDay[], players: NameItem[], playerId: string): PlayerDetail => {
  const labels = new Map(players.map(player => [player.id, player.label]));

  const h2h = new Map<string, HeadToHead>();
  const dayResults: DayResult[] = [];

  const ordered = [...days].sort((x, y) => x.name.localeCompare(y.name));

  for (const day of ordered) {
    const dayResult: DayResult = { day: day.name, matches: 0, wins: 0, losses: 0, draws: 0, diff: 0 };

    for (const match of day.matches) {
      if (!match.aId || !match.bId || match.sets.length === 0) continue;
      if (match.aId !== playerId && match.bId !== playerId) continue;

      // sjednotíme pohled – „mine" je vždycky sledovaný hráč
      const mineIsA = match.aId === playerId;
      const opponentId = mineIsA ? match.bId : match.aId;

      let mySets = 0;
      let theirSets = 0;
      let myPoints = 0;
      let theirPoints = 0;

      for (const gameSet of match.sets) {
        const mine = mineIsA ? gameSet.a : gameSet.b;
        const theirs = mineIsA ? gameSet.b : gameSet.a;
        myPoints += mine;
        theirPoints += theirs;
        if (mine > theirs) mySets += 1;
        else if (theirs > mine) theirSets += 1;
      }

      let entry = h2h.get(opponentId);
      if (!entry) {
        entry = {
          id: opponentId,
          name: labels.get(opponentId) ?? "—",
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          setsWon: 0,
          setsLost: 0,
          diff: 0,
        };
        h2h.set(opponentId, entry);
      }

      entry.matches += 1;
      entry.setsWon += mySets;
      entry.setsLost += theirSets;
      entry.diff += myPoints - theirPoints;

      dayResult.matches += 1;
      dayResult.diff += myPoints - theirPoints;

      if (mySets > theirSets) {
        entry.wins += 1;
        dayResult.wins += 1;
      } else if (theirSets > mySets) {
        entry.losses += 1;
        dayResult.losses += 1;
      } else {
        entry.draws += 1;
        dayResult.draws += 1;
      }
    }

    if (dayResult.matches > 0) dayResults.push(dayResult);
  }

  // nejlepší den = nejvíc výher, při shodě rozhoduje rozdíl míčků; nejhorší zrcadlově
  const [best] = [...dayResults].sort((x, y) => y.wins - x.wins || y.diff - x.diff);
  const [worst] = [...dayResults].sort((x, y) => y.losses - x.losses || x.diff - y.diff);

  // Jeden jediný hrací den není „nejlepší" ani „nejhorší" – nemá se s čím poměřovat.
  // A u neporaženého hráče by „nejhorší den" ukazoval samé výhry, což mate víc, než pomáhá.
  const comparable = dayResults.length > 1;

  return {
    h2h: [...h2h.values()].sort((x, y) => y.matches - x.matches || x.name.localeCompare(y.name)),
    days: dayResults,
    bestDay: comparable && best.wins > 0 ? best : null,
    worstDay: comparable && worst.losses > 0 ? worst : null,
  };
};
