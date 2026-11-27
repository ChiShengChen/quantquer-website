import { makeInput, meshStages, simulateMesh } from './model.mjs';

const element = id => document.getElementById(id);
const controls = element('mesh-controls');
const input = element('mesh-input');
const power = element('mesh-power');
const inputPhase = element('mesh-input-phase');
const faultEnabled = element('mesh-fault');
const cell = element('mesh-cell');
const phase = element('mesh-phase');
const attenuation = element('mesh-attenuation');
const panel = element('mesh-panel');
const canvas = element('mesh-canvas');
const context = canvas.getContext('2d');
const languageButton = element('mesh-language');
const themeButton = element('themeToggle');
const originalTitle = document.title;
const queryEnglish = () => new URLSearchParams(location.search).get('lang') === 'en';
let english = queryEnglish();
const tr = (zh, en) => english ? en : zh;
const translations = Array.from(document.querySelectorAll('[data-en]'), node => ({
  node,
  original: node.textContent.trim(),
  english: node.dataset.en,
}));
const names = Array.from(document.querySelectorAll('[data-en-aria]'), node => ({
  node,
  original: node.getAttribute('aria-label'),
  english: node.dataset.enAria,
}));
const links = Array.from(document.querySelectorAll('[data-en-href]'), node => ({
  node,
  original: node.getAttribute('href'),
  english: node.dataset.enHref,
}));

const percentNumber = value => (value * 100).toFixed(2);
const percentage = value => value == null ? '—' : percentNumber(value) + '%';
const degree = value => value + '°';
let latestResult;
let latestFault;

function powerLine(from, to, y, power, palette) {
  context.beginPath();
  context.moveTo(from, y);
  context.lineTo(to, y);
  context.strokeStyle = power > 1e-12 ? palette.accent : palette.line;
  context.lineWidth = 1 + power * 6;
  context.stroke();
}

function drawMesh() {
  if (!latestResult || !context) return;
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  const css = getComputedStyle(canvas);
  const color = property => css.getPropertyValue(property).trim();
  const palette = {
    accent: color('--accent'),
    line: color('--fg-faint'),
    ink: color('--fg'),
    background: color('--bg'),
    fault: color('--mesh-fault'),
  };
  const compact = width < 500;
  const margin = compact ? 34 : 66;
  const step = (width - margin * 2) / meshStages.length;
  const stages = meshStages.map((_, index) => margin + (index + 1) * step);
  stages.unshift(margin);
  const rows = Array.from({ length: 4 }, (_, port) => 47 + (height - 71) * port / 3);
  context.font = '500 12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = palette.ink;
  stages.forEach((x, index) => {
    const label = index
      ? (compact ? 'S' + index : tr('第 ' + index + ' 級', 'Stage ' + index))
      : tr('輸入', 'Input');
    context.fillText(label, x, 18);
  });
  rows.forEach((y, port) => {
    context.fillText(String(port + 1), margin / 2, y);
  });

  const { history } = latestResult.current;
  meshStages.forEach((cells, index) => {
    const left = stages[index];
    const right = stages[index + 1];
    const middle = (left + right) / 2;
    rows.forEach((y, port) => {
      powerLine(left, middle, y, history[index][port], palette);
      powerLine(middle, right, y, history[index + 1][port], palette);
    });
    for (const item of cells) {
      const [upper, lower] = item.ports;
      const selected = latestFault?.cell === item.id;
      const size = compact ? 13 : 20;
      context.beginPath();
      context.rect(middle - size / 2, rows[upper] - 6, size, rows[lower] - rows[upper] + 12);
      context.fillStyle = palette.background;
      context.fill();
      context.lineWidth = selected ? 2 : 1;
      context.strokeStyle = selected ? palette.fault : palette.line;
      context.setLineDash(selected ? [4, 3] : []);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.moveTo(middle - size / 3, rows[upper]);
      context.lineTo(middle + size / 3, rows[lower]);
      context.moveTo(middle + size / 3, rows[upper]);
      context.lineTo(middle - size / 3, rows[lower]);
      context.stroke();
    }
  });
  stages.forEach(x => {
    rows.forEach(y => {
      context.beginPath();
      context.arc(x, y, 2, 0, Math.PI * 2);
      context.fillStyle = palette.ink;
      context.fill();
    });
  });
}

