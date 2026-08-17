import { parseDay } from "./utils";

/** Období, za které se počítá statistika. „day" je jeden konkrétní hrací den. */
export type StatsPeriod = "all" | "year" | "days30" | "day";

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

/**
 * Patří hrací den (název sady) do vybraného období?
 *
 * Sady, které nemají v názvu datum (admin je přejmenoval ručně), umí zařadit jen „vše" –
 * kamkoli jinam bychom je strkali odhadem a statistika by tiše počítala něco jiného, než říká.
 */
export const isInPeriod = (name: string, period: StatsPeriod, selectedDay: string | null, now = new Date()) => {
  if (period === "all") return true;
  if (period === "day") return name === selectedDay;

  const date = parseDay(name);
  if (!date) return false;
  if (period === "year") return date.getFullYear() === now.getFullYear();
  return now.getTime() - date.getTime() <= DAYS_30;
};
