export const appName = import.meta.env.VITE_APP_NAME;

// Vybere správný tvar podle počtu: [1, 2–4, 5+]. Stejné dělení sedí i angličtině
// (1 → jednotné číslo, zbytek množné), takže stačí jedna funkce pro oba jazyky.
export const plural = (count: number, forms: string[]) => {
  const n = Math.abs(count);
  if (n === 1) return forms[0];
  if (n >= 2 && n <= 4) return forms[1];
  return forms[2];
};

// Název sady u badmintonu je datum (YYYY-MM-DD). Ručně přejmenovaná sada datum nemá – vrátí null.
export const parseDay = (name: string): Date | null => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(name);
  if (!parts) return null;
  return new Date(+parts[1], +parts[2] - 1, +parts[3]);
};

// Datum sady v lokálním formátu. Cokoli jiného (ručně pojmenovaná sada) vrátíme beze změny.
export const formatDay = (name: string, culture: string) => parseDay(name)?.toLocaleDateString(culture) ?? name;

// Zaokrouhlí na daný počet desetinných míst a naformátuje dle lokalizace.
// „|| 0" srovná záporná nula (−0,0) na obyčejnou nulu.
export const formatDecimal = (value: number, culture: string, digits = 0) => {
  const rounded = Number(value.toFixed(digits)) || 0;
  return rounded.toLocaleString(culture, { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

// Číslo se znaménkem – kladná hodnota dostane „+", aby šel rozdíl přečíst na první pohled.
export const formatSigned = (value: number, culture: string, digits = 0) => {
  const rounded = Number(value.toFixed(digits)) || 0;
  return (rounded > 0 ? "+" : "") + formatDecimal(rounded, culture, digits);
};

// Podíl 0–1 jako procenta – lokalizace řeší i mezeru před znakem („62 %" vs „62%").
export const formatPercent = (value: number, culture: string) =>
  value.toLocaleString(culture, { style: "percent", maximumFractionDigits: 0 });

// Barva pro kladný / záporný rozdíl (klíč do palety, ne konkrétní barva).
export const diffColor = (value: number) =>
  value > 0 ? "success.main" : value < 0 ? "error.main" : "text.secondary";
