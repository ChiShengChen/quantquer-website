import { readFile, writeFile, mkdir, access, rename, rm, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = 'https://quantquer.com';
const shareImage = `${site}/assets/og-image-2-1.png`;
const checking = process.argv.slice(2).includes('--check');
const portfolio = JSON.parse(await readFile(resolve(root, 'data/projects.json'), 'utf8'));

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

for (const project of portfolio.projects) {
  const anchor = project.anchor ?? project.slug;
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

const detailPath = project => `/work/${project.slug}/`;
const contactPath = project => `/?inquiry=${project.inquiry}#contact`;
const plannerPath = (project, language = 'zh') => `/project-planner/?service=${project.inquiry}${language === 'en' ? '&amp;lang=en' : ''}`;
const demoPath = (path, language) => {
  if (language !== 'en') return path;
  const url = new URL(path, site);
  if (url.origin !== site) return path;
  url.searchParams.set('lang', 'en');
  return url.pathname + url.search + url.hash;
};
const assetSizes = {
  wide: '(max-width: 400px) calc(100vw - 40px), (max-width: 760px) 90vw, (max-width: 1180px) 45vw, 530px',
  featured: '(max-width: 400px) calc(100vw - 40px), (max-width: 760px) 90vw, (max-width: 1180px) 30vw, 355px',
};

function projectImage(project, naturalSize, { online = false, priority = false } = {}) {
  const path = `${online ? '/' : ''}assets/${project.media}`;
  const loading = priority ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<figure class="cfig${online ? ' topic-figure' : ''}"><img src="${path}.webp" srcset="${path}-768.webp 768w, ${path}.webp 1536w, ${path}-3072.webp 3072w" sizes="${assetSizes[naturalSize]}" alt="${escapeHtml(project.zh.mediaAlt)}" width="1536" height="1024"${loading}></figure>`;
}

function featuredCard(project, isLead) {
  return `      <a class="feat${isLead ? ' flag' : ''}" href="${detailPath(project)}">
        ${projectImage(project, isLead ? 'wide' : 'featured')}
        <div class="fbd">
          <div class="ctag">${projectType(project, 'zh')} · ${escapeHtml(label(domains, project.domain[0], 'zh'))}</div>
          <h3>${escapeHtml(project.zh.title)}</h3>
          <p class="fdeliv">${escapeHtml(project.zh.summary)}</p>
          <div class="cres"><p class="rdesc">${escapeHtml(classification(project, 'zh'))}</p></div>
        </div>
      </a>`;
}

function caseCard(project) {
  const anchor = project.anchor ?? project.slug;
  const techNames = project.tech.map(tech => label(technologies, tech, 'zh')).join(' · ');
  return `      <article class="case reveal" id="${anchor}" data-tags="${project.domain.join(' ')}" data-tech="${project.tech.join(' ')}" data-origin="${project.origin}" data-stage="${project.stage}" data-visibility="${project.visibility}" data-case-kind="${project.kind ?? 'case'}" data-featured="${featured.has(project.slug)}">
        ${projectImage(project, 'wide')}
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
  const refs = (project.references ?? []).map(reference => ({ href: reference.href, name: reference[language] }));
  const related = (project.related ?? []).map(slug => ({
    href: detailPath(slugs.get(slug)), name: slugs.get(slug)[language].title,
  }));
  return { refs, related };
}

function linkList(links) {
  return `<ul class="topic-links">${links.map(({ href, name }) =>
    `<li><a class="text-link" href="${escapeHtml(href)}">${escapeHtml(name)}</a></li>`).join('')}</ul>`;
}

const sectionLabels = {
  zh: {
    problem: '產業問題與工程挑戰', approach: '技術方法與架構', flow: '處理流程',
    implementation: '實作與交付', result: '成果', validation: '驗證與證據',
    disclosure: '公開範圍及專案狀態', refs: '公開來源與展示', related: '相關工程與服務',
    ownership: '歸屬與階段', benchmark: '量測範圍',
  },
  en: {
    problem: 'Industry problem and engineering challenge', approach: 'Technical approach and architecture', flow: 'Workflow',
    implementation: 'Implementation and deliverables', result: 'Outcome', validation: 'Validation and evidence',
    disclosure: 'Project status and disclosure', refs: 'Public sources and demonstrations', related: 'Related work and services',
    ownership: 'Ownership and status', benchmark: 'Measurement scope',
  },
};

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
  const ordered = copy.approach.map(step => `<li><span>${escapeHtml(step)}</span></li>`).join('');
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
        <figure class="topic-flow">
          <figcaption>${t.flow}</figcaption>
          <ol>${ordered}</ol>
        </figure>
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
    <section class="topic-section axis-divider">
      <div class="wrap">
        <h2>${t.validation}</h2>
        <p class="topic-lead">${escapeHtml(copy.validation)}</p>
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
          ${linkList([...related, { href: contactPath(project), name: copy.service }])}
        </div>
      </div>
    </section>`;
}

function detailPage(project) {
  const name = `${project.zh.title}｜量維資科 Quantquer`;
  const title = escapeHtml(name);
  const description = escapeHtml(project.zh.summary);
  // Search snippet: a fuller sentence built from the page's own facts; the visible intro stays `summary`.
  const metaDescription = escapeHtml(project.zh.metaDescription ?? project.zh.summary);
  const url = `${site}${detailPath(project)}`;
  const demo = project.references?.find(reference => reference.href.startsWith('/labs/evidence/'))
    ?? project.references?.find(reference => reference.href.startsWith('/labs/interactive/#'));
  const shareAlt = '量維資科，從晶片到智慧系統。下方是模型部署至晶片的技術示意。';
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebPage', name, url,
    description: project.zh.metaDescription ?? project.zh.summary,
    inLanguage: ['zh-Hant', 'en'],
    isPartOf: { '@id': `${site}/#website` },
    publisher: { '@id': `${site}/#organization` },
  };
  return `<!DOCTYPE html>
<!-- Generated by scripts/build-portfolio.mjs from data/projects.json. -->
<html lang="zh-Hant" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="/assets/theme.js"></script>
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="theme-color" content="#F6F8FB">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="96x96" href="/assets/icons/icon-96.png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="量維資科 Quantquer">
  <meta property="og:locale" content="zh_TW">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${shareImage}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${shareAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDescription}">
  <meta name="twitter:image" content="${shareImage}">
  <meta name="twitter:image:alt" content="${shareAlt}">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2).replaceAll('<', '\\u003c')}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&amp;family=Noto+Sans+TC:wght@300;400;500&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/site.css">
  <script type="module" src="/assets/analytics.mjs"></script>
</head>
<body class="topic-page" data-project="${project.slug}">
  <a href="#content" class="skip-link">跳到主要內容</a>
  <header>
    <div class="wrap nav">
      <a href="/" class="brand">
        <img src="/assets/logo-mark.png" class="logo-mark" alt="量維資科 Quantquer 首頁" width="34" height="34">
        <span class="brand-txt" aria-hidden="true"><span class="mark">量維資科</span><span class="lat">Quantquer</span></span>
      </a>
      <nav class="navlinks" aria-label="網站導覽">
        <a href="/#work" class="topic-home">案例</a>
        <a href="#english" lang="en">English</a>
        <button id="themeToggle" class="theme-toggle" type="button" aria-label="切換深色模式">☾︎</button>
      </nav>
    </div>
  </header>
  <main id="content" tabindex="-1">
    <section class="topic-hero" aria-labelledby="project-title">
      <div class="wrap topic-hero-grid">
        <div>
          <p class="eyebrow">${projectType(project, 'zh')} / ${projectType(project, 'en')}</p>
          <h1 id="project-title">${escapeHtml(project.zh.title)}</h1>
          <p class="en" lang="en">${escapeHtml(project.en.title)}</p>
          <p class="topic-audience">${escapeHtml(classification(project, 'zh'))}</p>
          <p class="topic-intro">${description}</p>
          <div class="entry-links">
            <a class="btn btn-primary" href="${plannerPath(project)}" data-analytics="service_cta_clicked" data-project="${project.slug}" data-service="${project.inquiry}">建立專案需求</a>
            ${demo ? `<a class="btn btn-ghost" href="${escapeHtml(demo.href)}">${escapeHtml(demo.zh)}</a>` : ''}
          </div>
        </div>
        ${projectImage(project, 'wide', { online: true, priority: true })}
      </div>
    </section>${detailSections(project, 'zh')}
    <section id="english" aria-labelledby="english-title" lang="en">
      <div class="wrap topic-hero">
        <p class="eyebrow">${projectType(project, 'en')}</p>
        <h2 id="english-title">${escapeHtml(project.en.title)}</h2>
        <p class="topic-audience">${escapeHtml(classification(project, 'en'))}</p>
        <p class="topic-intro">${escapeHtml(project.en.summary)}</p>
        <div class="entry-links">
          <a class="text-link" href="#project-title" lang="zh-Hant">繁體中文</a>
          <a class="text-link" href="${plannerPath(project, 'en')}" data-analytics="service_cta_clicked" data-project="${project.slug}" data-service="${project.inquiry}">Plan a project</a>
          ${demo ? `<a class="text-link" href="${escapeHtml(demoPath(demo.href, 'en'))}">${escapeHtml(demo.en)}</a>` : ''}
        </div>
      </div>${detailSections(project, 'en')}
    </section>
  </main>
  <footer>
    <div class="wrap foot">
      <a href="/" aria-label="量維資科 Quantquer 首頁">
        <img class="foot-logo on-light" src="/assets/logo-full-onlight.png" alt="" loading="lazy">
        <img class="foot-logo on-dark" src="/assets/logo-full-light.png" alt="" loading="lazy">
      </a>
      <a class="text-link" href="/#work">所有案例及技術專題</a>
    </div>
  </footer>
</body>
</html>
`;
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
  const directory = resolve(workDirectory, project.slug);
  if (!checking) await mkdir(directory, { recursive: true });
  await writeOutput(resolve(directory, 'index.html'), detailPage(project).replace(/[ \t]+$/gm, ''));
}
// <lastmod>: data/projects.json `siteUpdated` (YYYY-MM-DD), or a project's own `updated`. Bump it when content changes.
assert(/^\d{4}-\d{2}-\d{2}$/.test(portfolio.siteUpdated ?? ''), 'data/projects.json needs siteUpdated as YYYY-MM-DD');
const routes = [
  ...[
    '/', '/en/', '/semiconductor-ai/', '/financial-intelligence/', '/labs/interactive/',
    '/project-planner/', '/labs/evidence/vision/', '/labs/evidence/photonics/', '/labs/evidence/gpu/', '/labs/evidence/research/',
  ].map(path => [path, portfolio.siteUpdated]),
  ...portfolio.projects.map(project => [detailPath(project), project.updated ?? portfolio.siteUpdated]),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(([route, lastmod]) => `  <url><loc>${site}${route}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
await writeOutput(resolve(root, 'sitemap.xml'), sitemap);
const indexFile = resolve(root, 'index.html');
const home = await readFile(indexFile, 'utf8');
const sections = generatedBlock(
  generatedBlock(home, 'featured', portfolio.featured.map((slug, index) => featuredCard(slugs.get(slug), index === 0)).join('\n')),
  'cases',
  portfolio.projects.map(caseCard).join('\n\n'),
);
await writeOutput(indexFile, sections, home);
console.log(`${checking ? 'Verified' : 'Generated'} ${portfolio.projects.length} project pages, two homepage sections and sitemap.`);
