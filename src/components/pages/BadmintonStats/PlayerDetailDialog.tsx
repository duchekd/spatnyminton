import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { mdiCalendarCheckOutline, mdiCalendarRemoveOutline, mdiClose, mdiFire, mdiTrophyOutline } from "@mdi/js";
import Icon from "@mdi/react";

import { DayResult, PlayerDetail, PlayerStat } from "../../../utils/badmintonStats";
import { diffColor, formatDay, formatPercent, formatSigned, plural } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

import { Accent, CardGrid, FormDots, SectionTitle, StatTile, streakLabel } from "./common";
import EloChart from "./EloChart";

type Props = {
  player: PlayerStat | null;
  /** Pořadí v žebříčku (od 1) – ukazuje se v hlavičce vedle jména. */
  rank: number;
  detail: PlayerDetail | null;
  onClose: () => void;
};

// Detail jednoho hráče – to, co se do řádku žebříčku nevejde: křivka Ela, forma,
// vzájemné zápasy a nej/nejhorší hrací den.
const PlayerDetailDialog = ({ player, rank, detail, onClose }: Props) => {
  const texts = useTexts();
  const theme = useTheme();
  const culture = useStore(state => state.culture);
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // dialog se zavírá animovaně, takže na chvíli žije i bez dat – proto ta pojistka
  const open = !!player && !!detail;

  // hrací den jako hodnota dlaždice: bilance a pod ní datum
  const dayTile = (result: DayResult | null, title: string, icon: string, accent: Accent) =>
    result && (
      <StatTile
        icon={icon}
        accent={accent}
        value={`${result.wins} : ${result.losses}`}
        label={`${title} · ${formatDay(result.day, culture)}`}
      />
    );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      {player && detail && (
        <>
          <DialogTitle sx={{ pr: 6 }}>
            <Typography variant="h6" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
              {rank}. {player.name}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip size="small" label={`${texts.colElo} ${Math.round(player.elo)}`} />
              <Chip
                size="small"
                variant="outlined"
                label={`${player.matches} ${plural(player.matches, texts.pluralMatches)}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${player.wins} : ${player.losses} · ${formatPercent(player.winRate, culture)}`}
              />
            </Stack>

            <IconButton onClick={onClose} aria-label={texts.close} sx={{ position: "absolute", top: 8, right: 8 }}>
              <Icon path={mdiClose} size={1} />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            {/* Forma */}
            <Box component="section" sx={{ mb: 3 }}>
              <SectionTitle>{texts.colForm}</SectionTitle>
              <FormDots form={player.form} streak={player.streak} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {texts.formHint}
              </Typography>
            </Box>

            {/* Série a nej/nejhorší den */}
            <Box component="section" sx={{ mb: 3 }}>
              <CardGrid min={200}>
                <StatTile
                  icon={mdiFire}
                  accent={player.streak > 0 ? "success" : player.streak < 0 ? "error" : "info"}
                  value={player.streak === 0 ? "—" : Math.abs(player.streak)}
                  label={`${texts.detailStreak} · ${streakLabel(player.streak, texts)}`}
                />
                <StatTile
                  icon={mdiTrophyOutline}
                  accent="warning"
                  value={player.bestStreak}
                  label={texts.detailBestStreak}
                />
                {dayTile(detail.bestDay, texts.detailBestDay, mdiCalendarCheckOutline, "success")}
                {dayTile(detail.worstDay, texts.detailWorstDay, mdiCalendarRemoveOutline, "error")}
              </CardGrid>
            </Box>

            {/* Vývoj Ela */}
            <Box component="section" sx={{ mb: 3 }}>
              <SectionTitle>{texts.detailEloChart}</SectionTitle>
              <EloChart history={player.eloHistory} />
            </Box>

            {/* Vzájemné zápasy */}
            {detail.h2h.length > 0 && (
              <Box component="section">
                <SectionTitle>{texts.detailH2H}</SectionTitle>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{texts.colOpponent}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {texts.colBalance}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {texts.colSets}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {texts.colDiff}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.h2h.map(opponent => (
                        <TableRow key={opponent.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{opponent.name}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {opponent.wins} : {opponent.losses}
                            {opponent.draws > 0 ? ` : ${opponent.draws}` : ""}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {opponent.setsWon} : {opponent.setsLost}
                          </TableCell>
                          <TableCell align="right" sx={{ color: diffColor(opponent.diff), whiteSpace: "nowrap" }}>
                            {formatSigned(opponent.diff, culture)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

export default PlayerDetailDialog;
