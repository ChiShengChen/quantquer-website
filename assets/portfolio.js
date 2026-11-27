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
