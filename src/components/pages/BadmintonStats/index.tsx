import { useMemo, useState } from "react";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

import { computeBadmintonStats, computePlayerDetail, StatsDay } from "../../../utils/badmintonStats";
import { isInPeriod, StatsPeriod } from "../../../utils/statsPeriod";
import { parseDay } from "../../../utils/utils";

import { useApprovedBadminton } from "../../../hooks/useApprovedStore";

import useTexts from "../../../languages";
import PageHeader from "../../layout/PageHeader";

import HallOfFame from "./HallOfFame";
import PeriodFilter from "./PeriodFilter";
import PlayerDetailDialog from "./PlayerDetailDialog";
import Ranking from "./Ranking";
import SummarySection from "./SummarySection";

const BadmintonStatsPage = () => {
  const texts = useTexts();

  // Záměrně jen schválená data – návrhy čekající na schválení se do žebříčků nepočítají.
  const { sets, sharedItems: items } = useApprovedBadminton();

  // Filtr se drží odznačených hráčů – nově přidaný hráč je tak automaticky ve výběru
  // a výchozí stav (nic odznačeno) znamená „všichni".
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const [period, setPeriod] = useState<StatsPeriod>("all");
  // null = „ten nejnovější" – ať se výběr nerozbije, když mezitím přibude hrací den
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);

  // hrací dny k výběru, od nejnovějšího; sady bez data se filtrovat podle času nedají
  const dayNames = useMemo(
    () =>
      sets
        .filter(set => parseDay(set.name))
        .map(set => set.name)
        .sort((x, y) => y.localeCompare(x)),
    [sets]
  );
  const hasUndatedSets = useMemo(() => sets.some(set => !parseDay(set.name)), [sets]);
  const selectedDay = pickedDay ?? dayNames[0] ?? null;

  // sady spadající do vybraného období – z nich se počítá úplně všechno níž
  const periodSets = useMemo(
    () => sets.filter(set => isInPeriod(set.name, period, selectedDay)),
    [sets, period, selectedDay]
  );

  const selectedIds = useMemo(
    () => new Set(items.filter(item => !excludedIds.has(item.id)).map(item => item.id)),
    [items, excludedIds]
  );
  const isFiltered = selectedIds.size < items.length;

  const toggle = (id: string) =>
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // hrací dny po obou filtrech (období + hráči) – stejný podklad pro žebříček i detail hráče
  const days = useMemo<StatsDay[]>(
    () =>
      periodSets.map(set => ({
        name: set.name,
        // při filtru se počítají jen vzájemné zápasy – oba hráči musí být ve výběru
        matches: (set.matches ?? []).filter(
          match => !!match.aId && !!match.bId && selectedIds.has(match.aId) && selectedIds.has(match.bId)
        ),
      })),
    [periodSets, selectedIds]
  );

  const stats = useMemo(() => computeBadmintonStats(days, items), [days, items]);

  // rozpad po soupeřích a dnech se počítá teprve při otevřeném detailu – pro žebříček je zbytečný
  const detail = useMemo(() => (detailId ? computePlayerDetail(days, items, detailId) : null), [days, items, detailId]);
  const detailIndex = stats.players.findIndex(player => player.id === detailId);

  // proč je statistika prázdná – rozlišíme „nic se nehrálo" od „výběr nedává smysl"
  const emptyText = isFiltered
    ? selectedIds.size < 2
      ? texts.statsNeedTwoSelected
      : texts.statsNoMutual
    : period !== "all"
      ? texts.statsNoPeriod
      : texts.statsEmpty;

  return (
    <>
      <PageHeader />

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, md: 3 }, boxSizing: "border-box" }}>
        {/* na širokých monitorech se obsah nerozlévá přes celou šířku */}
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          {/* za jaké období se počítá – ve výchozím stavu za celou historii */}
          <PeriodFilter
            period={period}
            onPeriodChange={setPeriod}
            days={dayNames}
            selectedDay={selectedDay}
            onDayChange={setPickedDay}
            hasUndatedSets={hasUndatedSets}
          />

          {/* výběr hráčů – ve výchozím stavu jsou vybraní všichni */}
          {items.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {texts.statsFilter}
                </Typography>
                <Button size="small" onClick={() => setExcludedIds(new Set())} disabled={!isFiltered}>
                  {texts.statsFilterAll}
                </Button>
              </Stack>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {items.map(item => {
                  const selected = selectedIds.has(item.id);
                  return (
                    <Chip
                      key={item.id}
                      label={item.label}
                      onClick={() => toggle(item.id)}
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      aria-pressed={selected}
                    />
                  );
                })}
              </Box>

              {isFiltered && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {texts.statsFilterHint}
                </Typography>
              )}
            </Paper>
          )}

          {stats.players.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
              {emptyText}
            </Typography>
          ) : (
            <>
              <SummarySection summary={stats.summary} />
              <Ranking rows={stats.players} onSelect={row => setDetailId(row.id)} />
              <HallOfFame awards={stats.awards} />
            </>
          )}
        </Box>
      </Box>

      <PlayerDetailDialog
        player={detailIndex >= 0 ? stats.players[detailIndex] : null}
        rank={detailIndex + 1}
        detail={detail}
        onClose={() => setDetailId(null)}
      />
    </>
  );
};

export default BadmintonStatsPage;
