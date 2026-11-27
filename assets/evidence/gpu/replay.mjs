import { track } from '../../analytics.mjs';
import { checkedTrace, jobState, latestAt } from './trace-model.mjs';

const get = id => document.getElementById('gpu-record-' + id);
const player = get('player');
const slider = get('slider');
const play = get('play');
const filter = get('filter');
const speed = get('speed');
const language = get('language');
const chart = get('chart');
const translatable = [...document.querySelectorAll('[data-en]')].map(node => [node, node.textContent.trim()]);
const params = new URLSearchParams(location.search);
let isEnglish = params.get('lang') === 'en';
const tr = (zh, en) => isEnglish ? en : zh;
const stateLabels = {
  pending: ['待提交', 'Pending submission'],
  queued: ['佇列等待', 'Queued'],
  running: ['執行中', 'Running'],
  done: ['已完成', 'Completed'],
  failed: ['失敗', 'Failed'],
};
let trace;
let now = 0;
let timer;
let lastAt;
let began = false;
let rows = [];
let chartMax = 1;

function tag(name, className) {
  const node = document.createElement(name);
  if (className) node.className = className;
  return node;
}

const seconds = time => Number(time).toFixed(2) + ' s';
const stateLabel = state => stateLabels[state][isEnglish ? 1 : 0];
const chartX = time => 8 + time / trace.duration * 624;
const chartY = value => 99 - value / chartMax * 89;

function samplePath(key) {
  const path = trace.samples.map((sample, index) => {
    const x = chartX(sample.time);
    const y = chartY(sample[key]);
    return index ? `H${x}V${y}` : `M${x} ${y}`;
  });
  return path.join('') + 'H' + chartX(trace.duration);
}

function buildRows() {
  rows = trace.jobs.map(job => {
    const root = tag('details');
    const summary = tag('summary');
    const state = tag('span');
    const rail = tag('div', 'gpu-record-rail');
    rail.setAttribute('aria-hidden', 'true');
    const interval = tag('span', 'gpu-record-interval');
    interval.style.insetInlineStart = job.started / trace.duration * 100 + '%';
    interval.style.width = (job.finished - job.started) / trace.duration * 100 + '%';
    rail.append(interval);
    summary.append(document.createTextNode(job.id), state);
    const detail = tag('p');
    root.append(summary, detail, rail);
    return { job, root, state, detail };
  });
  get('jobs').replaceChildren(...rows.map(({ root }) => root));
}

function rowDetails(detail, job) {
  detail.textContent = tr(
    `提交 ${seconds(job.submitted)} · 啟動 ${seconds(job.started)} · 結束 ${seconds(job.finished)} · 宣告 ${job.requestedMiB} MiB · 實測峰值 ${job.peakMiB} MiB · 結束碼 ${job.exitCode}`,
    `Submitted ${seconds(job.submitted)} · Started ${seconds(job.started)} · Finished ${seconds(job.finished)} · Requested ${job.requestedMiB} MiB · Peak ${job.peakMiB} MiB · Exit code ${job.exitCode}`
  );
}

function render() {
  if (!trace) return;
  slider.value = String(now);
  slider.setAttribute('aria-valuetext', seconds(now));
  get('time').value = seconds(now) + ' / ' + seconds(trace.duration);
  play.textContent = timer !== undefined ? tr('暫停', 'Pause') : now >= trace.duration ? tr('重播', 'Replay') : tr('播放', 'Play');
  player.style.setProperty('--record-cursor', now / trace.duration * 100 + '%');
  for (const { job, root, state } of rows) {
    root.hidden = filter.value !== 'all' && job.group !== filter.value;
    const current = jobState(job, now);
    root.dataset.state = current;
    state.textContent = stateLabel(current);
  }
  const sample = latestAt(trace.samples, now);
  get('readable').value = sample
    ? tr(`實測 ${sample.usedMiB} MiB · 保留 ${sample.reservedMiB} MiB`, `Measured ${sample.usedMiB} MiB · Reserved ${sample.reservedMiB} MiB`)
    : tr('等候第一筆取樣', 'Waiting for the first sample');
  const cursor = chart.querySelector('.gpu-record-cursor');
  cursor.setAttribute('x1', chartX(now));
  cursor.setAttribute('x2', chartX(now));
  const event = latestAt(trace.events, now);
  get('event').textContent = event ? seconds(event.time) + ' · ' + event.id + ' · ' + stateLabel(event.state) : '';
}

