import { readFile, writeFile } from 'node:fs/promises';
import { languageLink, navigation, studioPath, themeIcon } from './vnext-layout.mjs';
import { studioBrand } from '../data/studio-brand.mjs';

const check = process.argv.includes('--check');
const content = {
  zh: {
    headline: '從晶片到智慧系統，<br class="hero-copy-break"><span class="hero-verb">解決</span><br class="hero-mobile-break"><span class="hl">高難度 AI 工程問題</span>。',
    intro: '我們為半導體、工業、醫療與科技企業提供客製化 AI 演算法、模型部署、智慧代理系統及高效能運算基礎設施研發。',
    primary: '討論你的專案', secondary: '查看工程成果',
    eyebrow: studioBrand.technicalTagline,
    trust: ['已交付工程', '研究發表', '開源工具'],
    solutions: '四大工程解決方案',
    evidence: '工程證據',
    methods: '查看量測條件、操作展示或下載可重跑的原始資料。',
    evidenceLinks: ['Benchmark', '原始資料與方法'],
    labTitle: 'Quantquer Labs',
    labLinks: ['GPU 排程互動展示', 'Paper Evidence 開源工具', '光子網路數值模型'],
    proof: '查看證據',
    engagements: '開始合作',
    engagementRows: [
      ['AI 架構評估', '典型約 1–2 週', '交付瓶頸分析、風險清單與驗證路線。', 'technical-consulting#architecture-assessment'],
      ['邊緣 AI 可行性研究', '典型約 3–6 週', '交付算子相容性、資源分析及裝置驗證計畫。', 'feasibility-study#edge-feasibility'],
      ['客製研發與交付', '依需求評估', '共同定義原型、驗收、文件與移交範圍。', 'custom-rd'],
      ['兼任技術長與長期合作', '依需求評估', '持續提供技術評估、架構決策與研發支援。', 'fractional-cto'],
    ],
    finder: '依問題找合作方式',
    finderPrompt: '你的團隊現在要解決什麼？',
    finderDefault: '選擇技術問題',
    finderAction: '查看建議的解決方案',
    finderContact: '討論這項需求',
    unspecific: ['我還在評估技術方向', 'AI 架構評估', '交付架構瓶頸、風險與下一步驗證計畫。'],
    terms: 'NDA、IP 與交付方式',
    company: '研究、公司與合作夥伴',
    companyLinks: ['研究成果', '公司與創辦人', '合作夥伴', '能力簡介 PDF'],
    closing: '從工程問題開始',
    rfp: '準備完整專案需求',
  },
  en: {
    headline: 'From Silicon to <span class="hl">Intelligence</span>.',
    eyebrow: 'Research-driven deep-tech engineering',
    intro: 'We turn complex AI, semiconductor, and scientific computing challenges into measurable, deployable engineering solutions.',
    primary: 'Discuss your project', secondary: 'Explore engineering work',
    trust: ['Engineering delivery', 'Publications', 'Open-source tools'],
    solutions: 'Four engineering solutions',
    evidence: 'Engineering evidence',
    methods: 'Read the test methods, run a demo or download the data to reproduce a result.',
    evidenceLinks: ['Benchmarks', 'Data and methods'],
    labTitle: 'Quantquer Labs',
    labLinks: ['GPU scheduling demo', 'Paper Evidence open-source tool', 'Photonic mesh model'],
    proof: 'View evidence',
    engagements: 'Start an engagement',
    engagementRows: [
      ['AI architecture assessment', 'Typically 1–2 weeks', 'Receive a bottleneck analysis, a risk register and a validation roadmap.', 'technical-consulting#architecture-assessment'],
      ['Edge AI feasibility study', 'Typically 3–6 weeks', 'Receive an operator compatibility review, resource analysis and a device test plan.', 'feasibility-study#edge-feasibility'],
      ['Custom engineering and R&D', 'Scoped to the project', 'Agree on the prototype, acceptance criteria, documentation and handoff.', 'custom-rd'],
      ['Fractional CTO and long-term partnership', 'Scoped to the project', 'Ongoing technical reviews, architecture decisions and engineering support.', 'fractional-cto'],
    ],
    finder: 'Find a solution for your project',
    finderPrompt: 'What does your team need to solve?',
    finderDefault: 'Choose a technical problem',
    finderAction: 'View the suggested solution',
    finderContact: 'Discuss this project',
    unspecific: ['I’m still evaluating the technical direction', 'AI architecture assessment', 'Receive a review of architecture bottlenecks, risks and next validation steps.'],
    terms: 'NDA, IP and delivery practices',
    company: 'Research, company and partners',
    companyLinks: ['Publications', 'Company and founder', 'Partners', 'Capabilities PDF'],
    closing: 'Start with the engineering problem',
    rfp: 'Prepare a detailed project brief',
  },
};
const pillars = [
  {
    name: 'Silicon Intelligence', slug: 'semiconductor-edge-ai', service: 'edge-ai',
    evidence: '/labs/evidence/vision/',
    short: ['晶片端與嵌入式 AI', 'On-device and embedded AI'],
    question: ['把模型部署到晶片或邊緣裝置', 'Deploy a model to a chip or edge device'],
    need: ['模型需要在目標晶片運行。', 'Need to deploy on a target chip?'],
    output: ['評估算子與資源，交付裝置驗證計畫。', 'Operator and resource review, with a device validation plan.'],
  },
  {
    name: 'Agentic Intelligence', slug: 'ai-reliability', service: 'agent',
    evidence: '/labs/demos/reliability/',
    short: ['企業 Agent 可靠性', 'Enterprise agents and AI reliability'],
    question: ['建立可靠、可稽核的企業 AI Agent', 'Build reliable, auditable enterprise AI agents'],
    need: ['代理流程需要穩定且可稽核。', 'Need auditable agent workflows?'],
    output: ['設計工具流程，交付評估集與失敗回復規則。', 'Tool workflow design, evaluation data and recovery rules.'],
  },
  {
    name: 'Compute Intelligence', slug: 'gpu-infrastructure', service: 'gpu-infrastructure',
    evidence: '/labs/evidence/gpu/',
    short: ['GPU 運算基礎設施', 'GPU infrastructure'],
    question: ['管理 GPU 任務或降低推論成本', 'Manage GPU workloads or reduce inference costs'],
    need: ['多種工作需要共用 GPU。', 'Need to share GPUs across workloads?'],
    output: ['驗證排程策略，交付 PoC、執行紀錄與容量建議。', 'Scheduling prototype, execution traces and capacity recommendations.'],
  },
  {
    name: 'Scientific Intelligence', slug: 'scientific-ai', service: 'research',
    evidence: '/labs/evidence/photonics/',
    short: ['科學運算與研究工程', 'Scientific computing and research engineering'],
    question: ['驗證科研、模擬或演算法問題', 'Validate a research, simulation or algorithm problem'],
    need: ['研究假設或模擬需要驗證。', 'Need to validate a model or hypothesis?'],
    output: ['建立數值模型與可重跑實驗，交付資料及方法。', 'Numerical models and repeatable experiments with data and methods.'],
  },
];

