/** Editor kalendáře: nastavení, sloty s fotkami, náhled strany, přechod na tisková data. */
import { renderShell, el } from '../lib/shell';
import { navigate } from '../lib/router';
import { MONTHS_CS } from './calendarium';
import { geometry, renderSheet } from './render';
import {
  loadProject,
  saveProject,
  putImage,
  getImageUrl,
  imageSize,
  pruneImages,
  type CalendarProject,
  type Slot,
} from './store';

const PX_PER_MM = 96 / 25.4;
const MIN_DPI = 200; // pod touto hodnotou varujeme

export function calendarPage(root: HTMLElement): () => void {
  let project = loadProject();
  let active = 1; // začínáme lednem – obálku obvykle řeší jako poslední
  const sizes = new Map<string, { w: number; h: number }>();

  const main = el('main', { class: 'page' });
  const editor = el('div', { class: 'cal-editor' });
  const side = el('aside', { class: 'panel' });
  const stage = el('div');
  editor.append(side, stage);
  main.append(editor);
  renderShell(root, main);

  const commit = () => {
    saveProject(project);
    paint();
  };

  /* ---------------- levý panel ---------------- */
  function paintSide(): void {
    side.innerHTML = '';
    side.append(
      el('h2', {}, 'Nástěnný kalendář A3'),
      el('p', { class: 'hint' }, 'Obálka + 12 měsíců · české svátky · čísla týdnů')
    );

    side.append(el('h3', {}, 'Kalendář'));
    side.append(
      field('Rok', input('number', String(project.year), (v) => {
        project.year = Number(v) || project.year;
        if (project.title.match(/\d{4}/)) project.title = project.title.replace(/\d{4}/, String(project.year));
        commit();
      })),
      field('Orientace', select(
        [
          ['portrait', 'Na výšku (297 × 420)'],
          ['landscape', 'Na šířku (420 × 297)'],
        ],
        project.orientation,
        (v) => {
          project.orientation = v as CalendarProject['orientation'];
          commit();
        }
      )),
      field('Titul na obálce', input('text', project.title, (v) => ((project.title = v), commit()))),
      field('Podtitul', input('text', project.subtitle, (v) => ((project.subtitle = v), commit()))),
      check('Čísla týdnů', project.showWeekNumbers, (v) => ((project.showWeekNumbers = v), commit())),
      check('Názvy svátků pod mřížkou', project.showHolidayNames, (v) => ((project.showHolidayNames = v), commit()))
    );

    const slot = project.slots[active];
    side.append(el('h3', {}, active === 0 ? 'Obálka' : MONTHS_CS[active - 1]));
    side.append(
      field('Popisek pod fotkou (volitelný)', input('text', slot.caption ?? '', (v) => ((slot.caption = v), commit()))),
      field(`Posun vodorovně · ${slot.posX} %`, range(slot.posX, 0, 100, (v) => ((slot.posX = v), commit()))),
      field(`Posun svisle · ${slot.posY} %`, range(slot.posY, 0, 100, (v) => ((slot.posY = v), commit()))),
      field(`Přiblížení · ${slot.zoom.toFixed(2)}×`, range(slot.zoom, 1, 2, (v) => ((slot.zoom = v), commit()), 0.01))
    );
    if (slot.imageId) {
      const rm = el('button', { class: 'btn btn--ghost btn--small' }, 'Odebrat fotku');
      rm.onclick = async () => {
        slot.imageId = undefined;
        slot.posX = slot.posY = 50;
        slot.zoom = 1;
        saveProject(project);
        await pruneImages(project);
        paint();
      };
      side.append(rm);
    }

    side.append(el('h3', {}, 'Tisková data'));
    side.append(
      field('Spadávka (mm)', input('number', String(project.print.bleed), (v) => ((project.print.bleed = Number(v) || 0), commit()))),
      check('Ořezové značky', project.print.cropMarks, (v) => ((project.print.cropMarks = v), commit()))
    );

    const actions = el('div', { class: 'actions' });
    const printBtn = el('button', { class: 'btn' }, 'Generovat tiskové PDF');
    printBtn.onclick = () => navigate('/kalendar/tisk');
    const exportBtn = el('button', { class: 'btn btn--ghost btn--small' }, 'Export projektu (JSON)');
    exportBtn.onclick = exportJson;
    const resetBtn = el('button', { class: 'btn btn--ghost btn--small' }, 'Nový projekt');
    resetBtn.onclick = () => {
      if (!confirm('Smazat aktuální kalendář a začít znovu?')) return;
      localStorage.removeItem('stoukit.calendar.project');
      project = loadProject();
      pruneImages(project).then(paint);
    };
    actions.append(printBtn, exportBtn, resetBtn);
    side.append(actions);
    side.append(
      el(
        'p',
        { class: 'hint' },
        'PDF vznikne přes tisk prohlížeče: v dialogu zvol „Uložit jako PDF“, okraje „Žádné“ a zapni grafiku na pozadí. Vzniknou vektorová data s fotkami v plném rozlišení.'
      )
    );
  }

  /* ---------------- pravá část: sloty + náhled ---------------- */
  function paintStage(): void {
    stage.innerHTML = '';

    const drop = el('label', { class: 'dropzone' });
    drop.innerHTML = `<strong>Nahrát fotky</strong> – klikni nebo přetáhni více souborů najednou, doplní se do prázdných měsíců v pořadí<input type="file" accept="image/*" multiple />`;
    const fileInput = drop.querySelector('input')!;
    fileInput.onchange = () => fileInput.files && assignMany([...fileInput.files]);
    bindDrop(drop, (files) => assignMany(files));
    stage.append(drop);

    const strip = el('div', { class: 'slots' });
    for (const s of project.slots) {
      const b = el('button', {
        class: `slot${project.orientation === 'landscape' ? ' slot--landscape' : ''}${s.index === active ? ' is-active' : ''}`,
        title: s.index === 0 ? 'Obálka' : MONTHS_CS[s.index - 1],
      });
      if (s.imageId) {
        const img = el('img');
        getImageUrl(s.imageId).then((u) => u && (img.src = u));
        b.append(img);
        if (lowRes(s)) b.append(el('span', { class: 'slot__warn', title: 'Nízké rozlišení pro tisk' }));
      }
      b.append(el('span', { class: 'slot__label' }, s.index === 0 ? 'Obálka' : MONTHS_CS[s.index - 1].slice(0, 3)));
      b.onclick = () => ((active = s.index), paint());
      bindDrop(b, (files) => assignOne(s, files[0]));
      strip.append(b);
    }
    stage.append(strip);

    const preview = el('div', { class: 'preview' });
    bindDrop(preview, (files) => assignOne(project.slots[active], files[0]));
    stage.append(preview);
    paintPreview(preview);

    const s = project.slots[active];
    if (s.imageId && lowRes(s)) {
      const dpi = effectiveDpi(s);
      stage.append(
        el('p', { class: 'warn' }, `Fotka má pro A3 jen ~${dpi} dpi (doporučeno 300, minimum ${MIN_DPI}). Zvaž větší soubor nebo menší přiblížení.`)
      );
    } else {
      stage.append(el('p', { class: 'hint' }, 'Oranžová čárkovaná linka je čistý formát po ořezu. Fotku posuneš a přiblížíš v levém panelu.'));
    }
  }

  async function paintPreview(preview: HTMLElement): Promise<void> {
    const slot = project.slots[active];
    const url = slot.imageId ? await getImageUrl(slot.imageId) : undefined;
    // náhled = formát včetně spadávky (bez ořezových značek), čistý formát je naznačen čárkovanou linkou
    const sheet = renderSheet(project, slot, url, false);
    const gp = geometry(project, false);
    const scale = preview.clientWidth / (gp.sheetW * PX_PER_MM);
    preview.style.height = `${gp.sheetH * PX_PER_MM * scale}px`;
    sheet.style.transform = `scale(${scale})`;
    preview.innerHTML = '';
    preview.append(sheet);
  }

  /* ---------------- fotky ---------------- */
  async function assignOne(slot: Slot, file: File | undefined): Promise<void> {
    if (!file || !file.type.startsWith('image/')) return;
    slot.imageId = await putImage(file);
    slot.posX = slot.posY = 50;
    slot.zoom = 1;
    await measure(slot.imageId);
    saveProject(project);
    await pruneImages(project);
    active = slot.index;
    paint();
  }

  async function assignMany(files: File[]): Promise<void> {
    const imgs = files.filter((f) => f.type.startsWith('image/')).sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    const empty = project.slots.filter((s) => !s.imageId && s.index > 0).concat(project.slots.filter((s) => !s.imageId && s.index === 0));
    for (let i = 0; i < Math.min(imgs.length, empty.length); i++) {
      const slot = empty[i];
      slot.imageId = await putImage(imgs[i]);
      slot.posX = slot.posY = 50;
      slot.zoom = 1;
      await measure(slot.imageId);
    }
    saveProject(project);
    paint();
  }

  async function measure(id: string): Promise<void> {
    const url = await getImageUrl(id);
    if (url) sizes.set(id, await imageSize(url));
  }

  function effectiveDpi(slot: Slot): number {
    const sz = slot.imageId && sizes.get(slot.imageId);
    if (!sz) return 999;
    const g = geometry(project, true);
    const areaW = g.trimW + 2 * g.bleed;
    const areaH = slot.index === 0 ? g.trimH + 2 * g.bleed : (g.trimH + 2 * g.bleed) * 0.64;
    // object-fit: cover – měřítko určuje menší z poměrů
    const coverScale = Math.max(areaW / sz.w, areaH / sz.h) * slot.zoom; // mm na px
    return Math.round(25.4 / coverScale);
  }

  function lowRes(slot: Slot): boolean {
    return effectiveDpi(slot) < MIN_DPI;
  }

  function exportJson(): void {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------------- pomocné ---------------- */
  function paint(): void {
    paintSide();
    paintStage();
  }

  // Změřit fotky, které už v projektu jsou
  Promise.all(project.slots.filter((s) => s.imageId).map((s) => measure(s.imageId!))).then(paint);
  paint();

  const onResize = () => paintStage();
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}

/* ---------- drobné UI helpery ---------- */
function field(label: string, control: HTMLElement): HTMLElement {
  const f = el('label', { class: 'field' });
  f.append(document.createTextNode(label), control);
  return f;
}

function input(type: string, value: string, onChange: (v: string) => void): HTMLInputElement {
  const i = el('input', { type, value });
  i.onchange = () => onChange(i.value);
  return i;
}

function range(value: number, min: number, max: number, onChange: (v: number) => void, step = 1): HTMLInputElement {
  const i = el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
  i.oninput = () => onChange(Number(i.value));
  return i;
}

function select(options: [string, string][], value: string, onChange: (v: string) => void): HTMLSelectElement {
  const s = el('select');
  for (const [v, label] of options) {
    const o = el('option', { value: v }, label);
    if (v === value) o.selected = true;
    s.append(o);
  }
  s.onchange = () => onChange(s.value);
  return s;
}

function check(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const f = el('label', { class: 'field field--row' });
  const i = el('input', { type: 'checkbox' });
  i.checked = value;
  i.onchange = () => onChange(i.checked);
  f.append(document.createTextNode(label), i);
  return f;
}

function bindDrop(target: HTMLElement, onFiles: (files: File[]) => void): void {
  target.addEventListener('dragover', (e) => {
    e.preventDefault();
    target.classList.add('is-dragover');
  });
  target.addEventListener('dragleave', () => target.classList.remove('is-dragover'));
  target.addEventListener('drop', (e) => {
    e.preventDefault();
    target.classList.remove('is-dragover');
    const files = e.dataTransfer ? [...e.dataTransfer.files] : [];
    if (files.length) onFiles(files);
  });
}
