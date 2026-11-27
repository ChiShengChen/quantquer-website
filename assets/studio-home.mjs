import { track } from './analytics.mjs';
import './studio-waveform.mjs';

const header = document.getElementById('hdr');
const menuButton = document.getElementById('burger');
const menu = document.getElementById('mnav');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

function setMenu(open) {
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? menuButton.dataset.closeLabel : menuButton.dataset.openLabel);
}

const menuOpen = () => header.classList.contains('menu-open');
menuButton.addEventListener('click', () => setMenu(!menuOpen()));
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen()) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (menuOpen() && !header.contains(event.target)) setMenu(false);
});
matchMedia('(min-width: 941px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

const finder = document.querySelector('[data-solution-finder]');
if (finder) {
  const control = finder.querySelector('select');
  const results = finder.querySelectorAll('[data-solution-result]');
  function showRecommendation() {
    for (const result of results) result.hidden = result.dataset.solutionResult !== control.value;
  }
  control.addEventListener('change', () => {
    showRecommendation();
    if (control.value) track('solution_finder_used', { service: control.value });
  });
  showRecommendation();
  finder.hidden = false;
}

function revealArchive(hash) {
  if (!hash) return;
  let anchor;
  try {
    anchor = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return;
  }
  let opened = false;
  for (let node = anchor; node; node = node.parentElement) {
    if (!node.matches('details[data-home-archive]') || node.open) continue;
    node.open = true;
    opened = true;
  }
  if (opened) requestAnimationFrame(() => anchor.scrollIntoView());
}

revealArchive(location.hash);
window.addEventListener('hashchange', () => revealArchive(location.hash));
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('a[href]');
  if (link?.origin === location.origin && link.pathname === location.pathname && link.search === location.search) revealArchive(link.hash);
});
