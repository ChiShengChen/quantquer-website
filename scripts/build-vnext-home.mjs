import { readFile, writeFile } from 'node:fs/promises';
import { studioHeader, studioPath } from './vnext-layout.mjs';
import { studioBrand } from '../data/studio-brand.mjs';

const check = process.argv.includes('--check');
const content = {
  zh: {
    headline: '從晶片到智慧系統，<br class="hero-copy-break"><span class="hero-verb">解決</span><br class="hero-mobile-break"><span class="hl">高難度 AI 工程問題</span>。',
    intro: '我們為半導體、工業、醫療與科技企業提供客製化 AI 演算法、模型部署、智慧代理系統及高效能運算基礎設施研發。',
    primary: '討論你的專案', secondary: '查看工程成果',
    trust: ['已交付工程', '研究發表', '開源工具'],
    solutions: '四大工程解決方案',
    firstOffer: '從 AI 架構評估開始（典型約 1–2 週）',
    evidence: 'Quantquer Labs 與工程證據',
    methods: '查看量測條件、操作展示或下載可重跑的原始資料。',
    evidenceLinks: ['Benchmark', '互動展示', '原始資料與方法', '開源工具'],
    engagements: '開始合作',
    engagementRows: [
      ['AI 架構評估', '典型約 1–2 週', '交付瓶頸分析、風險清單與驗證路線。', 'technical-consulting#architecture-assessment'],
      ['邊緣 AI 可行性研究', '典型約 3–6 週', '交付算子相容性、資源分析及裝置驗證計畫。', 'feasibility-study#edge-feasibility'],
      ['客製研發與交付', '依需求評估', '共同定義原型、驗收、文件與移交範圍。', 'custom-rd'],
    ],
    finder: '依問題找合作方式',
    finderPrompt: '你的團隊現在要解決什麼？',
    finderDefault: '選擇技術問題',
    finderAction: '查看建議的解決方案',
    finderContact: '討論這項需求',
    unspecific: ['我還在評估技術方向', 'AI 架構評估', '交付架構瓶頸、風險與下一步驗證計畫。'],
    cto: '兼任技術長與長期合作', terms: 'NDA、IP 與交付方式',
    company: '研究、公司與合作夥伴',
    companyLinks: ['研究成果', '公司與創辦人', '合作夥伴', '能力簡介 PDF'],
    closing: '從工程問題開始',
    closingText: '有目標裝置、現有系統或一個需要驗證的想法，就可以開始討論。',
    email: '直接 Email', rfp: '準備完整專案需求',
  },
  en: {
    headline: 'Engineering Intelligence, from Silicon to Systems.',
    intro: 'Quantquer develops research-driven AI algorithms, embedded intelligence, reliable agent systems, and high-performance computing infrastructure for technically demanding applications.',
    primary: 'Discuss your project', secondary: 'Explore engineering work',
    trust: ['Engineering delivery', 'Publications', 'Open-source tools'],
    solutions: 'Four engineering solutions',
    firstOffer: 'Start with an AI architecture assessment (typically 1–2 weeks)',
    evidence: 'Quantquer Labs and engineering evidence',
    methods: 'Read the test methods, run a demo or download the data to reproduce a result.',
    evidenceLinks: ['Benchmarks', 'Interactive demos', 'Data and methods', 'Open-source tools'],
    engagements: 'Start an engagement',
    engagementRows: [
      ['AI architecture assessment', 'Typically 1–2 weeks', 'Receive a bottleneck analysis, a risk register and a validation roadmap.', 'technical-consulting#architecture-assessment'],
      ['Edge AI feasibility study', 'Typically 3–6 weeks', 'Receive an operator compatibility review, resource analysis and a device test plan.', 'feasibility-study#edge-feasibility'],
      ['Custom engineering and R&D', 'Scoped to the project', 'Agree on the prototype, acceptance criteria, documentation and handoff.', 'custom-rd'],
    ],
    finder: 'Find a solution for your project',
    finderPrompt: 'What does your team need to solve?',
    finderDefault: 'Choose a technical problem',
    finderAction: 'View the suggested solution',
    finderContact: 'Discuss this project',
    unspecific: ['I’m still evaluating the technical direction', 'AI architecture assessment', 'Receive a review of architecture bottlenecks, risks and next validation steps.'],
    cto: 'Fractional CTO and long-term partnership', terms: 'NDA, IP and delivery practices',
    company: 'Research, company and partners',
    companyLinks: ['Publications', 'Company and founder', 'Partners', 'Capabilities PDF'],
    closing: 'Start with the engineering problem',
    closingText: 'A target device, an existing system or an idea to validate is enough to start a discussion.',
    email: 'Email us directly', rfp: 'Prepare a detailed project brief',
  },
};
const pillars = [
  {
    name: 'Silicon Intelligence', slug: 'semiconductor-edge-ai', service: 'edge-ai',
    short: ['晶片端與嵌入式 AI', 'On-device and embedded AI'],
    question: ['把模型部署到晶片或邊緣裝置', 'Deploy a model to a chip or edge device'],
    output: ['算子相容性、資源評估與部署驗證計畫。', 'Operator compatibility, resource estimates and a deployment validation plan.'],
  },
  {
    name: 'Agentic Intelligence', slug: 'ai-reliability', service: 'agent',
    short: ['企業 Agent 可靠性', 'Enterprise agents and AI reliability'],
    question: ['建立可靠、可稽核的企業 AI Agent', 'Build reliable, auditable enterprise AI agents'],
    output: ['可稽核的工具流程、評估集與失敗回復規則。', 'An auditable tool workflow, an evaluation set and rules for recovering from failures.'],
  },
  {
    name: 'Compute Intelligence', slug: 'gpu-infrastructure', service: 'gpu-infrastructure',
    short: ['GPU 運算基礎設施', 'GPU infrastructure'],
    question: ['管理 GPU 任務或降低推論成本', 'Manage GPU workloads or reduce inference costs'],
    output: ['排程 PoC、執行紀錄與容量建議。', 'A scheduling proof of concept, execution traces and capacity recommendations.'],
  },
  {
    name: 'Scientific Intelligence', slug: 'scientific-ai', service: 'research',
    short: ['科學運算與研究工程', 'Scientific computing and research engineering'],
    question: ['驗證科研、模擬或演算法問題', 'Validate a research, simulation or algorithm problem'],
    output: ['可重跑實驗、驗證資料與方法紀錄。', 'Repeatable experiments, validation inputs and documented methods.'],
  },
];

