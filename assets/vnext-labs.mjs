const normalized = text => text.normalize('NFKC').toLocaleLowerCase().trim();

export function projectMatches(project, filters) {
  const tokens = normalized(filters.query).split(/\s+/).filter(Boolean);
  return (!filters.category || filters.category === project.category)
    && (!filters.maturity || filters.maturity === project.maturity)
    && tokens.every(token => normalized(project.labSearch).includes(token));
}

function initProjectFilters(doc) {
  const form = doc.querySelector('[data-lab-filters]');
  if (!form) return;
  const empty = doc.querySelector('[data-lab-empty]');
  const counter = doc.querySelector('[data-lab-count]');
  const cards = [...doc.querySelectorAll('[data-lab-project]')];
  const { query, category, maturity } = form.elements;
  const params = new URLSearchParams(doc.location.search);
  query.value = params.get('q') || '';
  for (const select of [category, maturity]) {
    const requested = params.get(select.name);
    if ([...select.options].some(option => option.value === requested)) select.value = requested;
  }

  function applyFilters() {
    const filters = { query: query.value, category: category.value, maturity: maturity.value };
    let matches = 0;
    for (const card of cards) {
      const match = projectMatches(card.dataset, filters);
      card.hidden = !match;
      if (match) matches += 1;
    }
    empty.hidden = matches !== 0;
    counter.textContent = counter.dataset.template.replace('{count}', matches).replace('{total}', cards.length);
  }

  form.addEventListener('input', applyFilters);
  form.addEventListener('submit', event => {
    event.preventDefault();
    applyFilters();
  });
  form.addEventListener('reset', event => {
    event.preventDefault();
    query.value = '';
    category.value = '';
    maturity.value = '';
    applyFilters();
  });
  applyFilters();
  counter.hidden = false;
  form.hidden = false;
}

if (typeof document !== 'undefined') initProjectFilters(document);
