import { track } from './analytics.mjs';
import { contactBrief, fields, projectTypes, quickFields, validateContact } from './contact-model.mjs';
import { inquiryEndpoint } from './inquiry.mjs';
import { bookingUrl, inquiryPath } from './studio-integrations.mjs';

const form = document.getElementById('studio-inquiry');
const locale = document.documentElement.lang === 'en' ? 'en' : 'zh';
const l = (zh, en) => locale === 'en' ? en : zh;
const endpoint = inquiryEndpoint(inquiryPath, location.origin);
const submit = document.getElementById('contact-submit');
const delivery = document.getElementById('contact-delivery');
const summary = document.getElementById('contact-summary');
const status = document.getElementById('contact-status');
const projectType = new URL(location.href).searchParams.get('service');
const labels = {
  required: l('請填寫此欄位。', 'Complete this field.'),
  length: l('內容超過字數上限。', 'This entry exceeds the character limit.'),
  email: l('請輸入有效的信箱。', 'Enter a valid email address.'),
  invalid: l('請確認這個欄位的內容。', 'Check this field.'),
};
if (Object.hasOwn(projectTypes, projectType)) form.elements.projectType.value = projectType;
submit.hidden = !endpoint;
submit.disabled = !endpoint;
delivery.textContent = endpoint
  ? l('你可直接送出，也可開啟郵件草稿或複製內容。', 'Send the inquiry directly, open an email draft or copy your brief.')
  : l('填寫後可產生郵件草稿，或複製內容到你的信箱寄送。', 'Prepare an email draft or copy your inquiry into your preferred email service.');
if (bookingUrl && URL.canParse(bookingUrl) && new URL(bookingUrl).protocol === 'https:') {
  const template = document.getElementById('contact-booking');
  const booking = template.content.querySelector('a').cloneNode(true);
  booking.href = bookingUrl;
  template.replaceWith(booking);
}

function updateError(activeForm, field, error) {
  const control = activeForm.elements[field.name];
  const line = document.getElementById(`${control.id}-error`);
  line.hidden = !error;
  line.textContent = error ? labels[error] : '';
  if (error) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
}

function readForm() {
  document.getElementById('contact-manual').hidden = true;
  status.textContent = '';
  const { values, errors } = validateContact(Object.fromEntries(new FormData(form)));
  for (const field of fields) updateError(form, field, errors[field.name]);
  const first = Object.keys(errors)[0];
  summary.hidden = !first;
  summary.textContent = first ? l('請檢查標示的欄位。', 'Review the highlighted fields.') : '';
  if (first) {
    form.elements[first].focus();
    return null;
  }
  return values;
}

form.addEventListener('input', event => {
  const field = fields.find(item => item.name === event.target.name);
  if (field) updateError(form, field);
  if (!form.querySelector('[aria-invalid="true"]')) summary.hidden = true;
});
form.addEventListener('focusin', () => track('inquiry_started', { channel: endpoint ? 'web' : 'email' }), { once: true });
function wireSubmission(activeForm, button, notice, readValues, mode) {
  if (!endpoint) return;
  let pending;
  activeForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    const values = readValues();
    if (!values) return;
    const fingerprint = JSON.stringify(values);
    if (pending?.fingerprint !== fingerprint) pending = { requestId: crypto.randomUUID(), fingerprint };
    button.disabled = true;
    notice.textContent = l('正在送出需求…', 'Sending your inquiry…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, requestId: pending.requestId, locale, mode, website: activeForm.elements.website.value }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !/^[\w-]{1,64}$/.test(result.receipt ?? '')) throw new Error('Unconfirmed inquiry');
      notice.textContent = l(`已送達詢價服務。收件編號 ${result.receipt}。`, `Accepted by the inquiry service. Receipt ${result.receipt}.`);
      track('inquiry_submitted');
      activeForm.reset();
      pending = null;
    } catch {
      notice.textContent = l('無法確認送達。你可以重試，或直接 Email。', 'Delivery could not be confirmed. Retry or email us directly.');
      track('inquiry_submission_failed');
    } finally {
      button.disabled = false;
    }
  });
}

