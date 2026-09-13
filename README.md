# Stouniky product toolkit

Kreativní toolkit pro produkty z fotek usměvavých kamínků ([stouniky.com](https://stouniky.com), fotograf Fus Bobo).

## Produkty

| # | Produkt | Stav |
|---|---------|------|
| 1 | Nástěnné kalendáře A3 – editor, náhledy, tisková data | **aktivní** |
| 2 | Personalizované fotografie na zakázku | připravujeme |
| 3 | Reklamní fotografie pro firmy (produkty ve společnosti kamínků) | připravujeme |

## Spuštění

```bash
npm install
npm run dev        # vývoj, http://localhost:5173
npm run build      # typecheck + produkční build do dist/
npm run preview    # náhled buildu
```

Čistě statická aplikace bez backendu – jde nasadit na GitHub Pages nebo otevřít lokálně.
Fotky zůstávají v prohlížeči (IndexedDB), nastavení projektu v localStorage.

## Kalendář – jak to funguje

1. **Nahrát fotky** – hromadně (doplní se do prázdných měsíců podle názvu souboru) nebo přetažením na konkrétní slot.
2. **Doladit** – posun a přiblížení výřezu, popisek, titul obálky, čísla týdnů, názvy svátků.
3. **Generovat tiskové PDF** – otevře se tiskový pohled se všemi 13 stranami. V dialogu prohlížeče
   zvolit *Uložit jako PDF*, okraje *Žádné*, *Grafika na pozadí* zapnuto.

Tisková data: čistý formát A3 (297 × 420 mm nebo na šířku) + spadávka (výchozí 3 mm) + ořezové značky
(5 mm slug). Výsledný arch 313 × 436 mm, 13 stran. Text je vektorový, fotky jdou do PDF v plném rozlišení;
editor varuje, když má fotka pro A3 méně než 200 dpi.

České státní svátky se počítají (včetně velikonočních), týdny jsou ISO, pondělí první.

## Struktura

```
src/
  main.ts              router + registrace stránek
  lib/router.ts        hash router (#/, #/kalendar, #/kalendar/tisk)
  lib/shell.ts         hlavička: hero vlevo, logo fotografa vpravo
  pages/home.ts        rozcestník produktů
  calendar/
    holidays.ts        české svátky
    calendarium.ts     mřížka měsíce, ISO týdny
    store.ts           projekt (localStorage) + fotky (IndexedDB)
    render.ts          vykreslení strany v mm (náhled i tisk)
    editor.ts          UI editoru
    print.ts           tiskový pohled
  styles/              base.css (brand), calendar.css
public/brand/          pebble.svg (značka), fusbobo-logo.svg (PLACEHOLDER – nahradit skutečným logem)
```

## Vizuální identita

Převzato z webu stouniky.com: teplá hnědá `#4A3726`, krémový papír, měkké zaoblení; písma Fraunces (nadpisy)
a Nunito (UI). Tokeny jsou v `src/styles/base.css`.

## Roadmapa

- [ ] skutečné logo Fus Boba + ukázkové fotky
- [ ] jmeniny v kalendáriu (volitelně)
- [ ] přímý export PDF bez tiskového dialogu (pdf-lib), případně PDF/X + CMYK dle tiskárny
- [ ] hromadná varianta: více kalendářů z jedné sady (personalizované obálky)
- [ ] produkt 2: zadání zákazníka → brief → návrh → dodání
- [ ] produkt 3: firemní brief → storyboard → série
