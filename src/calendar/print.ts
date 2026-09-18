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

  // Návod, aby se arch v tiskovém dialogu neotočil ani nezmenšil na A4
  const help = el('div', { class: 'print-help' });
  help.innerHTML = `
    <strong>Než uložíš PDF, zkontroluj v dialogu prohlížeče:</strong>
    <ul>
      <li>Cíl / tiskárna: <b>Uložit jako PDF</b></li>
      <li>Velikost papíru: <b>${g.sheetW} × ${g.sheetH} mm</b> (vlastní formát), nebo nejbližší větší</li>
      <li>Orientace: <b>${g.sheetW > g.sheetH ? 'na šířku' : 'na výšku'}</b> – musí odpovídat kalendáři</li>
      <li>Okraje: <b>Žádné</b> · Měřítko: <b>100 %</b> (ne „Přizpůsobit stránce“)</li>
      <li>Zapnout <b>Grafika na pozadí</b></li>
    </ul>
    <span>Když se v náhledu dialogu strana otočí nebo kolem ní vznikne bílý rám, sedí špatně
    papír nebo měřítko – tisková data by pak nešla oříznout na čistý formát.</span>`;

  const wrap = el('div', { class: 'print-root' });
  root.append(bar, help, wrap);

  (async () => {
    const clientLogoUrl = project.client?.logoId ? await getImageUrl(project.client.logoId) : undefined;
    for (const slot of project.slots) {
      const url = slot.imageId ? await getImageUrl(slot.imageId) : undefined;
      // projekt z verze 1.0 nemusí mít uložené rozměry fotek – doplníme je
      if (url && (!slot.imgW || !slot.imgH)) {
        const { w, h } = await imageSize(url);
        slot.imgW = w;
        slot.imgH = h;
      }
      wrap.append(renderSheet(project, slot, url, true, { clientLogoUrl }));
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
