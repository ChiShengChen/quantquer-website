import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const origin = 'https://quantquer.com';
export const studioPath = (route, locale) => `${locale === 'en' ? '/en' : ''}${route}`;
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

const navigation = [
  ['/solutions/', '解決方案', 'Solutions'], ['/services/', '服務', 'Services'],
  ['/work/', '案例', 'Work'], ['/labs/', 'Labs', 'Labs'],
  ['/research/', '研究', 'Research'], ['/company/', '公司', 'Company'],
];
const themeIcon = '<svg class="ti ti-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.3 8.3 0 1 0 10.8 10.8Z"/></svg><svg class="ti ti-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M5.35 18.65l1.55-1.55M17.1 6.9l1.55-1.55"/></svg>';

export function studioHeader(locale, route) {
  const en = locale === 'en';
  const local = path => studioPath(path, locale);
  const contact = en ? 'Contact' : '聯絡';
  const language = en ? '繁體中文' : 'English';
  const links = navigation.map(([path, zh, english]) => `<a href="${local(path)}"${route === path ? ' aria-current="page"' : ''}>${en ? english : zh}</a>`).join('\n      ');
  return `<header class="studio-header">
  <div class="wrap nav studio-header-inner">
    <a class="brand" href="${local('/')}" aria-label="${en ? 'Quantquer home' : '量維資科首頁'}"><img class="logo-mark" src="/assets/logo-mark.png" alt="" width="34" height="34"><span class="brand-txt"><span class="mark">${en ? 'Quantquer' : '量維資科'}</span>${en ? '' : '<span class="lat">Quantquer</span>'}</span></a>
    <nav class="navlinks studio-desktop-nav" aria-label="${en ? 'Main navigation' : '主要導覽'}">
      ${links}
    </nav>
    <div class="navlinks studio-header-controls">
      <a class="studio-header-language" href="${studioPath(route, en ? 'zh' : 'en')}" lang="${en ? 'zh-Hant' : 'en'}">${language}</a>
      <button id="themeToggle" class="theme-toggle" type="button" aria-label="${en ? 'Switch theme' : '切換明暗主題'}">${themeIcon}</button>
      <a class="nav-cta studio-contact-link" data-analytics="contact_cta_clicked" href="${local('/contact/')}"${route === '/contact/' ? ' aria-current="page"' : ''}>${contact}</a>
      <details class="studio-mobile-nav">
        <summary class="burger" aria-label="${en ? 'Menu' : '選單'}"><span></span><span></span><span></span></summary>
        <nav aria-label="${en ? 'Mobile navigation' : '行動版導覽'}">${links}
          <a href="${local('/contact/')}" data-analytics="contact_cta_clicked">${contact}</a>
          <a href="${studioPath(route, en ? 'zh' : 'en')}" lang="${en ? 'zh-Hant' : 'en'}">${language}</a>
        </nav>
      </details>
    </div>
  </div>
</header>`;
}

export function studioFooter(locale) {
  const en = locale === 'en';
  const local = path => studioPath(path, locale);
  return `<footer><div class="wrap foot studio-footer">
    <a href="${local('/')}"><img class="foot-logo on-light" src="/assets/logo-full-onlight.png" alt="Quantquer" loading="lazy" width="160" height="47"><img class="foot-logo on-dark" src="/assets/logo-full-light.png" alt="Quantquer" loading="lazy" width="160" height="47"></a>
    <nav aria-label="${en ? 'Footer links' : '頁尾連結'}">
      <a href="${local('/company/')}">${en ? 'Company' : '關於量維'}</a>
      <a href="${local('/capabilities/')}">${en ? 'Capabilities' : '能力簡介'}</a>
      <a href="${local('/labs/evidence/')}">${en ? 'Evidence' : '工程證據'}</a>
      <a href="${local('/contact/')}">${en ? 'Contact' : '聯絡'}</a>
    </nav>
    <small>© Quantquer Inc.</small>
  </div></footer>`;
}

