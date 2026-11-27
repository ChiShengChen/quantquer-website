import { track } from './analytics.mjs';
import { inquiryEndpoint, submitInquiry } from './inquiry.mjs';
import {
  industries, objectives, services, readiness, deliverables, constraints,
  initialService, requirementFields, createBrief,
} from './planner-model.mjs';

const find = id => document.getElementById(id);
const form = find('planner-form');
const fields = find('planner-fields');
const heading = find('planner-step');
const back = find('planner-back');
const next = find('planner-next');
const status = find('planner-status');
const language = find('planner-language');
const translations = [...document.querySelectorAll('[data-en]')].map(node => [node, node.textContent.trim()]);
const params = new URLSearchParams(location.search);
const preferredService = [params.get('service'), params.get('inquiry')].find(value => Object.hasOwn(services, value));
const draft = { service: preferredService, deliverables: [], constraints: {}, tech: {} };
const savedTech = new Map();
const endpoint = inquiryEndpoint(document.querySelector('meta[name="quantquer-inquiry-endpoint"]')?.content, location.origin);
const steps = [
  ['你的產業', 'Your industry'],
  ['業務目標', 'Business objective'],
  ['技術需求', 'Technical requirements'],
  ['資料準備程度', 'Data readiness'],
  ['期望交付物', 'Expected deliverables'],
  ['專案限制', 'Project constraints'],
  ['專案需求摘要', 'Project brief'],
];
const translationsIndex = () => document.documentElement.lang === 'en' ? 1 : 0;
const msg = (zh, en) => translationsIndex() ? en : zh;
let step = 0;
let selectedService = Boolean(preferredService);
let started = false;
let lastRequest;

function node(tag, { text, className, ...attributes } = {}) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function group(grid = false) {
  return node('div', { className: 'planner-fields', 'data-grid': String(grid) });
}

function field(title, control) {
  const label = node('label', { className: 'planner-field' });
  label.append(node('span', { text: title }), control);
  return label;
}

function options(name, optionsMap, selected) {
  const select = node('select', { name, required: '' });
  select.append(node('option', { value: '', text: msg('請選擇', 'Select an option') }));
  for (const [key, title] of Object.entries(optionsMap)) {
    select.append(node('option', { value: key, text: title[translationsIndex()] }));
  }
  select.value = selected ?? '';
  return select;
}

function textField(name, title, value, length = 160, multiline = false) {
  const control = multiline
    ? node('textarea', { name, maxlength: length, rows: 3 })
    : node('input', { type: 'text', name, maxlength: length });
  control.value = value ?? '';
  return field(title, control);
}

function inputs(dictionary, values) {
  const grid = group(true);
  for (const [key, title] of Object.entries(dictionary)) {
    grid.append(textField(key, title[translationsIndex()], values[key]));
  }
  return grid;
}

function updateTech(container) {
  container.replaceChildren(inputs(requirementFields(draft.service), draft.tech));
}

function buildTech() {
  draft.service ||= initialService(preferredService, draft.objective);
  const select = options('service', services, draft.service);
  const answers = node('div');
  const labels = group();
  labels.append(field(msg('服務方向', 'Service area'), select));
  updateTech(answers);
  select.addEventListener('change', () => {
    saveTech(new FormData(form));
    draft.service = select.value || initialService(preferredService, draft.objective);
    draft.tech = savedTech.get(draft.service) ?? {};
    selectedService = true;
    updateTech(answers);
  });
  fields.append(labels, answers);
}

function labeledPairs(brief) {
  const lines = list => list.map(item => item.label + ' — ' + item.answer).join('\n');
  const bullets = list => list.join('\n');
  return [
    [msg('產業', 'Industry'), brief.industry],
    [msg('業務目標', 'Business objective'), brief.objective],
    [msg('需求描述', 'Project description'), brief.description],
    [msg('建議服務', 'Suggested service'), brief.serviceLabel],
    [msg('技術需求', 'Technical requirements'), lines(brief.tech)],
    [msg('資料狀態', 'Data readiness'), brief.readiness],
    [msg('所需輸入', 'Required inputs'), brief.inputs],
    [msg('建議交付物', 'Suggested deliverables'), bullets(brief.deliverables)],
    [msg('現有限制', 'Constraints'), lines(brief.constraints)],
    [msg('初步複雜度', 'Initial complexity'), brief.complexity],
    [msg('風險因素', 'Risk factors'), bullets(brief.risks)],
    [msg('待討論問題', 'Open questions'), bullets(brief.questions)],
    [msg('建議下一步', 'Recommended next step'), brief.next],
  ].filter(([, value]) => Boolean(value));
}

