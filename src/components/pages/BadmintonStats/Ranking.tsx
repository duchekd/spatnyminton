import { ReactNode } from "react";

import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { FORM_LENGTH, PlayerStat } from "../../../utils/badmintonStats";
import { diffColor, formatPercent, formatSigned } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

import { FormDots, SectionTitle } from "./common";

type Props = {
  rows: PlayerStat[];
  /** Otevře detail hráče – řádek i mobilní karta na kliknutí. */
  onSelect: (row: PlayerStat) => void;
};

// zlato / stříbro / bronz pro první tři místa
const RANK_COLORS = ["#d4af37", "#9aa6b1", "#c98a52"];
const rankColor = (index: number) => RANK_COLORS[index] ?? undefined;

const headSx = { fontWeight: 700, whiteSpace: "nowrap" } as const;

// Hlavička sloupce s vysvětlením v tooltipu – tečkované podtržení naznačuje, že se dá najet myší.
const HintHead = ({ label, title }: { label: string; title: string }) => (
  <Tooltip title={title}>
    <Box component="span" sx={{ borderBottom: "1px dotted", borderColor: "divider", cursor: "help" }}>
      {label}
    </Box>
  </Tooltip>
);

// Jedna hodnota v mobilní kartě – popisek nad číslem.
const StatCell = ({ label, value, color }: { label: string; value: ReactNode; color?: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.3 }}>
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600} noWrap sx={{ color: color ?? "text.primary" }}>
      {value}
    </Typography>
  </Box>
);

// Žebříček hráčů – na širokém displeji tabulka, na mobilu karta na hráče.
const Ranking = ({ rows, onSelect }: Props) => {
  const texts = useTexts();
  const theme = useTheme();
  const culture = useStore(state => state.culture);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  // od lg je v tabulce místo na celé názvy sloupců, níž se vejdou jen zkratky
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));

  // sloupec s remízami má smysl, jen když nějaká remíza padla
  const hasDraws = rows.some(row => row.draws > 0);

  // Zkratka (Z, V, P…) se na širokém displeji rozbalí na celý název, jinak ho nabídne tooltip.
  const abbrHead = (short: string, full: string) => (isWide ? full : <HintHead label={short} title={full} />);

  const eloChip = (row: PlayerStat) => (
    <Tooltip title={texts.eloHint}>
      <Chip size="small" variant="outlined" label={`${texts.colElo} ${Math.round(row.elo)}`} />
    </Tooltip>
  );

  return (
    <Box component="section" sx={{ mb: 3 }}>
      <SectionTitle>{texts.statsRanking}</SectionTitle>

      {/* není poznat, že se do řádku dá kliknout – proto to říkáme rovnou */}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {texts.detailOpenHint}
      </Typography>

      {isMobile ? (
        <Stack spacing={1.5}>
          {rows.map((row, index) => (
            <Paper
              key={row.id}
              variant="outlined"
              onClick={() => onSelect(row)}
              sx={{ p: 1.5, cursor: "pointer" }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={800}
                  sx={{ minWidth: 24, color: rankColor(index) ?? "text.secondary" }}
                >
                  {index + 1}.
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {row.name}
                </Typography>
                {eloChip(row)}
              </Stack>

              {/* bilance výher a proher + úspěšnost */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Typography variant="h6" fontWeight={800} sx={{ flexShrink: 0 }}>
                  {row.wins} : {row.losses}
                  {hasDraws ? ` : ${row.draws}` : ""}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={row.winRate * 100}
                  sx={{ flex: 1, minWidth: 0, height: 6, borderRadius: 3 }}
                />
                <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                  {formatPercent(row.winRate, culture)}
                </Typography>
              </Stack>

              {/* forma – poslední zápasy zleva doprava */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  {texts.colForm}
                </Typography>
                <FormDots form={row.form.slice(-FORM_LENGTH)} streak={row.streak} />
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 1 }}>
                <StatCell label={texts.colMatches} value={row.matches} />
                <StatCell label={texts.colSets} value={`${row.setsWon} : ${row.setsLost}`} />
                <StatCell label={texts.colPoints} value={`${row.pointsFor} : ${row.pointsAgainst}`} />
                <StatCell label={texts.abbrPointRate} value={formatPercent(row.pointRate, culture)} />
                <StatCell
                  label={texts.colDiff}
                  value={formatSigned(row.diff, culture)}
                  color={diffColor(row.diff)}
                />
                <StatCell
                  label={texts.abbrPerSet}
                  value={formatSigned(row.diffPerSet, culture, 1)}
                  color={diffColor(row.diffPerSet)}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>#</TableCell>
                <TableCell sx={headSx}>{texts.colPlayer}</TableCell>
                <TableCell align="right" sx={headSx}>
                  {abbrHead(texts.abbrMatches, texts.colMatches)}
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {abbrHead(texts.abbrWins, texts.colWins)}
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {abbrHead(texts.abbrLosses, texts.colLosses)}
                </TableCell>
                {hasDraws && (
                  <TableCell align="right" sx={headSx}>
                    {abbrHead(texts.abbrDraws, texts.colDraws)}
                  </TableCell>
                )}
                <TableCell align="right" sx={headSx}>
                  {texts.colWinRate}
                </TableCell>
                <TableCell align="center" sx={headSx}>
                  <HintHead label={texts.colForm} title={texts.formHint} />
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {texts.colSets}
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {texts.colPoints}
                </TableCell>
                {/* „Míčky %" a „Elo" se nerozbalují – tooltip u nich vysvětluje výpočet, není to jen delší název */}
                <TableCell align="right" sx={headSx}>
                  <HintHead label={texts.abbrPointRate} title={texts.colPointRate} />
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {abbrHead(texts.abbrPerSet, texts.colDiffPerSet)}
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  {texts.colDiff}
                </TableCell>
                <TableCell align="right" sx={headSx}>
                  <HintHead label={texts.colElo} title={texts.eloHint} />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id} hover onClick={() => onSelect(row)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ color: rankColor(index) ?? "text.secondary", fontWeight: index < 3 ? 800 : 400 }}>
                    {index + 1}.
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell align="right">{row.matches}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {row.wins}
                  </TableCell>
                  <TableCell align="right">{row.losses}</TableCell>
                  {hasDraws && <TableCell align="right">{row.draws}</TableCell>}
                  <TableCell align="right">
                    <Box sx={{ display: "inline-block", minWidth: 72, verticalAlign: "middle" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPercent(row.winRate, culture)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={row.winRate * 100}
                        sx={{ height: 4, borderRadius: 2, mt: 0.25 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <FormDots form={row.form.slice(-FORM_LENGTH)} streak={row.streak} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {row.setsWon} : {row.setsLost}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {row.pointsFor} : {row.pointsAgainst}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {formatPercent(row.pointRate, culture)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: diffColor(row.diffPerSet), whiteSpace: "nowrap" }}>
                    {formatSigned(row.diffPerSet, culture, 1)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: diffColor(row.diff), whiteSpace: "nowrap" }}>
                    {formatSigned(row.diff, culture)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    {Math.round(row.elo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Ranking;