function waveformNavigation(locale) {
  const en = locale === 'en';
  const local = route => studioPath(route, locale);
  const brand = en ? 'Quantquer' : '量維資科';
  const contact = en ? 'Contact' : '聯絡';
  const openLabel = en ? 'Open menu' : '開啟選單';
  const closeLabel = en ? 'Close menu' : '關閉選單';
  const links = className => navigation.map(([route, zh, english]) =>
    `<a href="${local(route)}"${className ? ` class="${className}"` : ''}>${en ? english : zh}</a>`).join('\n      ');
  return `<header id="hdr">
  <div class="wrap nav">
    <a href="#top" class="brand" aria-label="${en ? 'Quantquer home' : '量維資科 Quantquer 首頁'}">
      <img src="/assets/logo-mark.png" class="logo-mark" alt="" width="34" height="34">
      <span class="brand-txt"><span class="mark">${brand}</span>${en ? '' : '<span class="lat">Quantquer</span>'}</span>
    </a>
    <nav class="navlinks" aria-label="${en ? 'Main navigation' : '主要導覽'}">
      ${links('lk')}
      ${languageLink('/', locale)}
      <button id="themeToggle" class="theme-toggle" type="button" aria-label="${en ? 'Switch theme' : '切換明暗主題'}">${themeIcon}</button>
      <a href="${local('/contact/')}" class="nav-cta home-nav-contact" data-analytics="contact_cta_clicked">${contact}</a>
      <button id="burger" class="burger" type="button" aria-label="${openLabel}" data-open-label="${openLabel}" data-close-label="${closeLabel}" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
    </nav>
  </div>
  <nav class="mnav" id="mnav" aria-label="${en ? 'Mobile navigation' : '行動版導覽'}">
    <div class="wrap">${links('')}
      <a href="${local('/contact/')}" data-analytics="contact_cta_clicked">${contact}</a>
    </div>
  </nav>
</header>`;
}

