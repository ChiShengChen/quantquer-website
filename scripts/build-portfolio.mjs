import { readFile, writeFile, mkdir, access, rename, rm, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { caseDiagramIcons } from './case-diagram-icons.mjs';
import { caseEvidence, evidenceTypes } from '../data/studio-case-evidence.mjs';
import { featuredEvidence } from '../data/studio-featured.mjs';
import { renderStudioPage, studioPath } from './vnext-layout.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = 'https://quantquer.com';
const checking = process.argv.slice(2).includes('--check');
const portfolio = JSON.parse(await readFile(resolve(root, 'data/projects.json'), 'utf8'));
const caseDiagrams = JSON.parse(await readFile(resolve(root, 'data/case-diagrams.json'), 'utf8'));

const domains = {
  semiconductor: ['半導體與邊緣 AI', 'Semiconductor and Edge AI'],
  agent: ['AI Agent 與企業智慧', 'Agents and Enterprise Intelligence'],
  health: ['醫療與神經科技', 'Healthcare and Neurotechnology'],
  industrial: ['工業智慧', 'Industrial Intelligence'],
  finance: ['金融與決策智慧', 'Financial Intelligence'],
  science: ['科學與量子運算', 'Scientific and Quantum Computing'],
  infrastructure: ['AI 基礎設施與產品工程', 'AI Infrastructure'],
};

const technologies = {
  agent: ['AI Agent', 'AI Agents'],
  cad: ['CAD', 'CAD'],
  optimization: ['最佳化', 'Optimization'],
  signal: ['訊號處理', 'Signal Processing'],
  'time-series': ['時序分析', 'Time Series'],
  vision: ['電腦視覺', 'Computer Vision'],
  knowledge: ['知識工程', 'Knowledge Engineering'],
  'gen-ai': ['生成式 AI', 'Generative AI'],
  simulation: ['模擬', 'Simulation'],
  gpu: ['GPU 排程', 'GPU Scheduling'],
};

const origins = {
  'anonymous-engineering': ['匿名工程案例', 'Anonymized Engineering Case'],
  academic: ['學術研究合作', 'Academic Research Collaboration'],
  'founder-experience': ['創辦人研發經歷', 'Founder Engineering Experience'],
  education: ['獨立教學應用', 'Independent Education Application'],
  'internal-rnd': ['自主研發', 'Independent Research and Development'],
  'open-source': ['獨立開源工具', 'Independent Open-source Tool'],
};

const stages = {
  delivered: ['軟體已交付', 'Software Delivered'],
  'clinical-use': ['研究發表及門診使用', 'Published Research and Outpatient Use'],
  evaluation: ['工程評估', 'Engineering Evaluation'],
  development: ['研發經歷', 'Engineering Development'],
  deployment: ['地端或邊緣運行', 'Local or Edge Deployment'],
  application: ['實際教學使用', 'In Use for Education'],
  demonstration: ['互動技術展示', 'Interactive Demonstration'],
  published: ['已開源', 'Open Source'],
};

const metricTypes = {
  measured: ['實際量測', 'Measured'],
  target: ['開發目標', 'Target'],
  simulated: ['模擬結果', 'Simulated'],
};

const slugs = new Map(portfolio.projects.map(project => [project.slug, project]));
const anchors = new Set();
const featured = new Set(portfolio.featured);
const evidenceIds = new Set();
const inquiryOptions = new Set([
  'robotics', 'domain-rd', 'knowledge-base', 'edge-ai',
  'agent', 'generative-vision', 'photonic-simulation', 'gpu-infrastructure', 'research',
]);
const languages = ['zh', 'en'];

function assert(condition, description) {
  if (!condition) throw new Error(description);
}

function requireText(value, name) {
  assert(typeof value === 'string' && value.trim() !== '', `Missing ${name}`);
}

function validateLink(href, project) {
  assert(typeof href === 'string', `Missing link for ${project.slug}`);
  const local = href.startsWith('/') && !href.startsWith('//');
  assert(local || href.startsWith('https://'), `Invalid link for ${project.slug}: ${href}`);
  assert(!/[\s\\]/.test(href), `Invalid URL for ${project.slug}: ${href}`);
  if (local) {
    assert(new URL(href, site).origin === site, `Unexpected origin in ${href}`);
  }
}

assert(slugs.size === portfolio.projects.length, 'Project slugs must be unique');
assert(featured.size === portfolio.featured.length && featured.size >= 4 && featured.size <= 6, 'Use four to six distinct featured projects');
for (const slug of featured) assert(slugs.has(slug), `Unknown featured project: ${slug}`);
for (const slug of Object.keys(caseDiagrams)) assert(slugs.has(slug), `Unknown case diagram: ${slug}`);

for (const project of portfolio.projects) {
  const classification = caseEvidence[project.slug];
  assert(classification?.types.every(type => Object.hasOwn(evidenceTypes, type)) && classification.types.length && /^[a-z-]+$/.test(classification.solution), `Missing evidence classification or solution: ${project.slug}`);
  const anchor = project.anchor ?? project.slug;
  const visual = featuredEvidence[project.slug]?.visual;
  if (visual) {
    assert([1, 2].includes(visual.files.length), `Expected one shared or two localized featured images: ${project.slug}`);
    for (const { path, width, height } of visual.files) {
      assert(/^\/assets\/evidence\/featured\/[a-z0-9-]+\.webp$/.test(path)
        && [width, height].every(value => Number.isInteger(value) && value > 0), `Invalid featured image: ${project.slug}`);
      await access(resolve(root, path.slice(1)));
    }
    assert([visual.alt, visual.caption].every(pair => Array.isArray(pair) && pair.length === languages.length), `Missing featured image translations: ${project.slug}`);
    for (const language of languages) {
      requireText(label(visual, 'alt', language), `${project.slug} featured image alt`);
      requireText(label(visual, 'caption', language), `${project.slug} featured image caption`);
      if (visual.source) validateLink(label(visual, 'source', language), project);
    }
  }
  for (const id of [anchor, project.slug]) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), `Invalid project id: ${id}`);
  }
  assert(!anchors.has(anchor), `Duplicate project anchor: ${anchor}`);
  anchors.add(anchor);
  assert(['public', 'anonymized'].includes(project.visibility), `Invalid public visibility: ${project.slug}`);
  assert(!project.kind || project.kind === 'technical-note', `Unknown project kind: ${project.slug}`);
  assert(Object.hasOwn(origins, project.origin) && Object.hasOwn(stages, project.stage), `Unknown classification: ${project.slug}`);
  assert(inquiryOptions.has(project.inquiry), `Unknown inquiry option: ${project.slug}`);
  assert(project.domain.length && project.domain.every(domain => Object.hasOwn(domains, domain)), `Unknown domain: ${project.slug}`);
  assert(project.tech.length && project.tech.every(tech => Object.hasOwn(technologies, tech)), `Unknown technology: ${project.slug}`);
  assert(/^(cases|caps|labs)\/[a-z0-9-]+$/.test(project.media), `Invalid media path: ${project.slug}`);
  for (const suffix of ['', '-768', '-3072', '-dark', '-768-dark', '-3072-dark']) {
    await access(resolve(root, `assets/${project.media}${suffix}.webp`));
  }
  for (const language of languages) {
    const localized = project[language];
    for (const key of ['title', 'summary', 'problem', 'challenge', 'implementation', 'result', 'validation', 'disclosure', 'mediaAlt', 'service']) {
      requireText(localized?.[key], `${project.slug}.${language}.${key}`);
    }
    for (const key of ['approach', 'deliverables']) {
      assert(Array.isArray(localized[key]) && localized[key].length, `Missing ${project.slug}.${language}.${key}`);
      for (const text of localized[key]) requireText(text, `${project.slug}.${language}.${key}`);
    }
  }
  for (const related of project.related ?? []) {
    assert(related !== project.slug && slugs.has(related), `Unknown related project: ${related}`);
  }
  for (const reference of project.references ?? []) {
    validateLink(reference.href, project);
    for (const language of languages) requireText(reference[language], `${project.slug} reference`);
  }
  const diagram = caseDiagrams[project.slug];
  assert(diagram && Array.isArray(diagram.stages), `Missing case diagram: ${project.slug}`);
  assert(diagram.stages.length === project.zh.approach.length && diagram.stages.length === project.en.approach.length,
    `Diagram stages must match the case workflow: ${project.slug}`);
  for (const language of languages) {
    requireText(diagram[language]?.title, `${project.slug} diagram title`);
    requireText(diagram[language]?.note, `${project.slug} diagram note`);
    for (const stage of diagram.stages) {
      assert(Object.hasOwn(caseDiagramIcons, stage.icon), `Unknown icon in ${project.slug}: ${stage.icon}`);
      requireText(stage[language], `${project.slug} diagram stage`);
    }
  }
  for (const source of diagram.sources ?? []) {
    validateLink(source.href, project);
    for (const language of languages) requireText(source[language], `${project.slug} diagram source`);
  }
  for (const item of project.evidence ?? []) {
    assert(['model-output', 'simulation', 'recorded-replay', 'public-repository', 'publication'].includes(item.type),
      `Unknown public evidence type: ${project.slug}`);
    validateLink(item.href, project);
    if (item.image) {
      assert(/^\/assets\/evidence\/[a-z0-9/-]+\.webp$/.test(item.image.path)
        && [item.image.width, item.image.height].every(value => Number.isInteger(value) && value > 0),
        `Invalid evidence image: ${project.slug}`);
      await access(resolve(root, item.image.path.slice(1)));
    }
    for (const language of languages) {
      requireText(item[language]?.title, `${project.slug} evidence title`);
      requireText(item[language]?.description, `${project.slug} evidence description`);
      if (item.image) requireText(item[language]?.alt, `${project.slug} evidence image description`);
    }
  }
  for (const metric of project.metrics ?? []) {
    assert(Object.hasOwn(metricTypes, metric.type), `Unknown metric type: ${project.slug}`);
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metric.evidenceId) && !evidenceIds.has(metric.evidenceId), `Invalid or duplicated evidence ID: ${metric.evidenceId}`);
    evidenceIds.add(metric.evidenceId);
    requireText(metric.value, `${project.slug} metric value`);
    requireText(metric.unit, `${project.slug} metric unit`);
    for (const language of languages) {
      for (const field of ['name', 'method', 'scope']) requireText(metric[language]?.[field], `${project.slug} metric ${field}`);
    }
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function label(labels, id, language) {
  return labels[id][language === 'zh' ? 0 : 1];
}