const waveformNavigation = `<header id="hdr">
  <div class="wrap nav">
    <a href="#top" class="brand">
      <img src="assets/logo-mark.png" class="logo-mark" alt="量維資科 Quantquer logo">
      <span class="brand-txt">
        <span class="mark">量維資科</span>
        <span class="lat">Quantquer</span>
      </span>
    </a>
    <nav class="navlinks" aria-label="主要導覽">
      <a href="/solutions/" class="lk">解決方案</a>
      <a href="/services/" class="lk">服務</a>
      <a href="/work/" class="lk">案例</a>
      <a href="/research/" class="lk">研究</a>
      <a href="/labs/" class="lk">Labs</a>
      <a href="/company/" class="lk">公司</a>
      <a href="en/" class="lk" lang="en">English</a>
      <button id="themeToggle" class="theme-toggle" type="button" aria-label="切換亮色／深色模式"><svg class="ti ti-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.3 8.3 0 1 0 10.8 10.8Z"/></svg><svg class="ti ti-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M5.35 18.65l1.55-1.55M17.1 6.9l1.55-1.55"/></svg></button>
      <a href="/contact/" class="nav-cta" data-analytics="contact_cta_clicked">討論你的專案</a>
      <button id="burger" class="burger" type="button" aria-label="開啟選單" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>
    </nav>
  </div>
  <nav class="mnav" id="mnav" aria-label="行動版選單">
    <div class="wrap">
      <a href="/solutions/"><span>01</span>解決方案</a>
      <a href="/services/"><span>02</span>服務與合作模式</a>
      <a href="semiconductor-ai/"><span aria-hidden="true">↗</span>半導體與 Edge AI</a>
      <a href="/work/"><span>03</span>工程案例</a>
      <a href="#method"><span>04</span>工作方式</a>
      <a href="/research/"><span>05</span>研究成果</a>
      <a href="/labs/"><span>06</span>Quantquer Labs</a>
      <a href="labs/interactive/"><span aria-hidden="true">↗</span>互動展示</a>
      <a href="/company/"><span>07</span>關於量維</a>
      <a href="#partners"><span>08</span>夥伴服務</a>
      <a href="/contact/" data-analytics="contact_cta_clicked"><span>09</span>聯絡我們</a>
      <a href="en/" lang="en"><span aria-hidden="true">EN</span>English</a>
    </div>
  </nav>
</header>`;

