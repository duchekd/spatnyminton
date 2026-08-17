import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { ELO_START, EloPoint } from "../../../utils/badmintonStats";
import { formatDay } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

// Souřadnicová soustava obrázku. Kreslí se do pevného viewBoxu a SVG se pak roztáhne
// na šířku rodiče – díky tomu není potřeba měřit skutečné rozměry v prohlížeči.
const WIDTH = 320;
const HEIGHT = 120;
const PAD = { top: 10, right: 8, bottom: 18, left: 34 };

// Aby plochý průběh (pár zápasů, Elo skoro beze změny) nevypadal jako horská dráha,
// má osa vždycky aspoň tenhle rozsah bodů.
const MIN_RANGE = 40;

type Props = {
  history: EloPoint[];
};

// Vývoj Ela hráče po hracích dnech. Jeden bod = stav po odehrání dne.
const EloChart = ({ history }: Props) => {
  const texts = useTexts();
  const theme = useTheme();
  const culture = useStore(state => state.culture);

  // z jednoho bodu se čára nakreslit nedá a nic by neřekla
  if (history.length < 2)
    return (
      <Typography variant="body2" color="text.secondary">
        {texts.detailEloNeedMore}
      </Typography>
    );

  const values = history.map(point => point.elo);
  const lowest = Math.min(...values, ELO_START);
  const highest = Math.max(...values, ELO_START);
  // dorovnání na minimální rozsah se rozdělí na obě strany, aby čára zůstala uprostřed
  const padding = Math.max(0, MIN_RANGE - (highest - lowest)) / 2;
  const min = lowest - padding;
  const max = highest + padding;

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index: number) => PAD.left + (index * innerWidth) / (history.length - 1);
  const y = (elo: number) => PAD.top + ((max - elo) / (max - min)) * innerHeight;

  const points = history.map((point, index) => `${x(index)},${y(point.elo)}`).join(" ");
  // plocha pod čarou – tatáž lomená čára uzavřená dolů podél spodní hrany
  const area = `${points} ${x(history.length - 1)},${PAD.top + innerHeight} ${PAD.left},${PAD.top + innerHeight}`;

  const line = theme.palette.primary.main;
  const muted = theme.palette.text.secondary;
  const startY = y(ELO_START);

  return (
    <Box>
      <Box
        component="svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={texts.detailEloChart}
        sx={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      >
        {/* startovní hodnota jako záchytný bod – nad ní jsi v plusu, pod ní v minusu */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={startY}
          y2={startY}
          stroke={muted}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <text x={PAD.left - 4} y={startY + 3} textAnchor="end" fontSize={9} fill={muted}>
          {ELO_START}
        </text>

        <polygon points={area} fill={alpha(line, 0.14)} />
        <polyline points={points} fill="none" stroke={line} strokeWidth={2} strokeLinejoin="round" />

        {history.map((point, index) => (
          <circle key={point.day} cx={x(index)} cy={y(point.elo)} r={2.5} fill={line} />
        ))}

        {/* krajní hodnoty – uprostřed by popisky jen překážely */}
        <text x={x(0)} y={HEIGHT - 5} textAnchor="start" fontSize={9} fill={muted}>
          {formatDay(history[0].day, culture)}
        </text>
        <text x={x(history.length - 1)} y={HEIGHT - 5} textAnchor="end" fontSize={9} fill={muted}>
          {formatDay(history[history.length - 1].day, culture)}
        </text>
      </Box>
    </Box>
  );
};

export default EloChart;
