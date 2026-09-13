/** Minimalistický hash router: '#/', '#/kalendar', ... */
export type Route = { path: string; params: URLSearchParams };
export type PageFactory = (root: HTMLElement, route: Route) => void | (() => void);

const routes = new Map<string, PageFactory>();
let teardown: (() => void) | void;

export function route(path: string, factory: PageFactory): void {
  routes.set(path, factory);
}

export function navigate(path: string): void {
  location.hash = path.startsWith('#') ? path : `#${path}`;
}

export function current(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}

export function start(root: HTMLElement): void {
  const render = () => {
    const r = current();
    const factory = routes.get(r.path) ?? routes.get('/');
    if (!factory) return;
    if (teardown) teardown();
    root.innerHTML = '';
    teardown = factory(root, r);
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', render);
  render();
}
