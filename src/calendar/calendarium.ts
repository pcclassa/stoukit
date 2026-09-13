/** Kalendárium: mřížka měsíce s pondělím jako prvním dnem, čísly týdnů a svátky. */
import { holidayName } from './holidays';

export const MONTHS_CS = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
];

export const WEEKDAYS_CS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
export const WEEKDAYS_CS_LONG = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'];

export interface DayCell {
  date: Date;
  day: number;
  inMonth: boolean;
  weekday: number; // 0 = pondělí … 6 = neděle
  isSunday: boolean;
  isSaturday: boolean;
  holiday?: string;
}

export interface WeekRow {
  isoWeek: number;
  days: DayCell[];
}

/** ISO 8601 číslo týdne. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Vrátí řádky (týdny) pro daný měsíc; přesahy do sousedních měsíců jsou označeny inMonth=false. */
export function monthGrid(year: number, month: number): WeekRow[] {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() + 6) % 7; // pondělí = 0
  const start = new Date(year, month - 1, 1 - offset);
  const rows: WeekRow[] = [];
  const cursor = new Date(start);

  do {
    const days: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(cursor);
      const inMonth = date.getMonth() === month - 1;
      const weekday = i;
      days.push({
        date,
        day: date.getDate(),
        inMonth,
        weekday,
        isSunday: weekday === 6,
        isSaturday: weekday === 5,
        holiday: inMonth ? holidayName(year, month, date.getDate()) : undefined,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push({ isoWeek: isoWeek(days[0].date), days });
  } while (cursor.getMonth() === month - 1);

  return rows;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