function projectType(project, language) {
  if (project.kind !== 'technical-note') return language === 'zh' ? '精選案例' : 'Selected Work';
  return language === 'zh' ? '技術專題' : 'Technical Note';
}

function classification(project, language) {
  return `${label(origins, project.origin, language)} · ${label(stages, project.stage, language)}`;
}

const detailPath = (project, language = 'zh') => studioPath(`/work/${project.slug}/`, language);
const contactPath = (project, language) => `${studioPath('/contact/', language)}?service=${project.inquiry}`;
const plannerPath = (project, language = 'zh') => `/project-planner/?service=${project.inquiry}${language === 'en' ? '&amp;lang=en' : ''}`;
const demoPath = (path, language) => {
  if (language !== 'en') return path;
  const url = new URL(path, site);
  if (url.origin !== site) return path;
  url.searchParams.set('lang', 'en');
  return url.pathname + url.search + url.hash;
};
const caseImageSizes = '(max-width: 400px) calc(100vw - 40px), (max-width: 760px) 90vw, (max-width: 1180px) 45vw, 530px';

function projectImage(project, { online = false, priority = false, language = 'zh' } = {}) {
  const path = `${online ? '/' : ''}assets/${project.media}`;
  const loading = priority ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<figure class="cfig${online ? ' topic-figure' : ''}"><img src="${path}.webp" srcset="${path}-768.webp 768w, ${path}.webp 1536w, ${path}-3072.webp 3072w" sizes="${caseImageSizes}" alt="${escapeHtml(project[language].mediaAlt)}" width="1536" height="1024"${loading}></figure>`;
}

function evidenceStatus(project, language) {
  return caseEvidence[project.slug].types.map(type => label(evidenceTypes, type, language)).join(' · ');
}

function featuredCard(project, language = 'zh') {
  const en = language === 'en';
  const proof = featuredEvidence[project.slug];
  assert(proof, `Missing featured evidence for ${project.slug}`);
  const t = key => escapeHtml(label(proof, key, language));
  const example = project.evidence?.find(item => item.type === 'model-output' && item.image);
  const visual = proof.visual;
  const file = visual ? (visual.files[Number(en)] ?? visual.files[0]) : example?.image;
  assert(file, `Missing public image for featured case ${project.slug}`);
  const alt = escapeHtml(visual ? label(visual, 'alt', language) : example[language].alt);
  const caption = escapeHtml(visual ? label(visual, 'caption', language) : en ? 'Recorded MI-GAN CPU output.' : 'MI-GAN CPU 修補實際輸出。');
  const imageSource = visual?.source ? ` <a href="${escapeHtml(label(visual, 'source', language))}">${en ? 'Image source' : '圖片來源'}</a>` : '';
  return `      <article class="home-case topic-panel">
        <p class="eyebrow">${escapeHtml(label(domains, project.domain[0], language))}</p>
        <h3><a href="${detailPath(project, language)}">${t('title')}</a></h3>
        <p>${t('problem')}</p>
        <p class="home-case-output">${t('output')}</p>
        <figure class="home-case-image">
          <a class="home-case-zoom" href="${escapeHtml(file.path)}" aria-label="${en ? 'Open full-size image' : '開啟完整圖片'} · ${t('title')}"><img src="${escapeHtml(file.path)}" width="${file.width}" height="${file.height}" alt="${alt}" loading="lazy" decoding="async"></a>
          <figcaption>${caption}${imageSource}</figcaption>
        </figure>
        <p class="home-case-proof">${t('evidence')}</p>
        <a class="text-link" href="${t('source')}">${t('sourceLabel')}</a>
      </article>`.replace(/[ \t]+$/gm, '');
}

function caseCard(project) {
  const anchor = project.anchor ?? project.slug;
  const techNames = project.tech.map(tech => label(technologies, tech, 'zh')).join(' · ');
  return `      <article class="case reveal" id="${anchor}" data-tags="${project.domain.join(' ')}" data-tech="${project.tech.join(' ')}" data-origin="${project.origin}" data-stage="${project.stage}" data-visibility="${project.visibility}" data-case-kind="${project.kind ?? 'case'}" data-featured="${featured.has(project.slug)}">
        ${projectImage(project)}
        <div class="cbody">
          <div class="ctag">${projectType(project, 'zh')} · ${escapeHtml(label(domains, project.domain[0], 'zh'))}</div>
          <h3>${escapeHtml(project.zh.title)}</h3>
          <p class="en" lang="en">${escapeHtml(project.en.title)}</p>
          <p class="entry-meta">${escapeHtml(classification(project, 'zh'))}</p>
          <p class="cprob">${escapeHtml(project.zh.problem)}</p>
          <ul class="chk">
            ${project.zh.approach.map(step => `<li>${escapeHtml(step)}</li>`).join('\n            ')}
          </ul>
          <div class="cres"><p class="rdesc">${escapeHtml(project.zh.result)}</p></div>
          <p class="entry-meta">${escapeHtml(techNames)}</p>
          <div class="entry-links">
            <a class="text-link" href="${detailPath(project)}">查看技術細節</a>
            <a class="text-link" href="#contact" data-inquiry="${project.inquiry}">${escapeHtml(project.zh.service)}</a>
          </div>
        </div>
      </article>`;
}

function publicLinks(project, language) {
  const refs = (project.references ?? []).map(reference => ({ href: demoPath(reference.href, language), name: reference[language] }));
  const related = (project.related ?? []).map(slug => ({
    href: detailPath(slugs.get(slug), language), name: slugs.get(slug)[language].title,
  }));
  return { refs, related };
}

function linkList(links) {
  return `<ul class="topic-links">${links.map(({ href, name }) =>
    `<li><a class="text-link" href="${escapeHtml(href)}">${escapeHtml(name)}</a></li>`).join('')}</ul>`;
}

const sectionLabels = {
  zh: {
    problem: '產業問題與工程挑戰', approach: '技術方法與架構', diagram: '技術圖解', diagramSources: '圖解來源',
    implementation: '實作與交付', result: '成果', validation: '驗證與證據',
    disclosure: '公開範圍及專案狀態', refs: '公開來源與展示', related: '相關工程與服務',
    ownership: '歸屬與階段', benchmark: '量測範圍', solution: '相關解決方案', demo: '操作合成情境展示', evidenceType: '公開證據分類',
  },
  en: {
    problem: 'Industry problem and engineering challenge', approach: 'Technical approach and architecture',
    diagram: 'Technical diagram', diagramSources: 'Diagram sources',
    implementation: 'Implementation and deliverables', result: 'Outcome', validation: 'Validation and evidence',
    disclosure: 'Project status and disclosure', refs: 'Public sources and demonstrations', related: 'Related work and services',
    ownership: 'Ownership and status', benchmark: 'Measurement scope', solution: 'Related solution', demo: 'Open the synthetic scenario', evidenceType: 'Public evidence classification',
  },
};

const diagramAnchor = language => language === 'en' ? 'technical-diagram-en' : 'technical-diagram';

function renderCaseDiagram(project, language) {
  const diagram = caseDiagrams[project.slug];
  const copy = diagram[language];
  const captionId = diagramAnchor(language) + '-caption';
  const stages = diagram.stages.map((stage, index) => `
            <li>
              <svg class="case-diagram-icon" viewBox="0 0 96 64" width="96" height="64" aria-hidden="true" focusable="false">${caseDiagramIcons[stage.icon]}</svg>
              <div>
                <strong>${escapeHtml(stage[language])}</strong>
                <p>${escapeHtml(project[language].approach[index])}</p>
              </div>
            </li>`).join('');
  const sources = (diagram.sources ?? []).map(source => ({
    href: demoPath(source.href, language), name: source[language],
  }));
  return `<figure class="case-diagram" id="${diagramAnchor(language)}" aria-labelledby="${captionId}">
          <figcaption id="${captionId}">${escapeHtml(copy.title)}</figcaption>
          <ol class="case-diagram-stages" role="list">${stages}
          </ol>
          <p class="case-diagram-note">${escapeHtml(copy.note)}</p>
          ${sources.length ? `<nav class="case-diagram-sources" aria-label="${sectionLabels[language].diagramSources}">${linkList(sources)}</nav>` : ''}
        </figure>`;
}

const evidenceLabels = {
  'model-output': ['模型實際輸出', 'Measured model output'],
  simulation: ['軟體模擬', 'Software simulation'],
  'recorded-replay': ['受控實跑回放', 'Controlled recorded run'],
  'public-repository': ['公開程式與資料', 'Public code and data'],
  publication: ['公開論文', 'Published research'],
};

function evidenceGallery(project, language) {
  if (!project.evidence?.length) return '';
  const index = language === 'en' ? 1 : 0;
  const items = project.evidence.map(item => {
    const copy = item[language];
    const image = item.image
      ? `<img src="${item.image.path}" width="${item.image.width}" height="${item.image.height}" loading="lazy" decoding="async" alt="${escapeHtml(copy.alt)}">`
      : '';
    return `<article class="public-evidence-card topic-panel">
      ${image}
      <div>
        <p class="eyebrow">${evidenceLabels[item.type][index]}</p>
        <h3>${escapeHtml(copy.title)}</h3>
        <p>${escapeHtml(copy.description)}</p>
        <a class="text-link" href="${escapeHtml(demoPath(item.href, language))}">${index ? 'Open evidence and method' : '查看證據與方法'}</a>
      </div>
    </article>`;
  });
  return `<div class="public-evidence-gallery">${items.join('')}</div>`;
}

function detailSections(project, language) {
  const t = sectionLabels[language];
  const copy = project[language];
  const { refs, related } = publicLinks(project, language);
  const { solution, demo } = caseEvidence[project.slug];
  const proof = featuredEvidence[project.slug];
  const evidenceAnchor = proof ? ` id="case-evidence${language === 'en' ? '-en' : ''}"` : '';
  if (demo) refs.unshift({ href: studioPath(`/labs/demos/${demo}/`, language), name: t.demo });
  related.unshift({ href: studioPath(`/solutions/${solution}/`, language), name: t.solution });
  const deliverables = copy.deliverables.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const metrics = (project.metrics ?? []).map(metric => `
        <div id="${metric.evidenceId}${language === 'en' ? '-en' : ''}">
          <dt>${escapeHtml(metric[language].name)} · ${label(metricTypes, metric.type, language)}</dt>
          <dd><strong>${escapeHtml(metric.value)} ${escapeHtml(metric.unit)}</strong> · ${escapeHtml(metric[language].method)} ${escapeHtml(metric[language].scope)}</dd>
        </div>`).join('');
  return `
    <section class="topic-section axis-divider">
      <div class="wrap">
        <h2>${t.problem}</h2>
        <p class="topic-lead">${escapeHtml(copy.problem)} ${escapeHtml(copy.challenge)}</p>
      </div>
    </section>
    <section class="topic-section axis-divider">
      <div class="wrap">
        <h2>${t.approach}</h2>
        ${renderCaseDiagram(project, language)}
      </div>
    </section>
    <section class="topic-section axis-divider">
      <div class="wrap topic-detail-grid">
        <div>
          <h2>${t.implementation}</h2>
          <p class="topic-lead">${escapeHtml(copy.implementation)}</p>
        </div>
        <div class="topic-panel">
          <h3>${t.result}</h3>
          <p>${escapeHtml(copy.result)}</p>
          <ul class="chk">${deliverables}</ul>
        </div>
      </div>
    </section>
    <section class="topic-section axis-divider"${evidenceAnchor}>
      <div class="wrap">
        <h2>${t.validation}</h2>
        <p class="topic-lead">${escapeHtml(copy.validation)}</p>${proof ? `\n        <p class="topic-lead">${escapeHtml(label(proof, 'evidence', language))}</p>` : ''}
        <p class="entry-meta">${t.evidenceType} · ${escapeHtml(evidenceStatus(project, language))}</p>
        ${evidenceGallery(project, language)}
        ${metrics ? `<dl class="topic-benchmark">${metrics}</dl>` : ''}
        ${refs.length ? `<nav class="entry-links" aria-label="${t.refs}">${linkList(refs)}</nav>` : ''}
      </div>
    </section>
    <section class="topic-section axis-divider">
      <div class="wrap topic-detail-grid">
        <div>
          <h2>${t.disclosure}</h2>
          <dl class="topic-benchmark"><div><dt>${t.ownership}</dt><dd>${escapeHtml(classification(project, language))}</dd></div></dl>
          <p class="topic-lead">${escapeHtml(copy.disclosure)}</p>
        </div>
        <div class="topic-panel">
          <h3>${t.related}</h3>
          ${linkList([...related, { href: contactPath(project, language), name: copy.service }])}
        </div>
      </div>
    </section>`;
}

function detailPage(project, language) {
  const en = language === 'en';
  const copy = project[language];
  const route = detailPath(project);
  const demo = project.references?.find(reference => reference.href.startsWith('/labs/evidence/'))
    ?? project.references?.find(reference => reference.href.startsWith('/labs/interactive/#'));
  const demoSlug = caseEvidence[project.slug].demo;
  const evidenceAction = demoSlug
    ? `<a class="btn btn-ghost" href="${studioPath(`/labs/demos/${demoSlug}/`, language)}">${sectionLabels[language].demo}</a>`
    : demo ? `<a class="btn btn-ghost" href="${escapeHtml(demoPath(demo.href, language))}">${escapeHtml(demo[language])}</a>` : '';
  const translated = en ? '' : `
    <section id="english" aria-labelledby="english-title" lang="en">
      <div class="wrap topic-hero">
        <p class="eyebrow">${projectType(project, 'en')}</p>
        <h2 id="english-title">${escapeHtml(project.en.title)}</h2>
        <p class="topic-audience">${escapeHtml(classification(project, 'en'))}</p>
        <p class="topic-intro">${escapeHtml(project.en.summary)}</p>
        <div class="entry-links">
          <a class="text-link" href="${detailPath(project, 'en')}">Open full English page</a>
          <a class="text-link" href="#project-title" lang="zh-Hant">繁體中文</a>
          <a class="text-link" href="${plannerPath(project, 'en')}" data-analytics="service_cta_clicked" data-project="${project.slug}" data-service="${project.inquiry}">Plan a project</a>
          ${demo ? `<a class="text-link" href="${escapeHtml(demoPath(demo.href, 'en'))}">${escapeHtml(demo.en)}</a>` : ''}
          <a class="text-link" href="#${diagramAnchor('en')}">${sectionLabels.en.diagram}</a>
        </div>
      </div>${detailSections(project, 'en')}
    </section>`;
  const content = `<section class="topic-hero" aria-labelledby="project-title">
      <div class="wrap topic-hero-grid">
        <div>
          <p class="eyebrow">${projectType(project, language)}</p>
          <h1 id="project-title">${escapeHtml(copy.title)}</h1>
          ${en ? '' : `<p class="en" lang="en">${escapeHtml(project.en.title)}</p>`}
          <p class="topic-audience">${escapeHtml(classification(project, language))} · ${escapeHtml(evidenceStatus(project, language))}</p>
          <p class="topic-intro">${escapeHtml(copy.summary)}</p>
          <div class="entry-links">
            <a class="btn btn-primary" href="${contactPath(project, language)}" data-analytics="service_cta_clicked" data-project="${project.slug}" data-service="${project.inquiry}">${en ? 'Discuss a similar project' : '討論類似專案'}</a>
            ${evidenceAction}
            <a class="text-link" href="#${diagramAnchor(language)}">${sectionLabels[language].diagram}</a>
          </div>
        </div>
        ${projectImage(project, { online: true, priority: true, language })}
      </div>
    </section>${detailSections(project, language)}${translated}`;
  return renderStudioPage({
    route, locale: language, title: copy.title, description: copy.metaDescription ?? copy.summary, content,
    breadcrumbs: [
      { href: studioPath('/', language), label: en ? 'Home' : '首頁' },
      { href: studioPath('/work/', language), label: en ? 'Work' : '案例' },
    ],
    structuredData: { '@type': 'Article', headline: copy.title, inLanguage: en ? 'en' : 'zh-Hant', description: copy.summary, mainEntityOfPage: site + detailPath(project, language), publisher: { '@id': `${site}/#organization` } },
    styles: ['/assets/case-diagram.css'],
    bodyAttributes: `data-project="${project.slug}"`,
  }).replace('<!-- Generated by the Quantquer vNext page builders. -->','<!-- Generated by scripts/build-portfolio.mjs from data/projects.json. -->');
}