function pause() {
  clearInterval(timer);
  timer = undefined;
  render();
}

function begin() {
  if (!began) {
    began = true;
    track('demo_started', { demo: 'gpu' });
  }
  if (now >= trace.duration) now = 0;
  lastAt = performance.now();
  timer = setInterval(() => {
    const clock = performance.now();
    now = Math.min(trace.duration, now + (clock - lastAt) / 1000 * Number(speed.value));
    lastAt = clock;
    if (now === trace.duration) {
      pause();
      track('demo_completed', { demo: 'gpu' });
    } else {
      render();
    }
  }, 45);
  render();
}

function applyLanguage() {
  const locale = tr('zh-Hant', 'en');
  document.documentElement.lang = locale;
  document.title = tr('GPU 排程實跑回放｜量維資科 Quantquer', 'GPU Scheduling Recorded Replay | Quantquer');
  const dark = document.documentElement.dataset.theme === 'dark';
  document.querySelector('#themeToggle').setAttribute('aria-label', dark
    ? tr('切換亮色模式', 'Switch to light mode')
    : tr('切換深色模式', 'Switch to dark mode'));
  for (const [node, zh] of translatable) node.textContent = tr(zh, node.dataset.en);
  for (const { detail, job } of rows) rowDetails(detail, job);
  language.textContent = tr('English', '繁體中文');
  language.lang = tr('en', 'zh-Hant');
  get('cta').href = '/project-planner/?service=gpu-infrastructure' + (isEnglish ? '&lang=en' : '');
  render();
}

language.addEventListener('click', () => {
  const url = new URL(location.href);
  isEnglish = !isEnglish;
  if (isEnglish) url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  applyLanguage();
});

applyLanguage();
language.hidden = false;
try {
  const response = await fetch('/assets/evidence/gpu/trace.json');
  if (!response.ok) throw new Error('Trace unavailable');
  trace = checkedTrace(await response.json());
  slider.max = String(trace.duration);
  chartMax = Math.max(1, ...trace.samples.map(sample => Math.max(sample.usedMiB, sample.reservedMiB)));
  chart.querySelector('.gpu-record-reserved').setAttribute('d', samplePath('reservedMiB'));
  chart.querySelector('.gpu-record-observed').setAttribute('d', samplePath('usedMiB'));
  buildRows();
  applyLanguage();
  get('load').hidden = true;
  player.hidden = false;
  play.addEventListener('click', () => timer === undefined ? begin() : pause());
  get('reset').addEventListener('click', () => { now = 0; pause(); });
  slider.addEventListener('input', () => { now = Number(slider.value); pause(); });
  slider.addEventListener('keydown', event => {
    const direction = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    now = Math.max(0, Math.min(trace.duration, now + .25 * direction));
    pause();
  });
  slider.addEventListener('change', () => track('demo_interacted', { demo: 'gpu' }));
  filter.addEventListener('change', render);
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer !== undefined) pause(); });
} catch {
  const load = get('load');
  load.textContent = tr('無法載入回放，可下載匿名紀錄。', 'Replay could not load. The anonymized trace is available below.');
  const copy = translatable.find(([node]) => node === load);
  copy[1] = '無法載入回放，可下載匿名紀錄。';
  load.dataset.en = 'Replay could not load. The anonymized trace is available below.';
}
