export const tr = (locale, zh, en) => locale === 'en' ? en : zh;

export const escape = value => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);

export function select(name, label, options, selected) {
  return `<div class="engineering-demo-field"><label for="demo-${escape(name)}">${escape(label)}</label>
  <select name="${escape(name)}" id="demo-${escape(name)}">${Object.entries(options).map(([value, text]) =>
    `<option value="${escape(value)}"${String(selected) === value ? ' selected' : ''}>${escape(text)}</option>`).join('')}</select></div>`;
}

export function table(caption, columns, rows) {
  return `<div class="engineering-demo-table"><table><caption>${escape(caption)}</caption>
  <thead><tr>${columns.map(name => `<th scope="col">${escape(name)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(([first, ...rest]) => `<tr><th scope="row">${escape(first)}</th>${rest.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function facts(pairs) {
  return `<dl class="engineering-demo-facts">${pairs.map(([title, value]) =>
    `<div><dt>${escape(title)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}

export const flag = (locale, pass) => pass ? tr(locale, '通過', 'Pass') : tr(locale, '待修正', 'Needs correction');