export function renderStudioPage({ route, locale, title, description, content, breadcrumbs = [], structuredData, styles = [], scripts = [], bodyAttributes = '', extraHead = '' }) {
  if (!/^\/(?:[a-z0-9-]+\/)*$/.test(route) || !['zh', 'en'].includes(locale)) throw new Error(`Invalid studio route ${route} (${locale})`);
  const en = locale === 'en';
  const lang = en ? 'en' : 'zh-Hant';
  const path = studioPath(route, locale);
  const canonical = origin + path;
  const image = `${origin}/assets/og-image-vnext.png`;
  const shareAlt = en ? 'Quantquer engineering from silicon through models and agents to systems' : '量維資科，串聯晶片、模型、代理與智慧系統';
  const name = `${title} | ${en ? 'Quantquer' : '量維資科 Quantquer'}`;
  const trail = [...breadcrumbs, { href: path, label: title }];
  const schema = [
    { '@type': ['ContactPage', 'AboutPage', 'CollectionPage'].includes(structuredData?.['@type']) ? structuredData['@type'] : 'WebPage', '@id': `${canonical}#page`, name, description, url: canonical, inLanguage: lang, isPartOf: { '@id': `${origin}/#website` }, publisher: { '@id': `${origin}/#organization` } },
    { '@type': 'BreadcrumbList', itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: new URL(item.href, origin).href })) },
    ...(structuredData ? [structuredData].flat().filter(item => !['ContactPage', 'AboutPage', 'CollectionPage'].includes(item['@type'])) : []),
  ];
  const crumbs = breadcrumbs.length ? `<nav class="wrap studio-breadcrumbs" aria-label="${en ? 'Breadcrumb' : '麵包屑導覽'}"><ol>${breadcrumbs.map(item => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join('')}<li aria-current="page">${escapeHtml(title)}</li></ol></nav>` : '';
  return `<!doctype html>
<!-- Generated by the Quantquer vNext page builders. -->
<html lang="${lang}" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="/assets/theme.js"></script>
  <title>${escapeHtml(name)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#F6F8FB">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="zh-Hant" href="${origin}${route}">
  <link rel="alternate" hreflang="en" href="${origin}${studioPath(route, 'en')}">
  <link rel="alternate" hreflang="x-default" href="${origin}${route}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192.png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Quantquer">
  <meta property="og:locale" content="${en ? 'en_US' : 'zh_TW'}">
  <meta property="og:locale:alternate" content="${en ? 'zh_TW' : 'en_US'}">
  <meta property="og:title" content="${escapeHtml(name)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${shareAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(name)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${shareAlt}">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': schema }).replaceAll('<', '\\u003c')}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&amp;family=Noto+Sans+TC:wght@300;400;500&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;600;700&amp;family=Noto+Sans+TC:wght@300;400;500&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet"></noscript>
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="stylesheet" href="/assets/studio.css">
  ${styles.map(href => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n  ')}
  <script type="module" src="/assets/studio.mjs"></script>
  <script type="module" src="/assets/analytics.mjs"></script>
  ${scripts.map(src => `<script type="module" src="${escapeHtml(src)}"></script>`).join('\n  ')}
  ${extraHead}
</head>
<body class="topic-page" ${bodyAttributes}>
  <a class="skip-link" href="#content">${en ? 'Skip to content' : '跳到主要內容'}</a>
  ${studioHeader(locale, route)}
  <main id="content" tabindex="-1">
  ${crumbs}
  ${content}
  </main>
  ${studioFooter(locale)}
</body>
</html>
`.replace(/[ \t]+$/gm, '').replaceAll(/\n{3,}/g, '\n\n');
}

export async function writeStudioPage(page, { check = false } = {}) {
  const path = studioPath(page.route, page.locale).slice(1);
  const directory = new URL(`../${path}`, import.meta.url);
  const location = new URL('index.html', directory);
  const output = renderStudioPage(page);
  const existing = await readFile(location, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return '';
  });
  if (output === existing) return;
  if (check) throw new Error(`Outdated generated page: ${fileURLToPath(location)}`);
  await mkdir(directory, { recursive: true });
  await writeFile(location, output);
}
