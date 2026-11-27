import { readFile, writeFile } from 'node:fs/promises';
import { studioHeader, studioPath } from './vnext-layout.mjs';
import { studioBrand } from '../data/studio-brand.mjs';

const check = process.argv.includes('--check');
const content = {
  zh: {
    headline: '從晶片到智慧系統，<br class="hero-copy-break"><span class="hero-verb">解決</span><br class="hero-mobile-break"><span class="hl">高難度 AI 工程問題</span>。',
    intro: '我們為半導體、工業、醫療與科技企業提供客製化 AI 演算法、模型部署、智慧代理系統及高效能運算基礎設施研發。',
    primary: '討論你的專案', secondary: '查看工程成果', diagram: '從晶片到系統的工程流程',
    credentialsTitle: '把研究方法帶進工程交付',
    credentials: [
      ['公司工程交付', '匿名工程案例記錄工作站設計、資料與模型整合，以及交付或測試範圍。', '/work/', '查看工程案例'],
      ['創辦人研發背景', '由 IC 設計、應用 AI 與生醫資訊研究，延伸至科學與量子機器學習。', '/company/', '查看公司與創辦人背景'],
      ['研究發表與開源', '從研究論文、開源工具到可重跑實驗，公開方法及適用條件。', '/research/', '查看公開研究'],
    ],
    solutionTitle: '核心解決方案', solutionLink: '查看解決方案', solutionAll: '所有解決方案',
    solutions: [
      ['Silicon Intelligence', '晶片端與嵌入式 AI', '模型要進晶片，受限於算子、記憶體或延遲預算。', '檢查部署相容性，衡量模型最佳化前後差異。', '交付算子與部署清單、原型及測試報告。', 'semiconductor-edge-ai', '/labs/evidence/vision/', '影像修復 CPU 實測'],
      ['Agentic Intelligence', '企業代理與 AI 可靠性', '文件版本衝突、代理失敗，讓團隊無法追溯結論。', '設計資料權威、工具權限、失敗回復與評估。', '交付可稽核的流程、評估集及回歸規則。', 'ai-reliability', '/labs/demos/knowledge-arbitration/', '文件仲裁互動示例'],
      ['Compute Intelligence', 'GPU 運算基礎設施', '共用 GPU 任務互相阻塞，資源和等待時間難以預估。', '依工作特性驗證佇列、VRAM 管控及觀測。', '交付排程 PoC、執行紀錄與容量建議。', 'gpu-infrastructure', '/labs/evidence/gpu/', '單卡控制環境實跑紀錄'],
      ['Scientific Intelligence', '科學運算與研究工程', '模擬、演算法或資料分析缺少可重現的驗證程序。', '設計可重跑實驗、資料流程與誤差檢查。', '交付可重現程式、測試資料與方法報告。', 'scientific-ai', '/labs/evidence/research/', '引文稽核重跑紀錄'],
    ],
    evidenceTitle: '工程證據', evidenceText: '每項成果附上測試條件與限制。可直接核對量測方法、原始紀錄與模擬設定。',
    evidence: [
      ['實測與可重現實驗', '比較 CPU 影像修復結果、GPU 單卡排程及引文檢查。', '/labs/benchmarks/', '查看基準測試'],
      ['互動技術展示', '操作光子故障、GPU 工作佇列、知識仲裁、代理驗證和工作站規劃。', '/labs/demos/', '開啟展示'],
      ['開源實作與技術紀錄', '查看程式、對照原始輸出及下載可公開結果。', '/labs/evidence/', '瀏覽證據中心'],
    ],
    engageTitle: '開始合作', engageLink: '查看合作範圍',
    engagements: [
      ['技術評估', '提供問題、現況與限制。先對齊目標，再依可取得資料和系統條件交付風險與驗證計畫。', 'technical-consulting'],
      ['可行性研究與 PoC', '提供代表資料或測試環境。時程依資料與硬體到位狀態確認，以事先約定的測試門檻驗收。', 'feasibility-study'],
      ['客製工程與研發', '共同定義介面、里程碑及交付。依範圍安排驗收、文件及移交。', 'custom-rd'],
    ],
    layersTitle: 'Quantquer 的工作範圍',
    layers: [
      ['Quantquer Engineering', '企業工程顧問、可行性驗證與客製交付。', '/services/'],
      ['Quantquer Labs', '公開實驗、基準測試與可操作的技術展示。', '/labs/'],
      ['Quantquer Products', '自主研發項目與各自的公開狀態。', '/labs/projects/'],
    ],
  },
  en: {
    headline: 'Engineering Intelligence, from Silicon to Systems.',
    intro: 'Quantquer develops research-driven AI algorithms, embedded intelligence, reliable agent systems, and high-performance computing infrastructure for technically demanding applications.',
    primary: 'Discuss your project', secondary: 'Explore engineering work', diagram: 'Engineering flow from silicon to systems',
    credentialsTitle: 'From research methods to engineering delivery',
    credentials: [
      ['Company engineering delivery', 'Anonymized work documents industrial workcells, data and model integration, and the scope of handoff or validation.', '/work/', 'Explore engineering work'],
      ['Founder’s engineering and research', 'Experience spans IC design, applied AI, biomedical informatics, scientific machine learning and quantum machine learning.', '/company/', 'See company and founder background'],
      ['Public research and open source', 'Read publications, inspect open-source tools, and review reproducible experiments and their conditions.', '/research/', 'Explore public research'],
    ],
    solutionTitle: 'Core solutions', solutionLink: 'Explore the solution', solutionAll: 'All solutions',
    solutions: [
      ['Silicon Intelligence', 'On-device and embedded AI', 'Hardware operators, memory and latency budgets constrain on-device models.', 'Check deployment compatibility and measure optimization trade-offs.', 'Deliver operator and deployment inventories, prototypes and test reports.', 'semiconductor-edge-ai', '/labs/evidence/vision/', 'Measured CPU image restoration'],
      ['Agentic Intelligence', 'Enterprise agents and AI reliability', 'Conflicting documents and agent failures make decisions hard to trace.', 'Design source authority, tool permissions, failure recovery and evaluation.', 'Deliver auditable workflows, evaluation sets and regression rules.', 'ai-reliability', '/labs/demos/knowledge-arbitration/', 'Interactive knowledge arbitration'],
      ['Compute Intelligence', 'GPU infrastructure', 'Shared GPU workloads block one another, with unpredictable resource demand and waiting times.', 'Test workload queues, VRAM budgets and observability against representative jobs.', 'Deliver a scheduling PoC, execution traces and capacity guidance.', 'gpu-infrastructure', '/labs/evidence/gpu/', 'Controlled single-GPU execution trace'],
      ['Scientific Intelligence', 'Scientific computing and research engineering', 'Simulations, algorithms and analyses need repeatable validation.', 'Design repeatable experiments, data pipelines and error checks.', 'Deliver runnable code, experimental inputs and methods reports.', 'scientific-ai', '/labs/evidence/research/', 'Reproduced citation checks'],
    ],
    evidenceTitle: 'Engineering evidence', evidenceText: 'Check the methods, raw outputs and simulation settings. Each result specifies its conditions and limits.',
    evidence: [
      ['Measured and reproducible results', 'Compare CPU image restoration, controlled GPU scheduling and citation checks.', '/labs/benchmarks/', 'View benchmarks'],
      ['Interactive technical demos', 'Explore photonic faults, GPU queues, knowledge arbitration, agent checks and workcell planning.', '/labs/demos/', 'Open demos'],
      ['Open implementations and reports', 'Inspect source code, download results and read the underlying evidence.', '/labs/evidence/', 'Browse the evidence center'],
    ],
    engageTitle: 'Start an engagement', engageLink: 'View engagement scope',
    engagements: [
      ['Technical assessment', 'Share your problem and constraints. We agree on a goal, then deliver a risk assessment and validation plan based on accessible systems and data.', 'technical-consulting'],
      ['Feasibility study and PoC', 'Provide representative inputs or a test environment. We confirm timing when hardware and data are ready and agree on acceptance thresholds.', 'feasibility-study'],
      ['Custom engineering and R&D', 'Define interfaces, milestones and deliverables together. The scope determines acceptance checks, documentation and handoff.', 'custom-rd'],
    ],
    layersTitle: 'How Quantquer works',
    layers: [
      ['Quantquer Engineering', 'Engineering consulting, feasibility studies and custom delivery.', '/services/'],
      ['Quantquer Labs', 'Public experiments, benchmarks and interactive engineering demos.', '/labs/'],
      ['Quantquer Products', 'Independent R&D projects and their current public status.', '/labs/projects/'],
    ],
  },
};

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
  const brand = `<section class="studio-home-section axis-divider" id="brand" aria-labelledby="brand-slogan">
  <div class="wrap">
    <p class="eyebrow" lang="en">Quantquer</p>
    <h2 id="brand-slogan" lang="en">${studioBrand.slogan}</h2>
    <p class="topic-lead" lang="en">${studioBrand.technicalTagline}</p>
    <p class="topic-lead">${studioBrand.positioning[Number(en)]}</p>
  </div>
</section>`;
  const pipeline = `<ol class="studio-pipeline" aria-label="${copy.diagram}" lang="en">
      ${[
        ['Silicon', 'NPU · GPU', '<rect x="12" y="12" width="24" height="24" rx="3"/><path d="M18 18h12v12H18zM18 7v5m12-5v5M18 36v5m12-5v5M7 18h5m-5 12h5m24-12h5m-5 12h5"/>'],
        ['Models', 'Quantization · Runtime', '<path d="M9 28l15-8 15 8-15 8-15-8zm0-8l15-8 15 8-15 8-15-8zm0 16l15 8 15-8"/>'],
        ['Agents', 'Tools · Evaluation', '<path d="M24 13v8m0 0L12 31m12-10l12 10"/><circle cx="24" cy="11" r="5"/><circle cx="11" cy="34" r="5"/><circle cx="37" cy="34" r="5"/>'],
        ['Systems', 'Deploy · Observe', '<rect x="6" y="11" width="36" height="26" rx="4"/><path d="M11 26h7l4-9 5 14 3-5h6"/>'],
      ].map(([label, caption, svg]) => `<li><svg viewBox="0 0 48 48" aria-hidden="true">${svg}</svg><b>${label}</b><small>${caption}</small></li>`).join('')}
    </ol>`;

  const cluster = (id, title, cards, intro = '') => `<section class="studio-home-section axis-divider" id="${id}"><div class="wrap"><h2>${title}</h2>${intro ? `<p class="topic-lead">${intro}</p>` : ''}<div class="studio-home-cards">${cards}</div></div></section>`;
  const smallCard = (title, text, href, action) => `<article class="topic-panel"><h3>${title}</h3><p>${text}</p><a class="text-link" href="${href}">${action}</a></article>`;
  const cards = copy.solutions.map(([pillar, title, problem, approach, deliverable, slug, evidence, evidenceLabel]) => `<article class="topic-panel">
      <p class="eyebrow" lang="en">${pillar}</p><h3>${title}</h3>
      <p>${problem}</p><p>${approach} ${deliverable}</p>
      <div class="entry-links"><a class="text-link" href="${local(`/solutions/${slug}/`)}" aria-label="${copy.solutionLink} — ${title}">${copy.solutionLink}</a><a class="text-link" href="${evidence.includes('/labs/evidence/') ? (en ? evidence + '?lang=en' : evidence) : local(evidence)}">${evidenceLabel}</a></div>
    </article>`).join('');
  const solutionSection = `<section class="studio-home-section axis-divider" id="core-solutions"><div class="wrap"><h2>${copy.solutionTitle}</h2>${pipeline}<div class="studio-home-cards studio-solution-grid">${cards}</div><div class="entry-links"><a class="text-link" href="${local('/solutions/')}">${copy.solutionAll}</a></div></div></section>`;
  return {
    navigation: en ? studioHeader(locale, '/') : waveformNavigation,
    hero: [en ? englishHero : waveformHero, brand, cluster('engineering-credentials', copy.credentialsTitle, copy.credentials.map(([title, text, url, action]) => smallCard(title, text, local(url), action)).join('')), solutionSection].join('\n'),
    conversion: [
      cluster('engineering-evidence', copy.evidenceTitle, copy.evidence.map(([title, text, url, action]) => smallCard(title, text, local(url), action)).join(''), copy.evidenceText),
      cluster('engagements', copy.engageTitle, copy.engagements.map(([title, text, service]) => smallCard(title, text, local(`/services/${service}/`), copy.engageLink)).join('')),
      cluster('studio-architecture', copy.layersTitle, copy.layers.map(([title, text, url]) => smallCard(title, text, local(url), en ? 'Explore' : '查看')).join('')),
    ].join('\n'),
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
