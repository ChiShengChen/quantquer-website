import { track } from '../analytics.mjs';

const container = document.querySelector('[data-engineering-demo]');
if (container) {
  const kind = container.dataset.engineeringDemo;
  const imports = {
    reliability: () => import('./reliability-view.mjs'),
    'knowledge-arbitration': () => import('./knowledge-arbitration-view.mjs'),
    'robot-workcell': () => import('./robot-workcell-view.mjs'),
  };
  const form = container.querySelector('form');
  const status = container.querySelector('[data-engineering-demo-status]');
  const report = container.querySelector('[data-engineering-demo-report]');
  const english = document.documentElement.lang === 'en';
  const locale = english ? 'en' : 'zh';
  const events = { demo: kind };
  let started = false;

  async function initialize() {
    if (!Object.hasOwn(imports, kind)) return;
    try {
      const view = await imports[kind]();
      const values = () => Object.fromEntries(new FormData(form));
      form.addEventListener('change', () => {
        if (!started) {
          track('demo_started', events);
          started = true;
        }
        track('demo_interacted', events);
        // View HTML is produced only from fixed fixtures, known select options and escaped display text.
        report.innerHTML = view.render(locale, values());
        status.textContent = english ? 'Results updated.' : '結果已更新。';
      });
      const exportButton = form.querySelector('[data-engineering-demo-export]');
      if (exportButton && view.exportFile) {
        exportButton.addEventListener('click', () => {
          const { name, value } = view.exportFile(values());
          const url = URL.createObjectURL(new Blob([value], { type: 'application/dxf' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1_000);
          track('demo_completed', events);
        });
        exportButton.disabled = false;
      }
      form.querySelector('fieldset').disabled = false;
    } catch {
      status.textContent = english ? 'Controls are unavailable. The default results are shown below.' : '暫時無法操作，以下顯示預設結果。';
    }
  }
  initialize();
}
