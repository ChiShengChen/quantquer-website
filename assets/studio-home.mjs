import { track } from './analytics.mjs';

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
  const archive = anchor?.closest('details[data-home-archive]');
  if (!archive || archive.open) return;
  archive.open = true;
  requestAnimationFrame(() => anchor.scrollIntoView());
}

revealArchive(location.hash);
window.addEventListener('hashchange', () => revealArchive(location.hash));
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('a[href]');
  if (link?.origin === location.origin && link.pathname === location.pathname && link.search === location.search) revealArchive(link.hash);
});
