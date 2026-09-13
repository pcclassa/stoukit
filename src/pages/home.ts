import { renderShell, el } from '../lib/shell';

export function homePage(root: HTMLElement): void {
  const main = el('main', { class: 'page' });
  main.innerHTML = `
    <p class="quote">„Úsměv trvá chvilku, ale někdy se na něj vzpomíná celý život.“
      <small>neznámý autor · motto stouniky.com</small></p>

    <section class="products" aria-label="Produkty">
      <a class="card" href="#/kalendar">
        <span class="badge badge--live">Aktivní</span>
        <span class="card__num">1</span>
        <h2>Nástěnné kalendáře A3</h2>
        <p>Dvanáct měsíců ze života usměvavých kamínků. Vyber fotky, zkontroluj náhledy
           a vygeneruj tisková data pro hromadný tisk.</p>
        <span class="card__cta">Otevřít editor kalendáře →</span>
      </a>

      <a class="card card--soon" href="#/darek">
        <span class="badge">Připravujeme</span>
        <span class="card__num">2</span>
        <h2>Fotografie na zakázku</h2>
        <p>Personalizovaná fotka podle zadání zákazníka: rybář dostane rybáře,
           zahrádkářka zahrádkářku a běžec kamínek, který zrovna doběhl závod.</p>
        <span class="card__cta">Zadání · návrh · dodání</span>
      </a>

      <a class="card card--soon" href="#/reklama">
        <span class="badge">Připravujeme</span>
        <span class="card__num">3</span>
        <h2>Reklamní fotografie pro firmy</h2>
        <p>Produkty vašich klientů ve společnosti usměvavých kamínků – série pro web,
           sociální sítě a tisk.</p>
        <span class="card__cta">Brief · storyboard · série</span>
      </a>
    </section>

    <footer class="footer">© Stouníci · Váš fotograf Fus Bobo · www.stouniky.com</footer>`;
  renderShell(root, main);
}
