import { renderShell, el } from '../lib/shell';

export function homePage(root: HTMLElement): void {
  const main = el('main', { class: 'page' });
  main.innerHTML = `
    <section class="card card--intro">
      <h1>Stouniky product toolkit</h1>
      <div class="tagline">very pebbles · fus bobo</div>
      <p class="quote">„Úsměv trvá chvilku, ale někdy se na něj vzpomíná celý život.“
        <small>neznámý autor</small></p>
    </section>

    <section class="products" aria-label="Produkty">
      <a class="card" href="#/kalendar">
        <span class="badge badge--live">Aktivní</span>
        <span class="card__num">01 · kalendáře</span>
        <h2>Nástěnné kalendáře A3</h2>
        <p>Dvanáct měsíců ze života usměvavých kamínků. Vyber fotky, zkontroluj náhledy
           a vygeneruj tisková data pro hromadný tisk.</p>
        <span class="card__cta">Otevřít editor kalendáře →</span>
      </a>

      <a class="card card--soon" href="#/darek">
        <span class="badge">Připravujeme</span>
        <span class="card__num">02 · dárek</span>
        <h2>Fotografie na zakázku</h2>
        <p>Personalizovaná fotka podle zadání zákazníka: rybář dostane rybáře,
           zahrádkářka zahrádkářku a běžec kamínek, který zrovna doběhl svůj závod.</p>
        <span class="card__cta">Zadání · návrh · dodání</span>
      </a>

      <a class="card card--soon" href="#/reklama">
        <span class="badge">Připravujeme</span>
        <span class="card__num">03 · firmy</span>
        <h2>Reklamní fotografie pro firmy</h2>
        <p>Produkty vašich klientů ve společnosti usměvavých kamínků – série pro web,
           sociální sítě a tisk.</p>
        <span class="card__cta">Brief · storyboard · série</span>
      </a>
    </section>

    <footer class="footer">© Stouníci · Fotograf Fus Bobo · www.stouniky.com</footer>`;
  renderShell(root, main, { figure: true });
}
