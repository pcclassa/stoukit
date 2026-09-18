/**
 * Tisková data: všech 13 stran za sebou, formát stránky = čistý formát + spadávka (+ slug pro značky).
 * PDF vzniká přes „Uložit jako PDF“ v tiskovém dialogu prohlížeče – vektorový text, fotky v plném rozlišení.
 */
import { el } from '../lib/shell';
import { geometry, renderSheet } from './render';
import { loadProject, getImageUrl, imageSize } from './store';

export function printPage(root: HTMLElement): () => void {
  const project = loadProject();
  const g = geometry(project, true);

  const style = document.createElement('style');
  style.textContent = `@page { size: ${g.sheetW}mm ${g.sheetH}mm; margin: 0; }`;
  document.head.append(style);

  const bar = el('div', { class: 'print-toolbar' });
  const back = el('a', { class: 'btn btn--ghost btn--small', href: '#/kalendar' }, '← Zpět do editoru');
  const print = el('button', { class: 'btn btn--small' }, 'Tisk / Uložit jako PDF');
  print.onclick = () => window.print();
  bar.append(back, print);

  const wrap = el('div', { class: 'print-root' });
  root.append(bar, wrap);

  (async () => {
    for (const slot of project.slots) {
      const url = slot.imageId ? await getImageUrl(slot.imageId) : undefined;
      // projekt z verze 1.0 nemusí mít uložené rozměry fotek – doplníme je
      if (url && (!slot.imgW || !slot.imgH)) {
        const { w, h } = await imageSize(url);
        slot.imgW = w;
        slot.imgH = h;
      }
      wrap.append(renderSheet(project, slot, url, true));
    }
    // počkat na dekódování obrázků, ať se v PDF nic neztratí
    await Promise.all([...wrap.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => undefined) : Promise.resolve())));
    document.title = `${project.name} – tisková data ${g.sheetW}×${g.sheetH} mm`;
  })();

  return () => {
    style.remove();
    document.title = 'Stouniky product toolkit';
  };
}