function homeBlocks(locale) {
  const copy = content[locale];
  const local = path => studioPath(path, locale);
  const en = locale === 'en';
  const waveformHero = `<section class="hero" id="top">
  <canvas id="spectrum" aria-hidden="true"></canvas>
  <div class="wrap">
    <div class="hero-eyebrow">
      <span class="tick"></span>
      <span class="eyebrow" lang="en">${copy.eyebrow}</span>
    </div>
    <h1 class="hero-title">${copy.headline}</h1>
    <p class="hero-sub">
      ${copy.intro}
    </p>
    <div class="cta-row">
      <a href="${local('/contact/')}" class="btn btn-primary" data-analytics="contact_cta_clicked">${copy.primary} <span class="arr" aria-hidden="true">→</span></a>
      <a href="#featured" class="btn btn-ghost">${copy.secondary} <span class="arr" aria-hidden="true">→</span></a>
    </div>
  </div>
  <div class="fig-cap"><span class="dot"></span> fig.01 — power spectral density · live signal trace</div>
</section>`;
  const t = pair => pair[Number(en)];
  const links = (urls, labels) => urls.map((href, index) => `<a class="text-link" href="${href}">${labels[index]}</a>`).join('');
  const section = (id, title, body) => `<section class="studio-home-section axis-divider" id="${id}"><div class="wrap"><h2>${title}</h2>${body}</div></section>`;
  const brand = `<section class="home-brand axis-divider" id="brand" aria-labelledby="brand-slogan">
  <div class="wrap home-brand-inner">
    <div>
      <h2 id="brand-slogan" lang="en">${studioBrand.slogan}</h2>
      <p class="topic-lead">${t(studioBrand.positioning)}</p>
    </div>
    <nav class="entry-links anchor-target" id="engineering-credentials" aria-label="${en ? 'Engineering credentials' : '工程實績與研究'}">${links([local('/work/industrial-robotics/'), local('/research/'), local('/labs/projects/')], copy.trust)}</nav>
  </div>
</section>`;
  const solutionCards = pillars.map(pillar => {
    const proof = pillar.evidence.startsWith('/labs/demos/') ? local(pillar.evidence) : pillar.evidence + (en ? '?lang=en' : '');
    return `<li class="topic-panel">
      <h3><a href="${local(`/solutions/${pillar.slug}/`)}">${t(pillar.short)}</a></h3>
      <p>${t(pillar.need)}${en ? ' ' : ''}${t(pillar.output)}</p>
      <a class="text-link" href="${proof}" aria-label="${copy.proof} · ${t(pillar.short)}">${copy.proof}</a></li>`;
  }).join('');
  const core = section('core-solutions', copy.solutions, `<ul class="home-solution-grid">${solutionCards}</ul>`);
  const labExamples = [
    '/labs/interactive/' + (en ? '?lang=en' : '') + '#gpu-orchestration',
    local('/labs/projects/') + '#project-paper-evidence',
    '/labs/evidence/photonics/' + (en ? '?lang=en' : ''),
  ];
  const evidence = section('engineering-evidence', copy.evidence, `<div class="home-proof-grid"><div><p class="topic-lead">${copy.methods}</p><div class="entry-links">${links(['/labs/benchmarks/', '/labs/evidence/'].map(local), copy.evidenceLinks)}</div></div><div><h3><a href="${local('/labs/')}">${copy.labTitle}</a></h3><div class="entry-links">${links(labExamples, copy.labLinks)}</div></div></div>`);
  const choices = [...pillars.map(pillar => ({
    service: pillar.service, label: t(pillar.question), title: pillar.name, output: t(pillar.output), url: local(`/solutions/${pillar.slug}/`),
  })), { service: 'assessment', label: copy.unspecific[0], title: copy.unspecific[1], output: copy.unspecific[2], url: local('/services/technical-consulting/') }];
  const finder = `<details class="home-finder" data-solution-finder hidden>
    <summary>${copy.finder}</summary>
    <label for="home-solution-choice">${copy.finderPrompt}</label>
    <select id="home-solution-choice"><option value="">${copy.finderDefault}</option>${choices.map(choice => `<option value="${choice.service}">${choice.label}</option>`).join('')}</select>
    <div aria-live="polite">${choices.map(choice => `<div class="home-finder-result" data-solution-result="${choice.service}" hidden>
      <strong>${choice.title}</strong><p>${choice.output}</p>
      <div class="entry-links"><a class="text-link" href="${choice.url}">${copy.finderAction}</a><a class="text-link" href="${local('/contact/')}?service=${choice.service}#rfp" data-analytics="service_cta_clicked" data-service="${choice.service}">${copy.finderContact}</a></div>
    </div>`).join('')}</div>
  </details>`;
  const packages = copy.engagementRows.map(([title, duration, description, destination]) => {
    const [path, anchor] = destination.split('#');
    const url = local(`/services/${path}/`) + (anchor ? `#${anchor}` : '');
    return `<li><a class="text-link" href="${url}">${title}</a><span class="home-duration">${duration}</span><p>${description}</p></li>`;
  }).join('');
  const engagements = section('engagements', copy.engagements, `<div class="home-engagement-grid"><div><ul class="home-rows">${packages}</ul><div class="entry-links">${links([local('/company/') + '#engagement-terms'], [copy.terms])}</div></div>${finder}</div>`);
  const company = section('studio-architecture', copy.company, `<div class="entry-links">${links([local('/research/'), local('/company/'), '/#partners', `/downloads/quantquer-capabilities-${locale}.pdf`], copy.companyLinks)}</div>`);
  const contact = section('project-contact', copy.closing, `<div class="entry-links"><a class="btn btn-primary" data-analytics="contact_cta_clicked" href="${local('/contact/')}">${copy.primary}</a><a class="btn btn-ghost" href="${local('/contact/')}#rfp">${copy.rfp}</a></div>`);
  return {
    navigation: waveformNavigation(locale),
    hero: [waveformHero, brand, core].join('\n'),
    conversion: [evidence, engagements, company, contact].join('\n'),
    resources: `<nav class="home-footer-links" aria-label="${en ? 'More site links' : '網站資源'}">${links(
      [local('/work/'), local('/services/'), local('/research/'), local('/labs/'), local('/contact/')],
      en ? ['Engineering Work', 'Services', 'Publications', 'Labs', 'Contact'] : ['工程案例', '服務', '研究成果', 'Labs', '聯絡'],
    )}</nav>`,
  };
}

for (const locale of ['zh', 'en']) {
  const file = new URL(locale === 'en' ? '../en/index.html' : '../index.html', import.meta.url);
  const input = await readFile(file, 'utf8');
  let html = input;
  for (const [name, body] of Object.entries(homeBlocks(locale))) {
    const open = `<!-- STUDIO:${name}:START -->`;
    const close = `<!-- STUDIO:${name}:END -->`;
    if (html.split(open).length !== 2 || html.split(close).length !== 2 || html.indexOf(close) < html.indexOf(open)) throw new Error(`Missing ${name} markers in ${file.pathname}`);
    html = html.slice(0, html.indexOf(open) + open.length) + '\n' + body + '\n' + html.slice(html.indexOf(close));
  }
  if (html !== input) {
    if (check) throw new Error(`Outdated studio home ${file.pathname}`);
    await writeFile(file, html);
  }
}