function download(contents, extension, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = node('a', { href: url, download: 'quantquer-project-brief.' + extension });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function resultButton(label, action) {
  const button = node('button', { className: 'btn btn-ghost', text: label, type: 'button' });
  button.addEventListener('click', action);
  return button;
}

function buildSubmission(brief, text) {
  const controls = node('div', { className: 'planner-submit' });
  const email = node('input', { name: 'reply-email', type: 'email', maxlength: 180, autocomplete: 'email', required: '' });
  const submit = node('button', { className: 'btn btn-primary', type: 'button', text: msg('送出詢價', 'Submit inquiry') });
  controls.append(field(msg('回覆信箱', 'Reply email'), email), node('div', { className: 'planner-actions' }));
  controls.lastElementChild.append(submit);
  submit.addEventListener('click', async () => {
    if (!email.reportValidity()) return;
    const replyTo = email.value.trim();
    if (lastRequest?.text !== text || lastRequest.replyTo !== replyTo) {
      lastRequest = { text, replyTo, requestId: crypto.randomUUID() };
    }
    submit.disabled = true;
    status.textContent = msg('詢價送出中。', 'Submitting inquiry.');
    track('inquiry_started', { service: brief.service, channel: 'web' });
    try {
      const receipt = await submitInquiry(endpoint, { replyTo, brief: text, requestId: lastRequest.requestId });
      track('inquiry_submitted', { service: brief.service });
      if (controls.isConnected) status.textContent = msg('已收到詢價，收件編號 ' + receipt + '。', 'Inquiry received. Receipt ' + receipt + '.');
    } catch {
      track('inquiry_submission_failed', { service: brief.service });
      if (controls.isConnected) status.textContent = msg('暫時無法確認收件。你可以重試或開啟郵件草稿。', 'Receipt could not be confirmed. Retry or open an email draft.');
    } finally {
      submit.disabled = false;
    }
  });
  return controls;
}

function buildSummary() {
  const brief = createBrief(draft, document.documentElement.lang);
  const pairs = labeledPairs(brief);
  const definition = node('dl', { className: 'planner-result' });
  for (const [label, value] of pairs) definition.append(node('dt', { text: label }), node('dd', { text: value }));
  const title = msg('Quantquer 專案需求摘要', 'Quantquer Project Brief');
  const note = msg('複雜度依部署、維護、資料限制與已填技術條件評估。實際範圍與報價由會議確認。', 'Complexity considers deployment, support, data constraints and stated technical requirements. Scope and pricing are confirmed in a scoping call.');
  const plain = [title, ...pairs.map(([label, value]) => label + '\n' + value), note].join('\n\n');
  const markdown = [title, ...pairs.map(([label, value]) => '## ' + label + '\n\n' + value.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))), note].join('\n\n');
  const buttons = node('div', { className: 'planner-actions' });
  const email = node('a', {
    className: 'btn btn-primary',
    text: msg('開啟郵件草稿', 'Open email draft'),
    href: 'mailto:chisheng.m.chen@gmail.com?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(plain),
  });
  email.addEventListener('click', () => track('inquiry_started', { service: brief.service, channel: 'email' }));
  buttons.append(
    email,
    resultButton(msg('複製需求', 'Copy brief'), async () => {
      try {
        await navigator.clipboard.writeText(plain);
        track('inquiry_started', { service: brief.service, channel: 'copy' });
        status.textContent = msg('已複製需求摘要。', 'Brief copied.');
      } catch {
        status.textContent = msg('無法存取剪貼簿，請改用檔案下載。', 'Clipboard access is unavailable. Download the brief instead.');
      }
    }),
    resultButton('Markdown', () => download('# ' + markdown + '\n', 'md', 'text/markdown;charset=utf-8')),
    resultButton('JSON', () => download(JSON.stringify(brief, null, 2), 'json', 'application/json')),
  );
  fields.append(definition, node('p', { className: 'planner-note', text: note }), buttons);
  if (endpoint) fields.append(buildSubmission(brief, plain));
}

