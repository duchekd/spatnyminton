import { ReactNode } from "react";

import { Box } from "@mui/material";

import {
  mdiArmFlexOutline,
  mdiCrownOutline,
  mdiFire,
  mdiFlashOutline,
  mdiHeartPulse,
  mdiScaleBalance,
  mdiTimerSand,
  mdiTrendingUp,
} from "@mdi/js";

import { StatsAwards } from "../../../utils/badmintonStats";
import { formatDay, formatPercent, formatSigned, plural } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

import { AwardCard, CardGrid, SectionTitle } from "./common";

type Props = {
  awards: StatsAwards;
};

// Doplňkový, méně výrazný text v druhém řádku karty (číslo, které skóre nevyjadřuje).
const Note = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ color: "text.secondary" }}>
    {children}
  </Box>
);

// Zajímavosti a rekordy – každá cena se zobrazí, jen když na ni jsou data.
const HallOfFame = ({ awards }: Props) => {
  const texts = useTexts();
  const culture = useStore(state => state.culture);

  const { mostActive, comebackKing, deuceKing, streakKing, balancedPair, longestSet, biggestWin, closestMatch } =
    awards;

  // „nejtěsnější" porovnáváme v absolutní hodnotě, ale zobrazit chceme kladné číslo
  const closestDiff = closestMatch ? Math.abs(closestMatch.diff) : 0;

  const withDay = (hint: string, day: string) => `${hint} · ${formatDay(day, culture)}`;

  return (
    <Box component="section">
      <SectionTitle>{texts.statsHallOfFame}</SectionTitle>
      <CardGrid min={250}>
        {mostActive && (
          <AwardCard
            icon={mdiArmFlexOutline}
            accent="primary"
            title={texts.awardMostActive}
            primary={mostActive.name}
            secondary={`${mostActive.value} ${plural(mostActive.value, texts.pluralMatches)}`}
            hint={texts.awardMostActiveHint}
          />
        )}

        {comebackKing && (
          <AwardCard
            icon={mdiTrendingUp}
            accent="success"
            title={texts.awardComebackKing}
            primary={comebackKing.name}
            secondary={`${comebackKing.value} ${plural(comebackKing.value, texts.pluralComebacks)}`}
            hint={texts.awardComebackKingHint}
          />
        )}

        {deuceKing && deuceKing.outOf && (
          <AwardCard
            icon={mdiCrownOutline}
            accent="warning"
            title={texts.awardDeuceKing}
            primary={deuceKing.name}
            secondary={
              <>
                {formatPercent(deuceKing.value / deuceKing.outOf, culture)}{" "}
                <Note>
                  ({deuceKing.value}/{deuceKing.outOf})
                </Note>
              </>
            }
            hint={texts.awardDeuceKingHint}
          />
        )}

        {streakKing && (
          <AwardCard
            icon={mdiFire}
            accent="error"
            title={texts.awardStreakKing}
            primary={streakKing.name}
            secondary={`${streakKing.value} ${plural(streakKing.value, texts.pluralWins)} ${texts.streakSuffix}`}
            hint={texts.awardStreakKingHint}
          />
        )}

        {balancedPair && (
          <AwardCard
            icon={mdiScaleBalance}
            accent="info"
            title={texts.awardBalancedPair}
            primary={`${balancedPair.a} ${texts.versus} ${balancedPair.b}`}
            secondary={
              <>
                {balancedPair.winsA} : {balancedPair.winsB}{" "}
                <Note>
                  ({balancedPair.matches} {plural(balancedPair.matches, texts.pluralMatches)})
                </Note>
              </>
            }
            hint={texts.awardBalancedPairHint}
          />
        )}

        {longestSet && (
          <AwardCard
            icon={mdiTimerSand}
            accent="secondary"
            title={texts.awardLongestSet}
            primary={`${longestSet.a} ${texts.versus} ${longestSet.b}`}
            secondary={
              <>
                {longestSet.score}{" "}
                <Note>
                  ({longestSet.total} {plural(longestSet.total, texts.pluralPoints)})
                </Note>
              </>
            }
            hint={withDay(texts.awardLongestSetHint, longestSet.day)}
          />
        )}

        {biggestWin && (
          <AwardCard
            icon={mdiFlashOutline}
            accent="error"
            title={texts.awardBiggestWin}
            primary={`${biggestWin.winner} ${texts.versus} ${biggestWin.loser}`}
            secondary={
              <>
                {biggestWin.score}{" "}
                <Note>
                  ({formatSigned(biggestWin.diff, culture)} {plural(biggestWin.diff, texts.pluralPoints)})
                </Note>
              </>
            }
            hint={withDay(texts.awardBiggestWinHint, biggestWin.day)}
          />
        )}

        {closestMatch && (
          <AwardCard
            icon={mdiHeartPulse}
            accent="info"
            title={texts.awardClosestMatch}
            primary={`${closestMatch.winner} ${texts.versus} ${closestMatch.loser}`}
            secondary={
              <>
                {closestMatch.score}{" "}
                <Note>
                  ({texts.statsPointDiff} {closestDiff} {plural(closestDiff, texts.pluralPoints)})
                </Note>
              </>
            }
            hint={withDay(texts.awardClosestMatchHint, closestMatch.day)}
          />
        )}
      </CardGrid>
    </Box>
  );
};

export default HallOfFame;
