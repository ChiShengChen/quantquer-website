// The public cards in the HTML are the source for category membership and counts.
document.querySelectorAll('[data-portfolio-filter]').forEach(filter => {
  const list = document.getElementById(filter.getAttribute('aria-controls'));
  const cards = Array.from(list.querySelectorAll('[data-tags]'), card => ({
    element: card,
    tags: card.dataset.tags.split(/\s+/),
  }));
  const buttons = Array.from(filter.querySelectorAll('[data-filter]'));
  const all = buttons.find(button => button.dataset.filter === '');
  const count = filter.querySelector('[data-count-label]');
  const empty = filter.querySelector('.filter-empty');
  const chosen = new Set();

  function update() {
    const selected = Array.from(chosen);
    let visible = 0;
    for (const {element, tags} of cards) {
      const matches = selected.every(tag => tags.includes(tag));
      element.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const button of buttons) {
      const pressed = button === all ? chosen.size === 0 : chosen.has(button.dataset.filter);
      button.setAttribute('aria-pressed', String(pressed));
    }
    count.textContent = `顯示 ${visible} ${count.dataset.countLabel}，共 ${cards.length} ${count.dataset.countLabel}`;
    empty.hidden = visible !== 0;
    list.hidden = visible === 0;
  }

  function reset() {
    chosen.clear();
    update();
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const tag = button.dataset.filter;
      if (button === all) {
        reset();
        return;
      }
      if (chosen.has(tag)) chosen.delete(tag);
      else chosen.add(tag);
      update();
    });
  }
  filter.querySelector('[data-reset]').addEventListener('click', () => {
    reset();
    all.focus();
  });
  document.querySelectorAll(`[data-clear-${list.id}]`).forEach(link => link.addEventListener('click', reset));
  update();
  filter.hidden = false;
});

const facetLabels = {
  technology: {
    agent: 'AI Agent', vision: '電腦視覺', optimization: '最佳化', signal: '訊號處理',
    'gen-ai': '生成式 AI', gpu: 'GPU 排程', simulation: '科學模擬', knowledge: '知識工程',
    'time-series': '時序分析', cad: 'CAD', evaluation: '評測', research: '研究自動化',
  },
  status: {
    delivered: '已交付', 'clinical-use': '門診使用', evaluation: '評測', development: '研發',
    deployment: '部署', application: '教學應用', demonstration: '技術展示', published: '已公開',
    prototype: '原型', research: '研究', production: '正式運行', pilot: '試行',
  },
  type: {
    'anonymous-engineering': '匿名工程', 'founder-experience': '創辦人經歷', academic: '學術研究',
    education: '教育應用', 'internal-rnd': '自主研發', 'open-source': '開源',
    'technical-note': '技術專題', case: '工程與研究案例',
  },
};

const englishFacets = {
  technology: {
    agent: 'AI Agents', vision: 'Computer vision', optimization: 'Optimization', signal: 'Signal processing',
    'gen-ai': 'Generative AI', gpu: 'GPU scheduling', simulation: 'Simulation', knowledge: 'Knowledge engineering',
    'time-series': 'Time series', cad: 'CAD', evaluation: 'Evaluation', research: 'Research automation',
  },
  status: {
    delivered: 'Delivered', 'clinical-use': 'Outpatient use', evaluation: 'Evaluation', development: 'Development',
    deployment: 'Deployment', application: 'In educational use', demonstration: 'Demonstration', published: 'Published',
    prototype: 'Prototype', research: 'Research', production: 'In production', pilot: 'Pilot',
  },
  type: {
    'anonymous-engineering': 'Anonymized engineering', 'founder-experience': 'Founder experience', academic: 'Research collaboration',
    education: 'Education', 'internal-rnd': 'Independent R&D', 'open-source': 'Open source',
    'technical-note': 'Technical note', case: 'Engineering and research case',
  },
};

