/** České státní svátky pro daný rok (pevné + pohyblivé velikonoční). */

export interface Holiday {
  month: number; // 1–12
  day: number;
  name: string;
}

const FIXED: Omit<Holiday, never>[] = [
  { month: 1, day: 1, name: 'Nový rok, Den obnovy samostatného českého státu' },
  { month: 5, day: 1, name: 'Svátek práce' },
  { month: 5, day: 8, name: 'Den vítězství' },
  { month: 7, day: 5, name: 'Den slovanských věrozvěstů Cyrila a Metoděje' },
  { month: 7, day: 6, name: 'Den upálení mistra Jana Husa' },
  { month: 9, day: 28, name: 'Den české státnosti' },
  { month: 10, day: 28, name: 'Den vzniku samostatného československého státu' },
  { month: 11, day: 17, name: 'Den boje za svobodu a demokracii' },
  { month: 12, day: 24, name: 'Štědrý den' },
  { month: 12, day: 25, name: '1. svátek vánoční' },
  { month: 12, day: 26, name: '2. svátek vánoční' },
];

/** Velikonoční neděle (gregoriánský kalendář, algoritmus Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = březen, 4 = duben
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function holidaysFor(year: number): Holiday[] {
  const easter = easterSunday(year);
  const shift = (days: number, name: string): Holiday => {
    const d = new Date(easter);
    d.setDate(d.getDate() + days);
    return { month: d.getMonth() + 1, day: d.getDate(), name };
  };
  return [...FIXED, shift(-2, 'Velký pátek'), shift(1, 'Velikonoční pondělí')].sort(
    (x, y) => x.month - y.month || x.day - y.day
  );
}

export function holidayName(year: number, month: number, day: number): string | undefined {
  return holidaysFor(year).find((h) => h.month === month && h.day === day)?.name;
}