function renderStep() {
  const last = steps.length - 1;
  heading.textContent = steps[step][translationsIndex()];
  find('planner-count').textContent = msg('步驟 ', 'Step ') + (step + 1) + ' / ' + steps.length;
  const markers = steps.map((title, index) => {
    const marker = node('li', { 'aria-label': title[translationsIndex()] });
    if (index === step) marker.setAttribute('aria-current', 'step');
    if (index < step) marker.dataset.state = 'complete';
    return marker;
  });
  const indicators = find('planner-indicators');
  indicators.setAttribute('aria-label', msg('專案評估步驟', 'Project steps'));
  indicators.replaceChildren(...markers);
  fields.replaceChildren();
  status.textContent = '';
  back.hidden = step === 0;
  next.hidden = step === last;
  next.textContent = step === last - 1 ? msg('產生摘要', 'Generate brief') : msg('下一步', 'Next');
  switch (step) {
    case 0:
      fields.append(field(msg('產業類別', 'Industry'), options('industry', industries, draft.industry)));
      break;
    case 1:
      fields.append(field(msg('主要目標', 'Primary objective'), options('objective', objectives, draft.objective)),
        textField('description', msg('補充說明（選填）', 'Additional context (optional)'), draft.description, 550, true));
      break;
    case 2:
      buildTech();
      break;
    case 3:
      fields.append(field(msg('目前資料狀態', 'Current data availability'), options('readiness', readiness, draft.readiness)));
      break;
    case 4: {
      const choices = group(true);
      for (const [value, title] of Object.entries(deliverables)) {
        const input = node('input', { type: 'checkbox', name: 'deliverable', value });
        input.checked = draft.deliverables.includes(value);
        const label = node('label', { className: 'planner-choice' });
        label.append(input, node('span', { text: title[translationsIndex()] }));
        choices.append(label);
      }
      fields.append(choices);
      break;
    }
    case 5:
      fields.append(inputs(constraints, draft.constraints));
      break;
    case 6:
      buildSummary();
      break;
  }
}

function saveTech(data) {
  draft.tech = Object.fromEntries(Object.keys(requirementFields(draft.service)).map(key => [key, data.get(key)]));
  savedTech.set(draft.service, draft.tech);
}

function saveStep() {
  const data = new FormData(form);
  switch (step) {
    case 0: draft.industry = data.get('industry'); break;
    case 1:
      draft.objective = data.get('objective');
      draft.description = data.get('description');
      if (!selectedService) {
        draft.service = initialService(preferredService, draft.objective);
        draft.tech = savedTech.get(draft.service) ?? {};
      }
      break;
    case 2: saveTech(data); break;
    case 3: draft.readiness = data.get('readiness'); break;
    case 4: draft.deliverables = data.getAll('deliverable'); break;
    case 5: draft.constraints = Object.fromEntries(data); break;
  }
}

function navigate(nextStep) {
  saveStep();
  step = nextStep;
  renderStep();
  heading.focus();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (step >= steps.length - 1) return;
  if (!started) {
    started = true;
    track('project_planner_started', { service: draft.service });
  }
  track('project_planner_step_completed', { service: draft.service, step: step + 1 });
  navigate(step + 1);
  if (step === steps.length - 1) track('project_planner_completed', { service: draft.service });
});
back.addEventListener('click', () => navigate(step - 1));

function applyLanguage(locale) {
  document.documentElement.lang = locale;
  document.title = msg('AI 專案需求評估｜量維資科 Quantquer', 'AI Project Scoping | Quantquer');
  const dark = document.documentElement.dataset.theme === 'dark';
  find('themeToggle').setAttribute('aria-label', dark
    ? msg('切換亮色模式', 'Switch to light mode')
    : msg('切換深色模式', 'Switch to dark mode'));
  for (const [element, original] of translations) element.textContent = msg(original, element.dataset.en);
  language.textContent = msg('English', '繁體中文');
  language.lang = msg('en', 'zh-Hant');
  renderStep();
}

language.addEventListener('click', () => {
  saveStep();
  const locale = msg('en', 'zh-Hant');
  const url = new URL(location.href);
  if (locale === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  applyLanguage(locale);
});
applyLanguage(params.get('lang') === 'en' ? 'en' : 'zh-Hant');
form.hidden = false;
language.hidden = false;
