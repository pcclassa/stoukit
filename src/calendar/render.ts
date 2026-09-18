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

/** Podíl výšky strany, který zabírá fotka u měsíční strany. */
export const PHOTO_RATIO = { portrait: 0.64, landscape: 0.6 };

export interface PhotoBox {
  frameW: number;
  frameH: number;
  dispW: number;
  dispH: number;
  left: number;
  top: number;
  /** měřítko mm na px původní fotky */
  scale: number;
  /** true, když fotka nepokrývá celou plochu a kolem vzniká výplň */
  hasGap: boolean;
}

/** Plocha pro fotku na dané straně, v mm (včetně spadávky). */
export function photoFrame(p: CalendarProject, slotIndex: number, forPrint: boolean): { w: number; h: number } {
  const g = geometry(p, forPrint);
  const w = g.trimW + 2 * g.bleed;
  const h = g.trimH + 2 * g.bleed;
  return slotIndex === 0 ? { w, h } : { w, h: h * PHOTO_RATIO[p.orientation] };
}

/**
 * Spočítá umístění fotky v rámečku. zoom = 1 znamená přesné pokrytí plochy,
 * menší hodnota fotku zmenší (kolem zůstane výplň), větší ji přiblíží.
 */
export function photoBox(p: CalendarProject, slot: Slot, forPrint: boolean): PhotoBox | undefined {
  if (!slot.imgW || !slot.imgH) return undefined;
  const { w: frameW, h: frameH } = photoFrame(p, slot.index, forPrint);
  const cover = Math.max(frameW / slot.imgW, frameH / slot.imgH);
  const scale = cover * slot.zoom;
  const dispW = slot.imgW * scale;
  const dispH = slot.imgH * scale;
  return {
    frameW,
    frameH,
    dispW,
    dispH,
    left: ((frameW - dispW) * slot.posX) / 100,
    top: ((frameH - dispH) * slot.posY) / 100,
    scale,
    hasGap: dispW < frameW - 0.01 || dispH < frameH - 0.01,
  };
}

/** Vrstvy fotky: výplň pozadí + samotná fotka umístěná na desetinu milimetru. */
function photoLayers(p: CalendarProject, slot: Slot, imageUrl: string, forPrint: boolean): HTMLElement[] {
  const box = photoBox(p, slot, forPrint);
  const layers: HTMLElement[] = [];

  // bez známých rozměrů fotky (starý projekt) se chováme jako dřív – plné pokrytí
  if (!box) {
    const img = document.createElement('img');
    img.className = 'cal-photo__img cal-photo__img--cover';
    img.src = imageUrl;
    img.alt = '';
    img.style.objectPosition = `${slot.posX}% ${slot.posY}%`;
    return [img];
  }

  if (box.hasGap) {
    const fill = document.createElement('div');
    fill.className = `cal-photo__fill cal-photo__fill--${p.photoFill}`;
    if (p.photoFill === 'blur') {
      const bg = document.createElement('img');
      bg.className = 'cal-photo__blur';
      bg.src = imageUrl;
      bg.alt = '';
      fill.append(bg);
    } else if (p.photoFill === 'color') {
      fill.style.background = slot.avgColor ?? '#e9dfc6';
    }
    layers.push(fill);
  }

  const img = document.createElement('img');
  img.className = 'cal-photo__img';
  img.src = imageUrl;
  img.alt = '';
  img.style.width = `${box.dispW.toFixed(2)}mm`;
  img.style.height = `${box.dispH.toFixed(2)}mm`;
  img.style.left = `${box.left.toFixed(2)}mm`;
  img.style.top = `${box.top.toFixed(2)}mm`;
  layers.push(img);
  return layers;
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
  if (slot.index !== 0) photo.style.height = `${(PHOTO_RATIO[p.orientation] * 100).toFixed(2)}%`;
  if (imageUrl) {
    photo.append(...photoLayers(p, slot, imageUrl, forPrint));
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
  foot.innerHTML = `<span>Stouníci · usměvavé kamínky</span><span>Fotograf Fus Bobo · www.stouniky.com</span>`;
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
