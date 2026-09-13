/**
 * Vykreslení jedné strany kalendáře (obálka nebo měsíc) do DOM v milimetrech.
 * Stejný kód slouží náhledu v editoru i tiskovému výstupu.
 */
import { MONTHS_CS, WEEKDAYS_CS, monthGrid } from './calendarium';
import { holidaysFor } from './holidays';
import type { CalendarProject, Slot } from './store';

export const A3 = { short: 297, long: 420 };
export const SLUG = 5; // prostor pro ořezové značky za spadávkou, mm

export interface SheetGeometry {
  trimW: number;
  trimH: number;
  bleed: number;
  slug: number;
  sheetW: number;
  sheetH: number;
}

/** Geometrie archu. Náhled (forPrint=false) zobrazuje spadávku, ale bez slugu se značkami. */
export function geometry(p: CalendarProject, forPrint: boolean): SheetGeometry {
  const trimW = p.orientation === 'portrait' ? A3.short : A3.long;
  const trimH = p.orientation === 'portrait' ? A3.long : A3.short;
  const bleed = p.print.bleed;
  const slug = forPrint && p.print.cropMarks ? SLUG : 0;
  const pad = bleed + slug;
  return { trimW, trimH, bleed, slug, sheetW: trimW + 2 * pad, sheetH: trimH + 2 * pad };
}

function photoStyle(slot: Slot): string {
  return `object-position:${slot.posX}% ${slot.posY}%;transform:scale(${slot.zoom});transform-origin:${slot.posX}% ${slot.posY}%`;
}

/**
 * Vytvoří arch (sheet) s jednou stranou. `imageUrl` je object URL fotky, nebo undefined.
 */
export function renderSheet(
  p: CalendarProject,
  slot: Slot,
  imageUrl: string | undefined,
  forPrint: boolean
): HTMLElement {
  const g = geometry(p, forPrint);
  const sheet = document.createElement('section');
  sheet.className = `cal-sheet cal-sheet--${p.orientation}${forPrint ? ' cal-sheet--print' : ''}`;
  sheet.style.width = `${g.sheetW}mm`;
  sheet.style.height = `${g.sheetH}mm`;
  sheet.style.setProperty('--bleed', `${g.bleed}mm`);
  sheet.style.setProperty('--slug', `${g.slug}mm`);
  sheet.style.setProperty('--trim-w', `${g.trimW}mm`);
  sheet.style.setProperty('--trim-h', `${g.trimH}mm`);
  sheet.style.setProperty('--binding', `${p.print.bindingMargin}mm`);

  if (g.slug > 0) sheet.append(cropMarks(g));

  const page = document.createElement('div');
  page.className = `cal-page ${slot.index === 0 ? 'cal-page--cover' : 'cal-page--month'}`;
  page.style.left = `${g.slug}mm`;
  page.style.top = `${g.slug}mm`;
  page.style.width = `${g.trimW + 2 * g.bleed}mm`;
  page.style.height = `${g.trimH + 2 * g.bleed}mm`;

  const photo = document.createElement('div');
  photo.className = 'cal-photo';
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    img.setAttribute('style', photoStyle(slot));
    photo.append(img);
  } else {
    photo.classList.add('cal-photo--empty');
    photo.innerHTML = `<span>${slot.index === 0 ? 'Fotka na obálku' : MONTHS_CS[slot.index - 1]}<br><small>přetáhni sem fotku</small></span>`;
  }
  page.append(photo);

  if (slot.index === 0) {
    page.append(coverBody(p));
  } else {
    page.append(monthBody(p, slot));
  }

  if (!forPrint) {
    const trim = document.createElement('div');
    trim.className = 'cal-trim';
    page.append(trim);
  }

  sheet.append(page);
  return sheet;
}

function coverBody(p: CalendarProject): HTMLElement {
  const body = document.createElement('div');
  body.className = 'cal-cover';
  body.innerHTML = `
    <div class="cal-cover__text">
      <h1 class="cal-cover__title">${escape(p.title)}</h1>
      <p class="cal-cover__subtitle">${escape(p.subtitle)}</p>
    </div>
    <div class="cal-cover__brand">
      <img src="./brand/fusbobo-logo-white.png" alt="Fus Bobo" />
      <span>www.stouniky.com</span>
    </div>`;
  return body;
}

function monthBody(p: CalendarProject, slot: Slot): HTMLElement {
  const month = slot.index;
  const rows = monthGrid(p.year, month);
  const body = document.createElement('div');
  body.className = 'cal-body';

  const head = document.createElement('div');
  head.className = 'cal-head';
  head.innerHTML = `<span class="cal-month">${MONTHS_CS[month - 1]}</span><span class="cal-year">${p.year}</span>`;
  if (slot.caption) head.insertAdjacentHTML('beforeend', `<span class="cal-caption">${escape(slot.caption)}</span>`);

  const grid = document.createElement('table');
  grid.className = `cal-grid${p.showWeekNumbers ? ' cal-grid--weeks' : ''}`;
  const thead = `<thead><tr>${p.showWeekNumbers ? '<th class="cal-wk"></th>' : ''}${WEEKDAYS_CS.map(
    (d, i) => `<th class="${i === 6 ? 'is-sun' : i === 5 ? 'is-sat' : ''}">${d}</th>`
  ).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map(
      (r) =>
        `<tr>${p.showWeekNumbers ? `<td class="cal-wk">${r.isoWeek}</td>` : ''}${r.days
          .map((d) => {
            const cls = [
              d.inMonth ? '' : 'is-out',
              d.isSunday ? 'is-sun' : '',
              d.isSaturday ? 'is-sat' : '',
              d.holiday ? 'is-holiday' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `<td class="${cls}"><span>${d.day}</span></td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody>`;
  grid.innerHTML = thead + tbody;

  body.append(head, grid);

  if (p.showHolidayNames) {
    const hols = holidaysFor(p.year).filter((h) => h.month === month);
    if (hols.length) {
      const list = document.createElement('div');
      list.className = 'cal-holidays';
      list.innerHTML = hols.map((h) => `<span><b>${h.day}. ${month}.</b> ${escape(h.name)}</span>`).join('');
      body.append(list);
    }
  }

  const foot = document.createElement('div');
  foot.className = 'cal-foot';
  foot.innerHTML = `<span>Stouníci · usměvavé kamínky</span><span>Váš fotograf Fus Bobo · www.stouniky.com</span>`;
  body.append(foot);
  return body;
}

function cropMarks(g: SheetGeometry): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'cal-marks';
  const len = g.slug - 1; // délka značky
  const off = g.slug + g.bleed; // vzdálenost ořezu od okraje archu
  const marks: string[] = [];
  // 8 značek – dvě u každého rohu, vně spadávky
  const corners: [string, string][] = [
    ['left', 'top'],
    ['right', 'top'],
    ['left', 'bottom'],
    ['right', 'bottom'],
  ];
  for (const [x, y] of corners) {
    marks.push(`<i style="${x}:0;${y}:${off}mm;width:${len}mm;height:0.1mm"></i>`);
    marks.push(`<i style="${y}:0;${x}:${off}mm;height:${len}mm;width:0.1mm"></i>`);
  }
  wrap.innerHTML = marks.join('');
  return wrap;
}

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
