/** Společná lišta: hero vlevo nahoře, fotograf (pilulka + logo) vpravo nahoře. Vzhled dle stouniky.com. */
export function renderShell(root: HTMLElement, content: HTMLElement, opts: { figure?: boolean } = {}): void {
  const backdrop = document.createElement('img');
  backdrop.className = 'backdrop';
  backdrop.src = './brand/pozadi.jpg';
  backdrop.alt = '';

  const frame = document.createElement('div');
  frame.className = 'frame';
  frame.setAttribute('aria-hidden', 'true');

  const topbar = document.createElement('nav');
  topbar.className = 'topbar';
  topbar.setAttribute('aria-label', 'Hlavní lišta');
  topbar.innerHTML = `
    <a class="hero" href="#/">
      <img class="hero__mark" src="./brand/pebble.svg" alt="" />
      <span>
        <span class="hero__title">Stouniky <em>product toolkit</em></span>
        <span class="hero__sub">very pebbles · fus bobo</span>
      </span>
    </a>
    <a class="photographer" href="https://stouniky.com" target="_blank" rel="noopener">
      <span class="photographer__label">Fotograf</span>
      <img class="photographer__logo" src="./brand/fusbobo-logo.png" alt="Fus Bobo – logo fotografa" />
    </a>`;

  root.append(backdrop, frame, topbar, content);

  if (opts.figure) {
    const fig = document.createElement('figure');
    fig.className = 'bobo-fig';
    fig.innerHTML = `<img src="./brand/fusbobo-figura.webp" alt="Fus Bobo, kamínek s kaštanovými vlasy a fotoaparátem" />`;
    root.append(fig);
  }
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  html = ''
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (html) e.innerHTML = html;
  return e;
}