function rowHeading(row, label) {
  const heading = document.createElement('th');
  heading.scope = 'row';
  heading.textContent = label;
  row.append(heading);
}

function portPower(row, value, reference) {
  const td = row.insertCell();
  const bar = document.createElement('div');
  bar.className = reference ? 'showcase-track mesh-ideal' : 'showcase-track';
  bar.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.style.setProperty('--showcase-width', Math.min(1, value) * 100 + '%');
  bar.append(fill);
  const output = document.createElement('output');
  output.setAttribute('aria-live', 'off');
  output.value = percentage(value);
  td.append(bar, output);
}

function renderResults(result) {
  const outputs = result.current.history.at(-1).map((value, i) => {
    const row = document.createElement('tr');
    rowHeading(row, tr('通道 ' + (i + 1), 'Channel ' + (i + 1)));
    portPower(row, result.ideal.history.at(-1)[i], true);
    portPower(row, value, false);
    return row;
  });
  const history = result.current.history.map((stage, stageIndex) => {
    const row = document.createElement('tr');
    rowHeading(row, stageIndex ? 'S' + stageIndex : tr('輸入', 'Input'));
    stage.forEach((value, port) => {
      const td = row.insertCell();
      const reference = document.createElement('span');
      reference.textContent = percentNumber(result.ideal.history[stageIndex][port]);
      const current = document.createElement('span');
      current.className = 'mesh-trace-current';
      current.textContent = percentNumber(value);
      td.append(reference, current);
    });
    return row;
  });
  element('mesh-output').replaceChildren(...outputs);
  element('mesh-history').replaceChildren(...history);
  const error = percentage(result.relativeError);
  const loss = percentage(result.powerLoss);
  const total = percentage(result.outputPower);
  element('mesh-summary').textContent = tr(
    `相對輸出誤差 ${error} · 總功率損失 ${loss} · 總輸出 ${total}`,
    `Relative output error ${error} · Total power loss ${loss} · Total output ${total}`
  );
}

function renderSimulation() {
  inputPhase.disabled = input.value !== 'coherent';
  for (const control of [cell, phase, attenuation]) control.disabled = !faultEnabled.checked;
  element('mesh-input-phase-value').value = degree(inputPhase.value);
  element('mesh-power-value').value = power.value + '%';
  element('mesh-phase-value').value = degree(phase.value);
  element('mesh-attenuation-value').value = attenuation.value + '%';
  latestFault = faultEnabled.checked
    ? { cell: cell.value, phaseDelta: Number(phase.value), powerLoss: Number(attenuation.value) }
    : null;
  latestResult = simulateMesh(makeInput(input.value, Number(power.value), Number(inputPhase.value)), latestFault);
  renderResults(latestResult);
  drawMesh();
}

function setLanguage() {
  document.documentElement.lang = tr('zh-Hant', 'en');
  document.title = tr(originalTitle, 'Multi-stage photonic fault simulation | Quantquer');
  languageButton.textContent = tr('English', '繁體中文');
  languageButton.lang = tr('en', 'zh-Hant');
  for (const entry of translations) entry.node.textContent = tr(entry.original, entry.english);
  for (const entry of names) entry.node.setAttribute('aria-label', tr(entry.original, entry.english));
  for (const entry of links) entry.node.setAttribute('href', tr(entry.original, entry.english));
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', dark
    ? tr('切換亮色模式', 'Switch to light mode')
    : tr('切換深色模式', 'Switch to dark mode'));
  renderSimulation();
}

languageButton.addEventListener('click', () => {
  const url = new URL(location.href);
  english = !english;
  if (english) {
    url.searchParams.set('lang', 'en');
  } else {
    url.searchParams.delete('lang');
  }
  history.replaceState(null, '', url);
  setLanguage();
});

window.addEventListener('popstate', () => {
  english = queryEnglish();
  setLanguage();
});
window.addEventListener('resize', drawMesh);
document.addEventListener('quantquer:themechange', drawMesh);
controls.addEventListener('input', renderSimulation);
controls.addEventListener('submit', event => event.preventDefault());
controls.addEventListener('reset', () => requestAnimationFrame(renderSimulation));

panel.hidden = false;
languageButton.hidden = false;
setLanguage();