function generatedBlock(html, name, content) {
  const start = `<!-- GENERATED:${name}:START -->`;
  const end = `<!-- GENERATED:${name}:END -->`;
  assert(html.split(start).length === 2 && html.split(end).length === 2, `Expected exactly one ${name} block`);
  const startIndex = html.indexOf(start) + start.length;
  const endIndex = html.indexOf(end);
  assert(startIndex < endIndex, `Unexpected ${name} marker order`);
  return `${html.slice(0, startIndex)}\n${content}\n      ${html.slice(endIndex)}`;
}

async function writeOutput(path, incoming, baseline) {
  let existing;
  try {
    existing = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (incoming === existing) return;
  assert(!checking, `Outdated generated content: ${path}`);
  assert(baseline === undefined || existing === baseline, `Source changed during generation: ${path}`);
  const temporary = `${path}.generating.${process.pid}`;
  try {
    await writeFile(temporary, incoming, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

const workDirectory = resolve(root, 'work');
const existingRoutes = await readdir(workDirectory, { withFileTypes: true }).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
for (const entry of existingRoutes) {
  if (!entry.isDirectory() || slugs.has(entry.name)) continue;
  const path = resolve(workDirectory, entry.name, 'index.html');
  const html = await readFile(path, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  assert(!html.includes('Generated by scripts/build-portfolio.mjs from data/projects.json.'), `Retired case remains public at /work/${entry.name}/. Remove its generated HTML before publishing.`);
}

for (const project of portfolio.projects) {
  for (const language of languages) {
    const directory = resolve(root, detailPath(project, language).slice(1));
    if (!checking) await mkdir(directory, { recursive: true });
    await writeOutput(resolve(directory, 'index.html'), detailPage(project, language));
  }
}

for (const language of languages) {
  const en = language === 'en';
  const allTitle = en ? 'Engineering cases and technical notes' : '工程案例與技術專題';
  const description = en ? 'Browse engineering outcomes, evidence, limitations and technical diagrams across AI, robotics and compute.' : '查看工程交付、公開證據、適用限制及 AI、機器人、運算等領域的技術圖解。';
  const t = (zh, english) => en ? english : zh;
  const industry = Object.keys(domains).map((id) => `<button type="button" data-filter="${id}" aria-pressed="false">${label(domains, id, language)}</button>`).join('');
  const filters = `<div class="portfolio-filter" data-work-filter aria-controls="case-list" hidden>
      <p id="work-filter-help" class="filter-help">${t('領域可複選，案例必須同時符合所有已選條件。可用網址分享搜尋與篩選結果。', 'Select multiple domains. Cases must match every selected criterion. Share the URL to keep your search and filters.')}</p>
      <form class="work-controls" aria-label="${t('搜尋與篩選案例', 'Search and filter cases')}" aria-describedby="work-filter-help">
        <label class="work-search">${t('搜尋案例', 'Search cases')} <input name="q" type="search" maxlength="100"></label>
        <label>${t('技術', 'Technology')} <select name="technology"><option value="">${t('全部技術', 'All technologies')}</option></select></label>
        <label>${t('階段', 'Status')} <select name="status"><option value="">${t('全部階段', 'All statuses')}</option></select></label>
        <label>${t('類型', 'Type')} <select name="type"><option value="">${t('全部類型', 'All types')}</option></select></label>
        <label class="featured-only"><input name="featured" type="checkbox"> ${t('只看代表案例', 'Featured cases only')}</label>
      </form>
      <div class="filter-options" role="group" aria-label="${t('依領域篩選', 'Filter by domain')}" aria-describedby="work-filter-help"><button type="button" data-filter="" aria-pressed="true">${t('所有領域', 'All domains')}</button>${industry}</div>
      <div class="work-filter-results">
        <p class="filter-count" role="status"></p>
        <button type="button" class="text-link" data-reset-work>${t('清除篩選', 'Clear filters')}</button>
      </div>
      <p class="filter-empty" hidden>${t('沒有同時符合所有條件的案例。', 'No cases match all selected criteria.')}</p>
    </div>`;
  const list = portfolio.projects.map(project => `<article class="topic-panel" data-tags="${project.domain.join(' ')}" data-tech="${project.tech.join(' ')}" data-origin="${project.origin}" data-stage="${project.stage}" data-case-kind="${project.kind ?? 'case'}" data-featured="${featured.has(project.slug)}"><p class="eyebrow">${escapeHtml(evidenceStatus(project, language))}</p><h2><a class="text-link" href="${detailPath(project, language)}">${escapeHtml(project[language].title)}</a></h2><p>${escapeHtml(project[language].summary)}</p></article>`).join('');
  const directory = resolve(root, studioPath('/work/', language).slice(1));
  if (!checking) await mkdir(directory, { recursive: true });
  await writeOutput(resolve(directory, 'index.html'), renderStudioPage({
    route: '/work/', locale: language, title: allTitle, description,
    breadcrumbs: [{ href: studioPath('/', language), label: en ? 'Home' : '首頁' }], structuredData: { '@type': 'CollectionPage' },
    extraHead: '<script defer src="/assets/portfolio.js"></script>',
    content: `<section class="topic-hero"><div class="wrap"><h1>${allTitle}</h1><p class="topic-intro">${description}</p></div></section>
    <section class="topic-section axis-divider" id="work"><div class="wrap">
      <div class="entry-links"><a class="text-link" href="${studioPath('/labs/evidence/', language)}">${en ? 'Evidence center' : '工程證據中心'}</a></div>
      ${filters}
      <div class="topic-detail-grid work-index-grid" id="case-list">${list}</div>
    </div></section>`,
  }));
}
const indexFile = resolve(root, 'index.html');
const home = await readFile(indexFile, 'utf8');
const sections = generatedBlock(
  generatedBlock(home, 'featured', portfolio.featured.map(slug => featuredCard(slugs.get(slug))).join('\n')),
  'cases',
  portfolio.projects.map(caseCard).join('\n\n'),
);
await writeOutput(indexFile, sections, home);
const englishFile = resolve(root, 'en/index.html');
const englishHome = await readFile(englishFile, 'utf8');
const englishSection = generatedBlock(englishHome, 'featured', portfolio.featured.map(slug => featuredCard(slugs.get(slug), 'en')).join('\n'));
await writeOutput(englishFile, englishSection, englishHome);
console.log(`${checking ? 'Verified' : 'Generated'} ${portfolio.projects.length} case studies in two languages, case indexes and homepage cards.`);
