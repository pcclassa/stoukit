/**
 * Stav projektu kalendáře. Metadata v localStorage, fotky (Blob) v IndexedDB.
 * Jeden projekt = jeden kalendář (obálka + 12 měsíců).
 */
import { get, set, del, keys } from 'idb-keyval';

export type Orientation = 'portrait' | 'landscape';

/** Čím se vyplní plocha kolem fotky, když je zmenšená pod plný formát. */
export type PhotoFill = 'blur' | 'color' | 'white';

export interface Slot {
  /** 0 = obálka, 1–12 = měsíce */
  index: number;
  imageId?: string;
  /** poloha fotky v rámečku v % (0 = doleva/nahoru, 100 = doprava/dolů) */
  posX: number;
  posY: number;
  /**
   * měřítko vůči plnému pokrytí plochy: 1 = fotka přesně vyplní rámeček,
   * < 1 = zmenšená (kolem vzniká výplň), > 1 = přiblížená (ořízne se víc)
   */
  zoom: number;
  caption?: string;
  /** rozměry původní fotky v px – kvůli přesnému měřítku a kontrole dpi */
  imgW?: number;
  imgH?: number;
  /** průměrná barva fotky (#rrggbb) pro výplň okrajů */
  avgColor?: string;
}

export interface PrintSettings {
  /** spadávka v mm na každé straně */
  bleed: number;
  cropMarks: boolean;
  /** bezpečná zóna nahoře pro vazbu (twin-wire), mm */
  bindingMargin: number;
}

export interface CalendarProject {
  id: string;
  name: string;
  year: number;
  orientation: Orientation;
  title: string;
  subtitle: string;
  showWeekNumbers: boolean;
  showHolidayNames: boolean;
  /** výplň plochy kolem zmenšené fotky */
  photoFill: PhotoFill;
  slots: Slot[];
  print: PrintSettings;
  updatedAt: number;
}

/** Nejmenší dovolené zmenšení fotky (zbytek plochy doplní výplň). */
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 2;

const LS_KEY = 'stoukit.calendar.project';

export function defaultProject(): CalendarProject {
  const year = new Date().getFullYear() + 1;
  return {
    id: crypto.randomUUID(),
    name: `Stouníci ${year}`,
    year,
    orientation: 'portrait',
    title: `Stouníci ${year}`,
    subtitle: 'dvanáct měsíců ze života usměvavých kamínků',
    showWeekNumbers: true,
    showHolidayNames: true,
    photoFill: 'blur',
    slots: Array.from({ length: 13 }, (_, i) => ({ index: i, posX: 50, posY: 50, zoom: 1 })),
    print: { bleed: 3, cropMarks: true, bindingMargin: 12 },
    updatedAt: Date.now(),
  };
}

export function loadProject(): CalendarProject {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...defaultProject(), ...(JSON.parse(raw) as CalendarProject) };
  } catch {
    /* poškozený záznam – začneme znovu */
  }
  return defaultProject();
}

export function saveProject(p: CalendarProject): void {
  p.updatedAt = Date.now();
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

/* ---------- Fotky ---------- */

const IMG_PREFIX = 'img:';
const urlCache = new Map<string, string>();

export async function putImage(file: Blob): Promise<string> {
  const id = crypto.randomUUID();
  await set(IMG_PREFIX + id, file);
  return id;
}

export async function getImageUrl(id: string): Promise<string | undefined> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = (await get(IMG_PREFIX + id)) as Blob | undefined;
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export async function getImageBlob(id: string): Promise<Blob | undefined> {
  return (await get(IMG_PREFIX + id)) as Blob | undefined;
}

export async function removeImage(id: string): Promise<void> {
  await del(IMG_PREFIX + id);
  const url = urlCache.get(id);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(id);
}

/** Smaže fotky, na které už žádný slot neodkazuje. */
export async function pruneImages(p: CalendarProject): Promise<void> {
  const used = new Set(p.slots.map((s) => s.imageId).filter(Boolean));
  for (const k of await keys()) {
    if (typeof k === 'string' && k.startsWith(IMG_PREFIX) && !used.has(k.slice(IMG_PREFIX.length))) {
      await removeImage(k.slice(IMG_PREFIX.length));
    }
  }
}

/** Zjistí rozměry obrázku (pro kontrolu rozlišení k tisku). */
export function imageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

/** Průměrná barva fotky – použije se jako výplň okrajů u zmenšené fotky. */
export function averageColor(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        resolve('#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));
      } catch {
        resolve('#e9dfc6');
      }
    };
    img.onerror = () => resolve('#e9dfc6');
    img.src = url;
  });
}

/* ---------- Uložení / načtení celého projektu (včetně fotek) ---------- */

export const PROJECT_FILE_VERSION = 1;

interface ProjectFile {
  format: 'stoukit-calendar';
  version: number;
  savedAt: string;
  project: CalendarProject;
  /** imageId → data URL fotky */
  images: Record<string, string>;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  return await (await fetch(url)).blob();
}

/** Zabalí projekt i s fotkami do jednoho souboru .stoukit (JSON). */
export async function exportProjectFile(p: CalendarProject): Promise<Blob> {
  const images: Record<string, string> = {};
  for (const s of p.slots) {
    if (!s.imageId || images[s.imageId]) continue;
    const blob = await getImageBlob(s.imageId);
    if (blob) images[s.imageId] = await blobToDataUrl(blob);
  }
  const file: ProjectFile = {
    format: 'stoukit-calendar',
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    project: p,
    images,
  };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

/**
 * Načte projekt ze souboru .stoukit. Fotky uloží znovu do IndexedDB pod novými
 * id, takže se načtený projekt nepotká se stávajícími daty.
 */
export async function importProjectFile(text: string): Promise<CalendarProject> {
  const data = JSON.parse(text) as Partial<ProjectFile> & Partial<CalendarProject>;

  // starý formát (pouhé nastavení bez fotek) – přijmeme, fotky prostě nebudou
  if (!data.format) {
    const legacy = { ...defaultProject(), ...(data as CalendarProject) };
    legacy.slots = legacy.slots.map((s) => ({ ...s, imageId: undefined }));
    return legacy;
  }
  if (data.format !== 'stoukit-calendar' || !data.project) {
    throw new Error('Tohle není soubor kalendáře Stouníků.');
  }

  const p: CalendarProject = { ...defaultProject(), ...data.project };
  const remap = new Map<string, string>();
  for (const [oldId, dataUrl] of Object.entries(data.images ?? {})) {
    try {
      remap.set(oldId, await putImage(await dataUrlToBlob(dataUrl)));
    } catch {
      /* poškozená fotka – slot zůstane prázdný */
    }
  }
  p.slots = p.slots.map((s) => ({
    ...s,
    imageId: s.imageId ? remap.get(s.imageId) : undefined,
  }));
  return p;
}
