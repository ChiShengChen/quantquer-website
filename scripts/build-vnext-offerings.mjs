import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { solutions, procurement, engagements, pricing, founder, publicationGroups, insights, offeringRoutes } from '../data/studio-offerings.mjs';
import { capabilityCopy } from './generate-capabilities-copy.mjs';
import { escapeHtml as escape, origin, studioPath, writeStudioPage } from './vnext-layout.mjs';

const { values } = parseArgs({ options: { check: { type: 'boolean', default: false } } });
const cases = Object.fromEntries(JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url), 'utf8')).projects.map(item => [item.slug, item]));
const packages = new Map(engagements.map(item => [item.id, item]));
const labels = {
  home: ['首頁', 'Home'], solutions: ['解決方案', 'Solutions'], services: ['服務與合作方式', 'Services & Engagements'],
  contact: ['聯絡團隊', 'Contact the team'], planner: ['規劃專案', 'Plan your project'], work: ['查看案例', 'View case studies'],
  related: ['相關解決方案', 'Related solutions'], capabilities: ['技術能力簡介', 'Capability Statement'],
  problems: ['產業問題', 'Business problems'], engineering: ['工程能力', 'Engineering capabilities'],
  architecture: ['參考架構', 'Reference architecture'], uses: ['典型應用', 'Typical uses'],
  cases: ['相關案例', 'Relevant case studies'], evidence: ['技術證據', 'Technical evidence'],
  deliverables: ['預期交付物', 'Expected deliverables'], engagements: ['合作方式', 'Engagement models'],
  faq: ['常見問題', 'Frequently asked questions'], inquiry: ['討論您的專案', 'Discuss your project'],
  architectureNote: ['示意參考架構。依需求、資料及目標環境調整。', 'Illustrative reference architecture. Adapted to the requirements, data, and target environment.'],
  downloads: ['下載 PDF', 'Download PDF'], allServices: ['比較所有合作方式', 'Compare all engagements'],
};

