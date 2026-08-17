import { Box } from "@mui/material";

import {
  mdiBadminton,
  mdiCalendarMonthOutline,
  mdiFormatListNumbered,
  mdiScoreboardOutline,
  mdiTennisBall,
} from "@mdi/js";

import { StatsSummary } from "../../../utils/badmintonStats";
import { formatDecimal } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

import { CardGrid, SectionTitle, StatTile } from "./common";

type Props = {
  summary: StatsSummary;
};

// Souhrnná čísla nad žebříčkem – kolik se toho vůbec odehrálo.
const SummarySection = ({ summary }: Props) => {
  const texts = useTexts();
  const culture = useStore(state => state.culture);

  const number = (value: number) => formatDecimal(value, culture);

  // průměr se počítá jen z plných setů – když se hrály samé zkrácené, není co ukázat
  const avgSetScore =
    summary.avgSets === 0
      ? "—"
      : `${formatDecimal(summary.avgWinnerPoints, culture, 1)} : ${formatDecimal(summary.avgLoserPoints, culture, 1)}`;
  const avgSetTooltip = `${texts.sumAvgSetScoreHint} (${summary.avgSets}/${summary.sets})`;

  return (
    <Box component="section" sx={{ mb: 3 }}>
      <SectionTitle>{texts.statsSummary}</SectionTitle>
      <CardGrid min={160}>
        <StatTile icon={mdiBadminton} accent="primary" value={number(summary.matches)} label={texts.sumMatches} />
        <StatTile icon={mdiFormatListNumbered} accent="info" value={number(summary.sets)} label={texts.sumSets} />
        <StatTile icon={mdiTennisBall} accent="secondary" value={number(summary.points)} label={texts.sumPoints} />
        <StatTile
          icon={mdiScoreboardOutline}
          accent="success"
          value={avgSetScore}
          label={texts.sumAvgSetScore}
          tooltip={avgSetTooltip}
        />
        <StatTile icon={mdiCalendarMonthOutline} accent="warning" value={number(summary.days)} label={texts.sumDays} />
      </CardGrid>
    </Box>
  );
};

export default SummarySection;
