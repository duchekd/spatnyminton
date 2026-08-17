import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { StatsPeriod } from "../../../utils/statsPeriod";
import { formatDay } from "../../../utils/utils";

import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";

type Props = {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  /** Dostupné hrací dny (názvy sad), od nejnovějšího. */
  days: string[];
  selectedDay: string | null;
  onDayChange: (day: string) => void;
  /** Existuje sada bez data v názvu? Pak má smysl vysvětlit, proč v období zmizela. */
  hasUndatedSets: boolean;
};

// Za jaké období se statistika počítá. Bez výběru se počítá všechno, jako dřív.
const PeriodFilter = ({ period, onPeriodChange, days, selectedDay, onDayChange, hasUndatedSets }: Props) => {
  const texts = useTexts();
  const culture = useStore(state => state.culture);

  const options: { value: StatsPeriod; label: string }[] = [
    { value: "all", label: texts.periodAll },
    { value: "year", label: texts.periodYear },
    { value: "days30", label: texts.periodDays30 },
    { value: "day", label: texts.periodDay },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {texts.statsPeriod}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={period}
          // klik na už vybrané tlačítko vrací null – v tom případě necháme výběr být
          onChange={(_, value: StatsPeriod | null) => value && onPeriodChange(value)}
          sx={{ flexWrap: "wrap" }}
        >
          {options.map(option => (
            <ToggleButton
              key={option.value}
              value={option.value}
              disabled={option.value === "day" && days.length === 0}
            >
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* výběr konkrétního dne dává smysl jen v režimu „hrací den" */}
        {period === "day" && days.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{texts.periodDay}</InputLabel>
            <Select
              label={texts.periodDay}
              value={selectedDay ?? days[0]}
              onChange={event => onDayChange(event.target.value)}
            >
              {days.map(day => (
                <MenuItem key={day} value={day}>
                  {formatDay(day, culture)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {period !== "all" && hasUndatedSets && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {texts.periodHint}
        </Typography>
      )}
    </Paper>
  );
};

export default PeriodFilter;
