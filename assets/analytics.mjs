import { analyticsPath } from './studio-integrations.mjs';

const events = {
  solution_viewed: ['solution'],
  contact_cta_clicked: [],
  case_study_viewed: ['project'],
  case_filter_used: [],
  demo_started: ['demo'],
  demo_interacted: ['demo'],
  demo_completed: ['demo'],
  showreel_started: [],
  showreel_completed: [],
  capability_pdf_downloaded: [],
  service_cta_clicked: ['service', 'project'],
  project_planner_started: ['service'],
  project_planner_step_completed: ['service', 'step'],
  project_planner_completed: ['service'],
  inquiry_started: ['service', 'channel'],
  inquiry_submitted: ['service'],
  inquiry_submission_failed: ['service'],
};

const services = new Set([
  'robotics', 'domain-rd', 'knowledge-base', 'edge-ai', 'agent',
  'generative-vision', 'photonic-simulation', 'gpu-infrastructure', 'research',
]);
const values = {
  service: value => services.has(value),
  project: value => typeof value === 'string' && /^[a-z][a-z0-9-]{1,46}$/.test(value),
  demo: value => ['vision', 'photonics', 'gpu', 'asr', 'research', 'reliability', 'knowledge-arbitration', 'robot-workcell'].includes(value),
  solution: value => ['semiconductor-edge-ai', 'enterprise-ai', 'ai-reliability', 'gpu-infrastructure', 'industrial-robotics', 'scientific-ai', 'financial-ai'].includes(value),
  channel: value => ['email', 'copy', 'web'].includes(value),
  step: value => Number.isInteger(value) && value >= 1 && value <= 7,
};

export function makeEvent(name, data = {}, locale = 'zh-Hant') {
  if (!Object.hasOwn(events, name)) return null;
  const details = { event: name, locale: locale === 'en' ? 'en' : 'zh-Hant' };
  for (const key of events[name]) {
    if (values[key](data[key])) details[key] = data[key];
  }
  return Object.freeze(details);
}

export function track(name, data) {
  const detail = makeEvent(name, data, document.documentElement.lang);
  if (detail) document.dispatchEvent(new CustomEvent('quantquer:analytics', { detail }));
}

if (typeof document !== 'undefined') {
  if (/^\/api\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(analyticsPath)) {
    document.addEventListener('quantquer:analytics', event => {
      const detail = makeEvent(event.detail?.event, event.detail, document.documentElement.lang);
      if (!detail) return;
      fetch(analyticsPath, {
        method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(detail),
      }).catch(() => {});
    });
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('[data-analytics]');
    if (link) track(link.dataset.analytics, link.dataset);
    const inquiry = event.target.closest?.('a[data-inquiry]:not([data-analytics])');
    if (inquiry) track('service_cta_clicked', { service: inquiry.dataset.inquiry });
    if (event.target.closest?.('[data-work-filter] [data-filter]')) track('case_filter_used');
  });
  document.addEventListener('change', event => {
    if (event.target.closest?.('[data-work-filter]')) track('case_filter_used');
    const demo = event.target.closest?.('[data-demo-kind]')?.dataset.demoKind;
    if (demo) track('demo_interacted', { demo });
  });
  const project = document.body.dataset.project;
  if (project) track('case_study_viewed', { project });
  const solution = /^(?:\/en)?\/solutions\/([a-z-]+)\/$/.exec(location.pathname)?.[1];
  if (values.solution(solution)) track('solution_viewed', { solution });
}
