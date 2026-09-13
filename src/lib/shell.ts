/** Společná hlavička: hero vlevo nahoře, logo fotografa vpravo nahoře. */
export function renderShell(root: HTMLElement, content: HTMLElement): void {
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <a class="hero" href="#/">
      <img class="hero__mark" src="./brand/pebble.svg" alt="" />
      <span>
        <span class="hero__sub">Stouníci · very pebbles</span>
        <span class="hero__title">Stouniky <em>product</em> toolkit</span>
      </span>
    </a>
    <a class="photographer" href="https://stouniky.com" target="_blank" rel="noopener">
      <span class="photographer__label">Váš fotograf<strong>Fus Bobo</strong></span>
      <img class="photographer__logo" src="./brand/fusbobo-logo.svg" alt="Fus Bobo – logo fotografa" />
    </a>`;
  root.append(topbar, content);
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