function renderLanguage(locale) {
  const english = locale === 'en';
  const lang = english ? 'en' : 'zh-Hant';
  const local = route => studioPath(route, locale);
  const select = pair => {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(item => typeof item !== 'string' || !item.trim())) {
      throw new Error(`Incomplete zh/en translation: ${JSON.stringify(pair)}`);
    }
    return pair[Number(english)];
  };
  const t = pair => escape(select(pair));
  const a = (href, label, className = 'text-link', attributes = '') => `<a class="${className}" href="${escape(href)}"${attributes}>${t(label)}</a>`;
  const solutionPath = id => `/solutions/${id}/`;
  const servicePath = id => `/services/${id}/`;
  const casePath = id => `/work/${id}/${english ? '#english' : ''}`;
  const demoPath = href => {
    if (!english) return href;
    const url = new URL(href, origin);
    url.searchParams.set('lang', 'en');
    return url.pathname + url.search + url.hash;
  };
  const plan = (service = '') => {
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (english) params.set('lang', 'en');
    return '/project-planner/' + (params.size ? `?${params}` : '');
  };
  const buttons = (primaryHref, primary, secondaryHref, secondary) => `<div class="entry-links offering-actions">${a(primaryHref, primary, 'btn btn-primary')}${secondary ? a(secondaryHref, secondary, 'btn btn-ghost') : ''}</div>`;
  const plannerCta = service => buttons(plan(service), labels.planner, local('/contact/'), labels.contact);
  const contactCta = service => section('contact-team', labels.inquiry, `<p class="topic-lead">${t(['提供目標環境、代表性需求及希望驗收的條件，我們會與您確認範圍和下一步。', 'Share your target environment, representative needs, and acceptance criteria so we can scope the next step.'])}</p>${plannerCta(service)}`);
  const markupCta = (service, label) => a(plan(service), label, 'btn btn-primary');
  const hero = (eyebrow, title, intro, actions = '') => `<section class="topic-hero offering-hero"><div class="wrap">
<p class="eyebrow">${t(eyebrow)}</p><h1>${t(title)}</h1><p class="topic-intro">${t(intro)}</p>${actions}</div></section>`;
  function section(id, title, body) {
    return `<section class="topic-section axis-divider offering-section" id="${id}" aria-labelledby="${id}-heading"><div class="wrap">
<h2 id="${id}-heading">${t(title)}</h2>${body}</div></section>`;
  }

  const list = (items, className = 'offering-list') => `<ul class="${className}">${items.map(item => `<li>${t(item)}</li>`).join('')}</ul>`;
  const grid = markup => `<div class="offering-grid">${markup}</div>`;
  const nav = items => `<nav class="offering-jump" aria-label="${t(['頁面目錄', 'On this page'])}">${items.map(([id, label]) => a(`#${id}`, label)).join('')}</nav>`;
  const profileLinks = () => `<div class="entry-links">${founder.profiles.map(({ href, label }) => a(href, label)).join('')}</div>`;
  const page = (route, title, description, content, parent, structuredData) => ({
    route, locale, title: select(title), description: select(description), content,
    breadcrumbs: [{ href: local('/'), label: select(labels.home) }, ...(parent ? [{ href: local(parent.route), label: select(parent.title) }] : [])],
    structuredData, styles: ['/assets/vnext-offerings.css'],
  });
  const schema = (route, title, description) => ({ '@type': 'Service', name: select(title), description: select(description), url: origin + local(route), provider: { '@id': `${origin}/#organization` } });

  function renderCase(id) {
    const entry = cases[id]?.[locale];
    if (!entry?.title || !entry.summary) throw new Error(`Missing ${locale} case copy for ${id}`);
    return `<article class="topic-panel offering-card"><h3>${escape(entry.title)}</h3><p>${escape(entry.summary)}</p>${a(casePath(id), ['閱讀案例', 'Read the case study'])}</article>`;
  }

  function renderSolution(item) {
    const path = solutionPath(item.id);
    const architecture = `<figure class="offering-architecture"><figcaption>${t(labels.architectureNote)}</figcaption><ol>${item.architecture.map(([name, detail]) => `<li><strong>${t(name)}</strong><span>${t(detail)}</span></li>`).join('')}</ol></figure>`;
    const evidence = `<ul class="offering-evidence">${item.evidence.map(entry => {
      const href = entry.external ?? (entry.case ? casePath(entry.case) : entry.languageQuery ? demoPath(entry.route) : local(entry.route));
      return `<li>${a(href, entry.label)}<p>${t(entry.detail)}</p></li>`;
    }).join('')}</ul>`;
    const nextSteps = item.engagements.map(id => {
      const item = packages.get(id);
      if (!item) throw new Error(`Unknown engagement ${id}`);
      return `<article class="topic-panel offering-card"><h3>${t(item.name)}</h3><p class="offering-duration">${t(item.duration)}</p><p>${t(item.intro)}</p>${a(`${local(servicePath(item.procurement))}#${id}`, ['了解工作範圍', 'Explore scope'])}</article>`;
    }).join('');
    return page(path, item.name, item.intro, [
      hero(item.name, item.headline, item.intro, plannerCta(item.service) + nav([['architecture', labels.architecture], ['evidence', labels.evidence], ['deliverables', labels.deliverables], ['faq', labels.faq]])),
      section('business-problems', labels.problems, list(item.problems)),
      section('engineering-capabilities', labels.engineering, list(item.engineering)),
      section('architecture', labels.architecture, architecture),
      section('use-cases', labels.uses, list(item.uses)),
      section('case-studies', labels.cases, grid(item.cases.map(renderCase).join(''))),
      section('evidence', labels.evidence, evidence),
      section('deliverables', labels.deliverables, list(item.deliverables)),
      section('engagements', labels.engagements, grid(nextSteps) + `<p class="offering-link-row">${a(local('/services/'), labels.allServices)}</p>`),
      section('faq', labels.faq, `<div class="offering-faq">${item.faq.map(([question, answer]) => `<details><summary>${t(question)}</summary><p>${t(answer)}</p></details>`).join('')}</div>`),
      contactCta(item.service),
    ].join('\n'), { route: '/solutions/', title: labels.solutions }, schema(path, item.name, item.intro));
  }

  function solutionIndex() {
    const intro = ['從裝置部署、可靠的企業 AI 到運算與研發工作，依目標場域找出工程方法、驗證證據和可交付成果。', 'Find an engineering approach, relevant evidence, and expected deliverables for device deployment, reliable enterprise AI, compute, or scientific R&D.'];
    const cards = solutions.map(item => `<article class="topic-panel offering-card"><h3>${t(item.name)}</h3><p>${t(item.intro)}</p>${a(local(solutionPath(item.id)), ['查看解決方案', 'Explore solution'])}</article>`).join('');
    return page('/solutions/', labels.solutions, intro, hero(['Quantquer Engineering', 'Quantquer Engineering'], labels.solutions, intro, plannerCta()) +
      section('solution-list', ['依工程需求探索', 'Explore by engineering need'], grid(cards)), null, { '@type': 'CollectionPage' });
  }

  function packageCard(item, serviceContext) {
    const detailLink = a(`${local(servicePath(item.procurement))}#${item.id}`, ['服務詳情', 'Service details']);
    return `<article class="topic-panel offering-card" id="${item.id}"><h3>${t(item.name)}</h3><p class="offering-duration">${t(item.duration)}</p>
<p>${t(item.intro)}</p>${list(item.outputs, 'offering-package-list')}
<p class="offering-inputs"><strong>${t(['合作前準備', 'What to bring'])}</strong> ${t(item.inputs)}</p>
<div class="entry-links">${markupCta(item.service, pricing.label)}${serviceContext ? '' : detailLink}</div></article>`;
  }

  function serviceIndex() {
    const intro = ['依技術風險與交付階段選擇審查、可行性研究、概念驗證、客製研發或持續技術領導。', 'Choose a review, feasibility study, proof of concept, custom R&D, or ongoing technical leadership based on risk and delivery stage.'];
    const choosing = procurement.map(item => `<article class="topic-panel offering-card"><h3>${t(item.name)}</h3><p>${t(item.intro)}</p>${a(local(servicePath(item.id)), ['檢視採購範圍', 'Explore procurement scope'])}</article>`).join('');
    return page('/services/', labels.services, intro, hero(['Quantquer Engineering', 'Quantquer Engineering'], labels.services, intro, plannerCta()) +
      section('engagement-types', ['依交付階段選擇', 'Choose by delivery stage'], grid(choosing)) +
      section('service-packages', ['常見合作範圍', 'Packaged engagements'], `<p class="topic-lead">${t(pricing.note)}</p>${grid(engagements.map(item => packageCard(item, false)).join(''))}`), null, { '@type': 'CollectionPage' });
  }

  function procurementPage(type) {
    const route = servicePath(type.id);
    const items = engagements.filter(item => item.procurement === type.id);
    return page(route, type.name, type.intro, hero(labels.services, type.name, type.intro, buttons(plan(items[0].service), pricing.label, local('/services/'), labels.allServices)) +
      section('packages', ['合作內容', 'Available engagements'], `<p class="topic-lead">${t(pricing.note)}</p>${grid(items.map(item => packageCard(item, true)).join(''))}`) +
      section('acceptance', ['如何驗收', 'How acceptance works'], `<p class="topic-lead">${t(type.acceptance)}</p>`) + contactCta(items[0].service), { route: '/services/', title: labels.services }, schema(route, type.name, type.intro));
  }

  function company() {
    const name = ['關於量維資科', 'About Quantquer'];
    const intro = ['量維資科是研究驅動的 AI 與深科技工程團隊，從裝置、模型與代理系統到應用，協助團隊建立可驗證、可維護的技術交付。', 'Quantquer is a research-driven AI and deep-tech engineering studio helping teams deliver verifiable, maintainable technology from devices and models through agent systems and applications.'];
    const brands = [
      [['Quantquer Engineering', 'Quantquer Engineering'], ['技術顧問、可行性研究、客製開發與系統交付。', 'Technical consulting, feasibility studies, custom development, and engineering delivery.'], '/services/', labels.services],
      [['Quantquer Labs', 'Quantquer Labs'], ['公開研究程式、實驗、互動展示和基準量測，依各項狀態說明。', 'Research code, experiments, interactive demos, and benchmarks with project status shown.'], '/labs/', ['探索 Labs', 'Explore Labs']],
      [['Quantquer Products', 'Quantquer Products'], ['可重用軟體與工程工具。現有開源與實驗項目的狀態列於 Labs。', 'Reusable software and tools. The status of existing open-source and experimental projects is shown in Labs.'], '/labs/projects/', ['查看工具與狀態', 'Explore tools and their status']],
    ];
    const credentials = [
      [['專業經歷', 'Professional experience'], founder.professional],
      [['學術研究', 'Academic research'], founder.research],
      [['開源工程', 'Open-source engineering'], founder.openSource],
    ];
    return page('/company/', name, intro, hero(['From Silicon to Intelligence', 'From Silicon to Intelligence'], name, intro, buttons(local('/capabilities/'), labels.capabilities, local('/contact/'), labels.contact)) +
      section('studio', ['工程、研究與工具', 'Engineering, research, and tools'], grid(brands.map(([brand, desc, route, label]) => `<article class="topic-panel offering-card"><h3>${t(brand)}</h3><p>${t(desc)}</p>${a(local(route), label)}</article>`).join(''))) +
      section('founder', ['創辦人', 'Founder'], `<p class="offering-founder">${t(founder.name)}</p>${grid(credentials.map(([label, copy]) => `<article class="topic-panel offering-card"><h3>${t(label)}</h3><p>${t(copy)}</p></article>`).join(''))}${profileLinks()}<p class="offering-link-row">${t(founder.award)} ${a(founder.awardSource, ['查看主辦方結果', 'See the organizer’s results'])}</p>`) +
      section('engineering-delivery', ['量維工程案例', 'Quantquer engineering cases'], `<p class="topic-lead">${t(['公司案例依項目標明已交付的軟體、匿名工程、研究經歷或技術展示。研究及競賽的署名和範圍以原始資料為準。', 'Each case identifies whether it covers software delivery, anonymized work, research experience, or a technical demonstration. Original sources establish attribution and scope for research and competitions.'])}</p>${grid(['industrial-robotics', 'enterprise-knowledge-arbitration'].map(renderCase).join(''))}${a(local('/work/'), labels.work)}`), null, { '@type': 'AboutPage' });
  }

  function research() {
    const name = ['研究與發表', 'Research & Publications'];
    const intro = ['精選創辦人與研究團隊的同行審查論文、會議成果及預印本，並提供原文與可查閱的程式碼。', 'Selected peer-reviewed publications, conference papers, and preprints by the founder and research teams, with primary sources and public code where available.'];
    const publication = paper => `<li><h3 lang="en">${escape(paper.title)}</h3>
<p class="offering-duration" lang="en">${escape(paper.venue)}</p><p>${t(paper.detail)}</p><div class="entry-links">${a(paper.href, ['原始發表', 'Primary source'])}
${paper.code ? a(paper.code, ['公開程式碼', 'Public code']) : ''}${paper.preprint ? a(paper.preprint, ['預印本', 'Preprint']) : ''}</div></li>`;
    return page('/research/', name, intro, hero(['Quantquer Research', 'Quantquer Research'], name, intro, profileLinks() + nav(publicationGroups.map(group => [group.id, group.title]))) +
      publicationGroups.map(group => section(group.id, group.title, `<ul class="offering-papers">${group.papers.map(publication).join('')}</ul>`)).join('') +
      section('research-methods', ['工程應用與重現', 'Engineering applications and reproducibility'], buttons(local('/solutions/scientific-ai/'), ['科學 AI 解決方案', 'Scientific AI solutions'], demoPath('/labs/evidence/research/'), ['重播引文查核', 'Replay evidence checks'])), null, { '@type': 'CollectionPage' });
  }

  function insightIndex() {
    const name = ['工程觀點', 'Engineering Insights'];
    const intro = ['以端側部署、Agent 驗收與 GPU 量測為題，整理可直接用於早期技術討論的步驟及檢查項目。', 'Practical checklists for early engineering decisions in on-device deployment, agent evaluation, and GPU measurement.'];
    return page('/insights/', name, intro, hero(['工程筆記', 'Engineering notes'], name, intro, nav(insights.map(item => [item.id, item.name]))) + insights.map(item =>
      section(item.id, item.name, `<p class="topic-lead">${t(item.intro)}</p><ol class="offering-list">${item.points.map(point => `<li>${t(point)}</li>`).join('')}</ol>
<div class="entry-links">${a(local(solutionPath(item.solution)), labels.related)}${a(demoPath(item.route), ['查看技術證據', 'View technical evidence'])}</div>`)).join(''), null, { '@type': 'CollectionPage' });
  }

  function capability() {
    const copy = capabilityCopy[locale];
    for (const key of ['headline', 'intro', 'stackTitle', 'workTitle', 'engagementTitle', 'contactLabel', 'email']) {
      if (!copy[key]) throw new Error(`Incomplete ${lang} capability statement ${key}`);
    }
    const plain = items => grid(items.map(([title, text, output]) => `<article class="topic-panel offering-card"><h3>${escape(title)}</h3><p>${escape(text)}</p>${output ? `<p><strong>${escape(copy.exampleDeliverable)}</strong> ${escape(output)}</p>` : ''}</article>`).join(''));
    const work = grid(copy.cases.map(item => `<article class="topic-panel offering-card"><p class="offering-duration">${escape(item.status)}</p><h3>${escape(item.title)}</h3><dl class="offering-case-definition">${item.detail.map((value, index) => `<dt>${escape(copy.workLabels[index])}</dt><dd>${escape(value)}</dd>`).join('')}</dl>${a(casePath(item.slug), [copy.publicCase, copy.publicCase])}</article>`).join(''));
    const dl = a(`/downloads/quantquer-capabilities-${locale}.pdf`, labels.downloads, 'btn btn-primary', ' download data-analytics="capability_pdf_downloaded"');
    return page('/capabilities/', labels.capabilities, [capabilityCopy.zh.intro, capabilityCopy.en.intro], `<div class="offering-print">${hero(['From Silicon to Intelligence', 'From Silicon to Intelligence'], labels.capabilities, [capabilityCopy.zh.headline, capabilityCopy.en.headline], `<div class="entry-links">${dl}${a(local('/contact/'), labels.contact, 'btn btn-ghost')}</div>`)}
${section('positioning', [capabilityCopy.zh.stackTitle, capabilityCopy.en.stackTitle], `<p class="topic-lead">${escape(copy.intro)}</p>${plain(copy.stack)}`)}
${section('technical-capabilities', [capabilityCopy.zh.capabilitiesTitle, capabilityCopy.en.capabilitiesTitle], `<p class="topic-lead">${escape(copy.capabilitiesIntro)}</p>${plain(copy.capabilities)}`)}
${section('evidence', [capabilityCopy.zh.workTitle, capabilityCopy.en.workTitle], `<p class="topic-lead">${escape(copy.workIntro)}</p>${work}<p class="offering-link-row">${escape(copy.historicalNote)}</p>`)}
${section('engagement', [capabilityCopy.zh.engagementTitle, capabilityCopy.en.engagementTitle], `<p class="topic-lead">${escape(copy.engagementIntro)}</p>${plain(copy.engagements)}`)}
${section('founder', ['創辦人經歷', 'Founder credentials'], `<p class="offering-founder">${t(founder.name)}</p><p class="topic-lead">${t(founder.professional)} ${t(founder.research)}</p>${profileLinks()}`)}
${section('contact-team', labels.inquiry, `<p class="topic-lead">${escape(copy.ctaText)}</p><div class="entry-links">${dl}${a(local('/contact/'), labels.contact, 'btn btn-ghost')}${a(`mailto:${copy.email}`, [copy.email, copy.email])}</div>`)}</div>`, null);
  }

  return [solutionIndex(), ...solutions.map(renderSolution), serviceIndex(), ...procurement.map(procurementPage), company(), research(), insightIndex(), capability()];
}

for (const locale of ['zh', 'en']) {
  const pages = renderLanguage(locale);
  if (pages.map(page => page.route).join(',') !== offeringRoutes.join(',')) throw new Error(`Unexpected ${locale} offerings routes`);
  await Promise.all(pages.map(page => writeStudioPage(page, { check: values.check })));
}
console.log(`${values.check ? 'Verified' : 'Generated'} ${offeringRoutes.length * 2} solution, service, company, research, insight, and capability pages.`);
