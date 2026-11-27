import { studioDemos } from '../data/studio-demos.mjs';
import { studioPath, writeStudioPage } from './vnext-layout.mjs';
import { escape, tr } from '../assets/vnext-demos/view-utils.mjs';

const check = process.argv.includes('--check');

for (const demo of studioDemos) {
  const view = await import(`../assets/vnext-demos/${demo.id}-view.mjs`);
  for (const locale of ['zh', 'en']) {
    const { title, description, limits, related } = demo[locale];
    const local = route => studioPath(route, locale);
    const t = (zh, en) => escape(tr(locale, zh, en));
    const content = `<section class="wrap topic-hero engineering-demo-hero">
      <p class="eyebrow">Quantquer Labs</p>
      <h1>${escape(title)}</h1>
      <p class="topic-intro">${escape(description)}</p>
    </section>
    <section class="wrap engineering-demo" aria-labelledby="engineering-demo-title" data-engineering-demo="${demo.id}">
      <h2 id="engineering-demo-title">${t('操作與結果', 'Controls and results')}</h2>
      <p class="engineering-demo-disclosure">${escape(limits)}</p>
      <form class="engineering-demo-controls">
        <fieldset disabled><legend>${t('選擇測試條件', 'Choose test conditions')}</legend>
          <div class="engineering-demo-fields">${view.controls(locale)}</div>
        </fieldset>
        ${view.exportFile ? `<button class="btn btn-ghost" type="button" data-engineering-demo-export disabled>${t('下載概念平面圖（DXF）', 'Download concept plan (DXF)')}</button>` : ''}
      </form>
      <p class="engineering-demo-announcement" role="status" data-engineering-demo-status></p>
      <noscript><p>${t('以下為預設案例的結果。請啟用 JavaScript 更換測試條件。', 'Results for the default case follow. Enable JavaScript to change the test conditions.')}</p></noscript>
      <div class="engineering-demo-report" data-engineering-demo-report>${view.render(locale, view.defaults)}</div>
    </section>
    <section class="wrap engineering-demo-links" aria-label="${t('相關技術與解決方案', 'Related technology and solutions')}">
      <a class="btn btn-primary" href="${local(demo.solution)}">${t('探索相關解決方案', 'Explore the related solution')}</a>
      <a class="text-link" href="${local(demo.related)}">${escape(related)}</a>
    </section>`;
    await writeStudioPage({ route: demo.route, locale, title, description, content,
      breadcrumbs: [
        { href: local('/labs/'), label: 'Labs' },
        { href: local('/labs/demos/'), label: tr(locale, '互動展示', 'Interactive demos') },
      ],
      styles: ['/assets/vnext-demos/demo.css'], scripts: ['/assets/vnext-demos/demo-runtime.mjs'],
    }, { check });
  }
}
console.log(`${check ? 'Verified' : 'Built'} ${studioDemos.length * 2} engineering demo pages.`);
