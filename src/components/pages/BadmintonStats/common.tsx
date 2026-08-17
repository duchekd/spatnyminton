import { ReactNode } from "react";

import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import Icon from "@mdi/react";

import { FormEntry, MatchResult } from "../../../utils/badmintonStats";
import { formatDay, plural } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";
import { Lang } from "../../../languages/csCZ";

/** Barevný akcent karty – klíč do palety motivu, funguje ve světlém i tmavém režimu. */
export type Accent = "primary" | "secondary" | "success" | "warning" | "info" | "error";

/** Ikona v jemně podbarveném čtverci – sjednocuje vzhled dlaždic i karet síně slávy. */
export const IconBadge = ({ path, accent }: { path: string; accent: Accent }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 2,
      display: "grid",
      placeItems: "center",
      color: `${accent}.main`,
      bgcolor: theme => alpha(theme.palette[accent].main, 0.14),
    }}
  >
    <Icon path={path} size={1} />
  </Box>
);

/** Barva výsledku – remíza je záměrně tlumená, aby v řadě teček nekřičela. */
const RESULT_COLOR: Record<MatchResult, string> = {
  win: "success.main",
  loss: "error.main",
  draw: "text.disabled",
};

/** Slovní popis série: „3 výhry v řadě" / „2 prohry v řadě". Nula = série právě skončila remízou. */
export const streakLabel = (streak: number, texts: Lang) => {
  if (streak === 0) return texts.streakNone;
  const count = Math.abs(streak);
  const forms = streak > 0 ? texts.pluralWins : texts.pluralLosses;
  return `${count} ${plural(count, forms)} ${texts.streakSuffix}`;
};

/**
 * Forma hráče jako řada teček (vlevo nejstarší zápas). Za nimi se u delší série ukáže
 * i její délka – jinak by z teček nebylo poznat, že šňůra pokračuje z dřívějška.
 */
export const FormDots = ({ form, streak }: { form: FormEntry[]; streak?: number }) => {
  const texts = useTexts();
  const culture = useStore(state => state.culture);

  const resultLabel: Record<MatchResult, string> = {
    win: texts.resultWin,
    loss: texts.resultLoss,
    draw: texts.resultDraw,
  };

  // krátkou sérii (jeden dva zápasy) přečteš z teček samotných, tam by číslo jen překáželo
  const showStreak = streak !== undefined && Math.abs(streak) >= 2;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: "inline-flex" }}>
      {form.map((entry, index) => (
        <Tooltip
          key={index}
          title={`${resultLabel[entry.result]} ${entry.score} · ${entry.opponent} · ${formatDay(entry.day, culture)}`}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              borderRadius: "50%",
              cursor: "help",
              bgcolor: RESULT_COLOR[entry.result],
            }}
          />
        </Tooltip>
      ))}

      {showStreak && (
        <Tooltip title={streakLabel(streak, texts)}>
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{ ml: 0.25, cursor: "help", color: streak > 0 ? "success.main" : "error.main" }}
          >
            {streak > 0 ? "▲" : "▼"}
            {Math.abs(streak)}
          </Typography>
        </Tooltip>
      )}
    </Stack>
  );
};

/** Nadpis sekce statistiky. */
export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="overline"
    component="h2"
    color="text.secondary"
    sx={{ display: "block", fontWeight: 700, letterSpacing: 1.2, mb: 1 }}
  >
    {children}
  </Typography>
);

/** Responzivní mřížka karet – počet sloupců si dopočítá podle šířky. */
export const CardGrid = ({ min, children }: { min: number; children: ReactNode }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 1.5 }}>
    {children}
  </Box>
);

/** Dlaždice souhrnu – ikona, velké číslo, popisek. */
export const StatTile = ({
  icon,
  accent,
  value,
  label,
  tooltip,
}: {
  icon: string;
  accent: Accent;
  value: ReactNode;
  label: string;
  /** vysvětlení, jak se číslo počítá – jen u dlaždic, kde to není zřejmé */
  tooltip?: string;
}) => {
  const tile = (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", cursor: tooltip ? "help" : undefined }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <IconBadge path={icon} accent={accent} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2} noWrap>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  return tooltip ? <Tooltip title={tooltip}>{tile}</Tooltip> : tile;
};

/** Karta síně slávy – co se vyhrálo, kdo, s jakým číslem a proč. */
export const AwardCard = ({
  icon,
  accent,
  title,
  primary,
  secondary,
  hint,
}: {
  icon: string;
  accent: Accent;
  title: string;
  primary: ReactNode;
  secondary?: ReactNode;
  hint: string;
}) => (
  <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <IconBadge path={icon} accent={accent} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ display: "block", color: `${accent}.main`, fontWeight: 700, letterSpacing: 0.6, lineHeight: 1.4 }}
        >
          {title.toUpperCase()}
        </Typography>
        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.35, overflowWrap: "anywhere" }}>
          {primary}
        </Typography>
        {secondary !== undefined && (
          <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
            {secondary}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);