function setupWorkFilter(filter) {
  const english = document.documentElement.lang === 'en';
  const list = document.getElementById(filter.getAttribute('aria-controls'));
  const form = filter.querySelector('form');
  const {q, technology, status, type, featured} = form.elements;
  const facets = {technology, status, type};
  const buttons = Array.from(filter.querySelectorAll('[data-filter]'));
  const [all, ...industries] = buttons;
  const activeIndustries = new Set();
  const count = filter.querySelector('[role="status"]');
  const empty = filter.querySelector('.filter-empty');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const cards = Array.from(list.querySelectorAll('[data-tags]'), element => ({
    element,
    industries: element.dataset.tags.split(/\s+/),
    technology: element.dataset.tech?.split(/\s+/).filter(Boolean) ?? [],
    status: [element.dataset.stage],
    type: [element.dataset.origin, element.dataset.caseKind],
    featured: element.dataset.featured === 'true',
    text: normalize(element.textContent),
  }));

  for (const [key, control] of Object.entries(facets)) {
    const options = new Set(cards.flatMap(card => card[key]));
    for (const [value, label] of Object.entries((english ? englishFacets : facetLabels)[key])) {
      if (options.has(value)) control.add(new Option(label, value));
    }
  }

  let searchSession = false;
  function update() {
    const terms = normalize(q.value).split(/\s+/).filter(Boolean);
    const selected = [...activeIndustries];
    const activeFacets = Object.entries(facets).filter(([, control]) => control.value);
    let visible = 0;
    for (const card of cards) {
      const matches = terms.every(term => card.text.includes(term))
        && selected.every(tag => card.industries.includes(tag))
        && activeFacets.every(([key, control]) => card[key].includes(control.value))
        && (!featured.checked || card.featured);
      card.element.hidden = !matches;
      if (matches) visible += 1;
    }
    all.setAttribute('aria-pressed', String(selected.length === 0));
    industries.forEach(button => button.setAttribute('aria-pressed', String(activeIndustries.has(button.dataset.filter))));
    count.textContent = english ? `Showing ${visible} of ${cards.length} cases` : `顯示 ${visible} 項，共 ${cards.length} 項`;
    empty.hidden = visible !== 0;
    list.hidden = visible === 0;
    list.classList.toggle('single-result', visible === 1);
  }

  function restore() {
    const params = new URLSearchParams(location.search);
    q.value = (params.get('q') ?? '').slice(0, q.maxLength);
    featured.checked = params.get('featured') === '1';
    for (const [key, control] of Object.entries(facets)) {
      control.value = params.get(key) ?? '';
      if (control.selectedIndex === -1) control.value = '';
    }
    const selected = new Set(params.getAll('industry'));
    activeIndustries.clear();
    for (const button of industries) {
      const tag = button.dataset.filter;
      if (selected.has(tag)) activeIndustries.add(tag);
    }
    searchSession = false;
    update();
  }

  function share(replace = false) {
    const url = new URL(location.href);
    const {searchParams} = url;
    for (const field of ['q', 'industry', 'featured', ...Object.keys(facets)]) searchParams.delete(field);
    activeIndustries.forEach(tag => searchParams.append('industry', tag));
    if (q.value.trim()) searchParams.set('q', q.value.trim());
    if (featured.checked) searchParams.set('featured', '1');
    for (const [key, control] of Object.entries(facets)) {
      if (control.value) searchParams.set(key, control.value);
    }
    url.hash = 'work';
    const changed = url.href !== location.href;
    if (changed) {
      if (replace) history.replaceState(null, '', url);
      else history.pushState(null, '', url);
    }
    update();
    return changed;
  }

  all.addEventListener('click', () => {
    activeIndustries.clear();
    share();
  });
  for (const button of industries) {
    button.addEventListener('click', () => {
      const tag = button.dataset.filter;
      if (activeIndustries.has(tag)) activeIndustries.delete(tag);
      else activeIndustries.add(tag);
      share();
    });
  }
  q.addEventListener('input', () => {
    if (share(searchSession)) searchSession = true;
  });
  form.addEventListener('change', event => {
    searchSession = false;
    if (event.target !== q) share();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    share(searchSession);
    searchSession = false;
  });

  function reset() {
    activeIndustries.clear();
    form.reset();
    searchSession = false;
    share();
  }

  filter.querySelector('[data-reset-work]').addEventListener('click', () => {
    reset();
    all.focus();
  });
  document.querySelectorAll('[data-clear-case-list]').forEach(link => link.addEventListener('click', reset));
  window.addEventListener('popstate', restore);
  restore();
  filter.hidden = false;
}

document.querySelectorAll('[data-work-filter]').forEach(setupWorkFilter);
