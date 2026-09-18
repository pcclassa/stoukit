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

Čistě statická aplikace bez backendu. Nasazení na GitHub Pages: `./deploy.sh` (build → branch `gh-pages`), běží na https://pcclassa.github.io/stoukit/
Fotky zůstávají v prohlížeči (IndexedDB), nastavení projektu v localStorage.

## Kalendář – jak to funguje

1. **Nahrát fotky** – hromadně (doplní se do prázdných měsíců podle názvu souboru) nebo přetažením na konkrétní slot.
2. **Doladit** – posun, velikost fotky, popisek, titul obálky, čísla týdnů, názvy svátků.
3. **Generovat tiskové PDF** – otevře se tiskový pohled se všemi 13 stranami. V dialogu prohlížeče
   zvolit *Uložit jako PDF*, okraje *Žádné*, *Grafika na pozadí* zapnuto.

### Velikost fotky (od 1.1)

Posuvník *Velikost fotky* jde od 30 % do 200 %, kde **100 % = fotka přesně vyplní stranu**. Pod 100 %
se fotka zmenší, takže je z ní vidět víc – a plocha kolem ní se **vždy vyplní**, aby na straně nevznikl
prázdný okraj. Výplň se volí pro celý kalendář: rozmazaná fotka (výchozí), barva odebraná z fotky, nebo
bílá jako pas-partout. Tlačítka *Vyplnit stranu* a *Celá fotka* nastaví obě krajní polohy jedním klikem.

Fotka se umisťuje výpočtem v milimetrech, takže náhled a tisková data sedí na desetinu milimetru.

### Přenos kalendáře (od 1.1)

*Uložit projekt do souboru* vytvoří `.stoukit` – jeden soubor, ve kterém je **nastavení i všechny fotky**.
*Načíst projekt ze souboru* ho otevře zpátky, i na jiném počítači nebo v novější verzi aplikace.
(Ve verzi 1.0 uměl export jen nastavení bez fotek a načtení chybělo úplně; staré JSON soubory jdou
načíst taky, ale fotky v nich nejsou.)

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
public/brand/          pebble.svg (značka), fusbobo-logo*.png (logo hnědé/bílé, čistá alfa), fusbobo-figura.webp, uska.webp, pozadi.jpg, ukazka-*.jpg
```

## Vizuální identita

Převzato 1:1 z webu stouniky.com (repo `pcclassa/stouniky.com`): rozostřené kamínky na pozadí, krémové karty
`#EFE5CD` s rámečkem `#1F1D1A`, hnědá `#4A3626`, gradientový rám okna; písma Bricolage Grotesque (nadpisy),
IBM Plex Sans (text), IBM Plex Mono (štítky, tlačítka), Pacifico (skript). Tokeny jsou v `src/styles/base.css`,
obrázky (pozadí, Ůska, figura Fus Boba, ukázky) v `public/brand/`.

## Verze

- **1.1.1** (18. 9. 2026) – logo Fus Boba překresleno z originálu s čistou průhledností (dřív mělo
  kolem sebe patrný obdélníkový závoj z šumu v alfa kanálu), v tiskovém pohledu přibyl návod
  na nastavení tiskového dialogu.
- **1.1** (18. 9. 2026) – zmenšení fotky pod plný formát s výplní okolo (rozmazaná fotka / barva / bílá),
  umístění fotky počítané v mm, uložení a načtení projektu včetně fotek (`.stoukit`).
- **1.0** (13. 9. 2026) – editor kalendáře, náhledy, tisková data A3 se spadávkou a ořezovými značkami.

## Roadmapa

- [ ] ukázkové fotky
- [ ] jmeniny v kalendáriu (volitelně)
- [ ] přímý export PDF bez tiskového dialogu (pdf-lib), případně PDF/X + CMYK dle tiskárny
- [ ] hromadná varianta: více kalendářů z jedné sady (personalizované obálky)
- [ ] produkt 2: zadání zákazníka → brief → návrh → dodání
- [ ] produkt 3: firemní brief → storyboard → série