function homeBlocks(locale) {
  const copy = content[locale];
  const local = path => studioPath(path, locale);
  const en = locale === 'en';
  const englishHero = `<section class="topic-hero" id="top" aria-labelledby="english-home-title"><div class="wrap">
    <div>
      <p class="eyebrow">${studioBrand.technicalTagline}</p>
      <h1 id="english-home-title">${copy.headline}</h1>
      <p class="topic-intro">${copy.intro}</p>
      <div class="cta-row"><a class="btn btn-primary" href="${local('/contact/')}" data-analytics="contact_cta_clicked">${copy.primary}</a><a class="btn btn-ghost" href="#featured">${copy.secondary}</a></div>
    </div>
  </div></section>`;
  const waveformHero = `<section class="hero" id="top">
  <canvas id="spectrum" aria-hidden="true"></canvas>
  <div class="wrap">
    <div class="hero-eyebrow">
      <span class="tick"></span>
      <span class="eyebrow" lang="en">${studioBrand.technicalTagline}</span>
    </div>
    <h1 class="hero-title">${copy.headline}</h1>
    <p class="hero-sub">
      ${copy.intro}
    </p>
    <ul class="pillars" aria-label="三大技術支柱">
      <li><b>Edge AI</b><span>晶片端生成式 AI</span></li>
      <li><b>Agentic AI</b><span>AI Agent 與多代理系統</span></li>
      <li><b>Scientific AI</b><span>科學、臨床與訊號 AI</span></li>
    </ul>
    <div class="cta-row">
      <a href="/contact/" class="btn btn-primary" data-analytics="contact_cta_clicked">${copy.primary} <span class="arr" aria-hidden="true">→</span></a>
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
      <p class="eyebrow" lang="en">Quantquer</p>
      <h2 id="brand-slogan" lang="en">${studioBrand.slogan}</h2>
      <p class="topic-lead" lang="en">${studioBrand.technicalTagline}</p>
      <p class="topic-lead">${t(studioBrand.positioning)}</p>
    </div>
    <nav class="entry-links anchor-target" id="engineering-credentials" aria-label="${en ? 'Engineering credentials' : '工程實績與研究'}">${links([local('/work/industrial-robotics/'), local('/research/'), local('/labs/projects/')], copy.trust)}</nav>
  </div>
</section>`;
  const solutionCards = pillars.map(pillar => `<li><a href="${local(`/solutions/${pillar.slug}/`)}"><span class="eyebrow" lang="en">${pillar.name}</span><span>${t(pillar.short)}</span></a></li>`).join('');
  const core = section('core-solutions', copy.solutions, `<ul class="home-solution-grid">${solutionCards}</ul><p class="home-first-offer"><a class="text-link" href="${local('/services/technical-consulting/')}#architecture-assessment">${copy.firstOffer}</a></p>`);
  const evidence = section('engineering-evidence', copy.evidence, `<p class="topic-lead">${copy.methods}</p><div class="entry-links">${links(['/labs/benchmarks/', '/labs/demos/', '/labs/evidence/', '/labs/projects/'].map(local), copy.evidenceLinks)}</div>`);
  const choices = [...pillars.map(pillar => ({
    service: pillar.service, label: t(pillar.question), title: pillar.name, output: t(pillar.output), url: local(`/solutions/${pillar.slug}/`),
  })), { service: 'assessment', label: copy.unspecific[0], title: copy.unspecific[1], output: copy.unspecific[2], url: local('/services/technical-consulting/') }];
  const finder = `<div class="topic-panel home-finder" data-solution-finder hidden>
    <h3>${copy.finder}</h3>
    <label for="home-solution-choice">${copy.finderPrompt}</label>
    <select id="home-solution-choice"><option value="">${copy.finderDefault}</option>${choices.map(choice => `<option value="${choice.service}">${choice.label}</option>`).join('')}</select>
    <div aria-live="polite">${choices.map(choice => `<div class="home-finder-result" data-solution-result="${choice.service}" hidden>
      <strong>${choice.title}</strong><p>${choice.output}</p>
      <div class="entry-links"><a class="text-link" href="${choice.url}">${copy.finderAction}</a><a class="text-link" href="${local('/contact/')}?service=${choice.service}#rfp" data-analytics="service_cta_clicked" data-service="${choice.service}">${copy.finderContact}</a></div>
    </div>`).join('')}</div>
  </div>`;
  const packages = copy.engagementRows.map(([title, duration, description, destination]) => {
    const [path, anchor] = destination.split('#');
    const url = local(`/services/${path}/`) + (anchor ? `#${anchor}` : '');
    return `<li><a class="text-link" href="${url}">${title}</a><span class="home-duration">${duration}</span><p>${description}</p></li>`;
  }).join('');
  const engagements = section('engagements', copy.engagements, `<div class="home-engagement-grid"><div><ul class="home-rows">${packages}</ul><div class="entry-links">${links([local('/services/fractional-cto/'), local('/company/') + '#engagement-terms'], [copy.cto, copy.terms])}</div></div>${finder}</div>`);
  const company = section('studio-architecture', copy.company, `<div class="entry-links">${links([local('/research/'), local('/company/'), '/#partners', `/downloads/quantquer-capabilities-${locale}.pdf`], copy.companyLinks)}</div>`);
  const contact = section('project-contact', copy.closing, `<p class="topic-lead">${copy.closingText}</p><div class="entry-links"><a class="btn btn-primary" data-analytics="contact_cta_clicked" href="mailto:chisheng.m.chen@gmail.com?subject=Quantquer%20project%20inquiry">${copy.email}</a><a class="btn btn-ghost" href="${local('/contact/')}#rfp">${copy.rfp}</a></div>`);
  return {
    navigation: en ? studioHeader(locale, '/') : waveformNavigation,
    hero: [en ? englishHero : waveformHero, brand, core].join('\n'),
    conversion: [evidence, engagements, company, contact].join('\n'),
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
