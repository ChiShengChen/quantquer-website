import { escapeHtml, studioPath, writeStudioPage } from './vnext-layout.mjs';
import { fields, projectTypes, quickFields } from '../assets/contact-model.mjs';

const email = 'chisheng.m.chen@gmail.com';
const route = '/contact/';
for (const locale of ['zh', 'en']) {
  const en = locale === 'en';
  const l = (zh, english) => en ? english : zh;
  const title = l('討論你的專案', 'Discuss your project');
  const description = l('說明你的技術問題、部署條件與交付需求，與量維資科討論工程評估、原型或客製化研發。', 'Share your technical challenge, deployment constraints and deliverables to discuss an assessment, prototype or custom engineering engagement.');
  const options = Object.entries(projectTypes).map(([value, labels]) => `<option value="${value}">${escapeHtml(labels[en ? 1 : 0])}</option>`).join('');
  const inputs = (fieldList, prefix) => fieldList.map(field => {
    const name = `${prefix}-${field.name}`;
    const attrs = `id="${name}" name="${field.name}" aria-describedby="${name}-error"${field.required ? ' required' : ''}`;
    let control;
    if (field.type === 'select') control = `<select ${attrs}><option value="">${l('請選擇', 'Select a project type')}</option>${options}</select>`;
    else if (field.type === 'textarea') control = `<textarea ${attrs} rows="4" maxlength="${field.limit}"></textarea>`;
    else control = `<input ${attrs} type="${field.type}" maxlength="${field.limit}"${field.autocomplete ? ` autocomplete="${field.autocomplete}"` : ''}>`;
    return `<div class="studio-contact-field${field.type === 'textarea' ? ' full' : ''}"><label for="${name}">${field.labels[en ? 1 : 0]}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${control}<p id="${name}-error" class="studio-contact-error" hidden></p></div>`;
  }).join('\n');
  const mailSubject = encodeURIComponent(l('Quantquer 技術需求', 'Quantquer engineering inquiry'));
  const content = `<section class="topic-hero"><div class="wrap"><p class="eyebrow">Quantquer Engineering</p><h1>${title}</h1><p class="topic-intro">${description}</p>
    <div class="entry-links">
      <a class="btn btn-primary" id="contact-direct-email" data-analytics="contact_cta_clicked" href="mailto:${email}?subject=${mailSubject}">${l('直接 Email', 'Email us directly')}</a>
      <a class="btn btn-ghost" href="#rfp">${l('準備完整專案需求', 'Prepare a detailed project brief')}</a>
      <template id="contact-booking"><a class="btn btn-ghost" data-analytics="contact_cta_clicked">${l('預約技術會議', 'Book a technical meeting')}</a></template>
    </div>
    <p class="topic-audience">${l('先寫技術問題與目標即可。', 'Start with your technical problem and the outcome you need.')} <a class="text-link" href="mailto:${email}">${email}</a></p>
    <div id="contact-quick" class="topic-panel studio-quick-panel" hidden>
      <h2>${l('快速聯絡', 'Quick inquiry')}</h2>
      <form id="quick-inquiry" class="studio-inquiry" novalidate aria-describedby="quick-privacy">
        ${inputs(quickFields, 'quick')}
        <div class="studio-inquiry-trap" aria-hidden="true"><label>${l('請留空', 'Leave empty')} <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
        <p id="quick-privacy" class="full">${l('請概述問題，不要填入機密資料。', 'Briefly describe your problem without including confidential data.')}</p>
        <div class="entry-links full"><button type="submit" class="btn btn-primary" id="quick-submit">${l('送出簡短需求', 'Send a quick inquiry')}</button></div>
        <p id="quick-status" class="full" role="status"></p>
      </form>
    </div>
  </div></section>
  <section class="topic-section" id="rfp"><div class="wrap studio-contact-grid">
    <div>
      <h2>${l('完整專案需求（RFP）', 'Detailed project brief (RFP)')}</h2>
      <p>${l('帶有星號的欄位必填。請先概述問題，並避免填入病患、客戶或任何機密資料。', 'Fields marked with an asterisk are required. Describe the challenge without including patient, customer or confidential data.')}</p>
      <p id="contact-delivery" aria-live="polite">${l('填寫後可產生郵件草稿，或複製內容到你的信箱寄送。', 'Prepare an email draft or copy your inquiry into your preferred email service.')}</p>
      <form id="studio-inquiry" class="studio-inquiry" novalidate aria-describedby="contact-privacy contact-delivery">
        ${inputs(fields, 'inquiry')}
        <div class="studio-inquiry-trap" aria-hidden="true"><label>${l('請留空', 'Leave empty')} <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
        <p id="contact-summary" class="studio-contact-error full" role="alert" hidden></p>
        <p id="contact-privacy" class="full">${l('這些資料用於回覆本次詢問。郵件草稿及複製功能在你的瀏覽器產生內容。', 'We use these details to respond to your inquiry. Your browser prepares the email draft and copyable brief.')}</p>
        <div class="entry-links full">
          <button type="submit" class="btn btn-primary" id="contact-submit" hidden>${l('送出專案需求', 'Send project inquiry')}</button>
          <button type="button" class="btn btn-ghost" id="contact-draft">${l('開啟郵件草稿', 'Open email draft')}</button>
          <button type="button" class="btn btn-ghost" id="contact-copy">${l('複製需求內容', 'Copy inquiry')}</button>
        </div>
        <p id="contact-status" class="full" role="status"></p>
        <div class="full" id="contact-manual" hidden><label for="contact-brief">${l('手動複製需求內容', 'Copy your inquiry manually')}</label><textarea id="contact-brief" rows="6" readonly></textarea></div>
      </form>
    </div>
    <aside class="topic-panel studio-contact-aside"><h2>${l('開始合作', 'Start an engagement')}</h2>
      <p>${l('初次討論聚焦於使用情境、既有資料或系統，以及驗收條件。', 'The first discussion covers your use case, available data or systems, and acceptance criteria.')}</p>
      <a class="text-link studio-email" href="mailto:${email}">${email}</a>
      <a class="text-link" href="/project-planner/${en ? '?lang=en' : ''}">${l('使用專案需求規劃器', 'Use the project planner')}</a>
      <a class="text-link" href="${studioPath('/services/technical-consulting/', locale)}">${l('查看技術評估服務', 'Explore technical assessment')}</a>
      <a class="text-link" href="${studioPath('/company/', locale)}#engagement-terms">${l('NDA、IP、資料與交付方式', 'NDA, IP, data and delivery practices')}</a>
    </aside>
  </div></section>`;
  await writeStudioPage({ route, locale, title, description, content, breadcrumbs: [{ href: studioPath('/', locale), label: l('首頁', 'Home') }], structuredData: { '@type': 'ContactPage' }, styles: ['/assets/studio-contact.css'], scripts: ['/assets/studio-contact.mjs'], extraHead: '<noscript><style>#studio-inquiry{display:none}</style></noscript>' }, { check: process.argv.includes('--check') });
}
