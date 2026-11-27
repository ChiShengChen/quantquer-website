import { simulateGpuPolicy, syntheticCapacity, syntheticJobs } from './policy-model.mjs';

const copy = {
  fifo: [
    '依提交先後排隊。隊首需要等候資源時，其他工作也等候。',
    'Admit jobs in arrival order. If the head of the queue cannot fit, later jobs wait.',
  ],
  priority: [
    '從符合剩餘資源的工作中，先執行優先級分數最高者。',
    'Among jobs that fit the available resources, select the highest priority score.',
  ],
  memory: [
    '從符合剩餘資源的工作中，先選擇記憶體需求最大的工作。',
    'Among jobs that fit the available resources, select the largest memory request.',
  ],
  shortest: [
    '從符合剩餘資源的工作中，先執行設定時間最短者。',
    'Among jobs that fit the available resources, select the shortest configured duration.',
  ],
  workload: [
    '從符合剩餘資源的工作中，先執行互動型工作，再執行批次工作。',
    'Among jobs that fit the available resources, prefer interactive jobs over batch jobs.',
  ],
};

const get = id => document.getElementById('gpu-policy-' + id);
const panel = get('panel');
const select = get('select');

function buildRow(label, values) {
  const row = document.createElement('tr');
  const name = document.createElement('th');
  name.scope = 'row';
  name.textContent = label;
  row.append(name);
  for (const value of values) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  return row;
}

function render() {
  const locale = document.documentElement.lang;
  const en = locale === 'en' || new URLSearchParams(location.search).get('lang') === 'en';
  const number = new Intl.NumberFormat(en ? 'en' : 'zh-Hant', { maximumFractionDigits: 2 });
  const seconds = value => number.format(value) + ' s';
  const { dispatches, summary } = simulateGpuPolicy(select.value);
  get('rule').textContent = copy[select.value][en ? 1 : 0];
  get('wait').textContent = seconds(summary.meanWait);
  get('elapsed').textContent = seconds(summary.makespan);
  get('rate').textContent = number.format(summary.jobsPerMinute);
  get('memory').textContent = number.format(summary.peakMemoryMiB) + ' / ' + number.format(syntheticCapacity.memoryMiB) + ' MiB';
  get('slots').textContent = summary.peakSlots + ' / ' + syntheticCapacity.slots;
  get('timing').replaceChildren(...dispatches.map(job => buildRow(job.id, [
    number.format(job.started),
    number.format(job.finished),
    number.format(job.started - job.submitted),
    number.format(job.reservedAfterStartMiB),
  ])));
  get('fixture').replaceChildren(...syntheticJobs.map(job => buildRow(job.id, [
    job.workload === 'interactive' ? (en ? 'Interactive' : '互動') : (en ? 'Batch' : '批次'),
    number.format(job.submitted), number.format(job.duration), number.format(job.memoryMiB), number.format(job.priority),
  ])));
}

if (panel) {
  render();
  select.addEventListener('change', render);
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  panel.hidden = false;
}