wireSubmission(form, submit, status, readForm, 'full');
if (!endpoint) form.addEventListener('submit', event => {
  event.preventDefault();
  const values = readForm();
  if (values) openDraft(values, status, 'contact');
});

function revealCopy(brief, prefix) {
  const textarea = document.getElementById(`${prefix}-brief`);
  document.getElementById(`${prefix}-manual`).hidden = false;
  textarea.value = brief;
  textarea.focus();
  textarea.select();
}

function openDraft(values, notice, prefix) {
  const subject = l('Quantquer 專案討論', 'Quantquer project inquiry');
  const brief = contactBrief(values, locale);
  const draft = `mailto:chisheng.m.chen@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(brief)}`;
  if (draft.length > 1800) {
    revealCopy(brief, prefix);
    notice.textContent = l('內容較長，請複製後貼到郵件。', 'This brief is long. Copy it into your email.');
    return;
  }
  notice.textContent = l('請在郵件程式確認內容並寄送。', 'Review and send the draft from your email application.');
  location.href = draft;
}

async function copyBrief(values, notice, prefix) {
  const brief = contactBrief(values, locale);
  try {
    await navigator.clipboard.writeText(brief);
    notice.textContent = l('已複製。請貼到郵件並寄至 chisheng.m.chen@gmail.com。', 'Copied. Paste the inquiry into an email to chisheng.m.chen@gmail.com.');
  } catch {
    revealCopy(brief, prefix);
    notice.textContent = l('請手動複製已選取的內容。', 'Copy the selected text manually.');
  }
}

const quick = document.getElementById('quick-inquiry');
const quickStatus = document.getElementById('quick-status');
const quickSubmit = document.getElementById('quick-submit');
const quickCopy = document.getElementById('quick-copy');
function readQuick() {
  document.getElementById('quick-manual').hidden = true;
  quickStatus.textContent = '';
  const { values, errors } = validateContact(Object.fromEntries(new FormData(quick)), 'quick');
  for (const field of quickFields) updateError(quick, field, errors[field.name]);
  const first = Object.keys(errors)[0];
  if (!first) return values;
  quickStatus.textContent = l('請檢查標示的欄位。', 'Review the highlighted fields.');
  quick.elements[first].focus();
  return null;
}

quick.addEventListener('input', event => {
  const field = quickFields.find(item => item.name === event.target.name);
  if (field) updateError(quick, field);
  if (!quick.querySelector('[aria-invalid="true"]')) quickStatus.textContent = '';
});
quick.addEventListener('focusin', () => track('inquiry_started', { channel: endpoint ? 'web' : 'email' }), { once: true });
if (endpoint) {
  quickSubmit.textContent = l('送出簡短需求', 'Send a quick inquiry');
  document.getElementById('quick-delivery').textContent = l('你可直接送出或複製內容自行寄出。', 'Send the inquiry directly or copy it into your email.');
  wireSubmission(quick, quickSubmit, quickStatus, readQuick, 'quick');
} else {
  quick.addEventListener('submit', event => {
    event.preventDefault();
    const values = readQuick();
    if (values) openDraft(values, quickStatus, 'quick');
  });
}
quickCopy.addEventListener('click', () => {
  const values = readQuick();
  if (values) copyBrief(values, quickStatus, 'quick');
});
document.getElementById('contact-draft').addEventListener('click', () => {
  const values = readForm();
  if (values) openDraft(values, status, 'contact');
});
document.getElementById('contact-copy').addEventListener('click', () => {
  const values = readForm();
  if (values) copyBrief(values, status, 'contact');
});

quickSubmit.disabled = false;
quickCopy.disabled = false;
