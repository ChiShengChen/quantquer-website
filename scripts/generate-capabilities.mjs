import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { capabilityCopy } from './generate-capabilities-copy.mjs';

const { values } = parseArgs({ options: { browser: { type: 'string', default: 'google-chrome' } } });
const repo = fileURLToPath(new URL('../', import.meta.url));
const css = readFileSync(new URL('./generate-capabilities.css', import.meta.url), 'utf8');
const output = join(repo, 'downloads');
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const asset = path => pathToFileURL(join(repo, 'assets', path)).href;
const link = (url, text) => `<a href="${escape(url)}">${escape(text)}</a>`;

function render(copy) {
  const footer = page => `<footer class="page-footer"><span>${escape(copy.company)}</span>${link(copy.homeUrl, 'quantquer.com')}<span>${page} / 4</span></footer>`;
  const heading = (title, intro) => `<header class="page-heading"><p class="eyebrow">Quantquer</p><h2>${escape(title)}</h2><p>${escape(intro)}</p></header>`;
  const contacts = `<li>${link(copy.contactUrl, copy.contactLabel)}</li><li>${link(`mailto:${copy.email}`, copy.email)}</li>`;
  const cases = copy.cases.map(project => {
    const url = `https://quantquer.com/work/${project.slug}/${copy.language === 'en' ? '#english' : ''}`;
    const details = project.detail.map((text, index) => `<dt>${escape(copy.workLabels[index])}</dt><dd>${escape(text)}</dd>`).join('\n');
    return `<article class="case">
      <img class="case-image" src="${asset(project.image)}" alt="${escape(project.alt)}">
      <div class="case-body"><p class="case-status">${escape(project.status)}</p><h3>${escape(project.title)}</h3>
      <dl>${details}</dl>${link(url, copy.publicCase)}</div>
    </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="${copy.language}">
<head><meta charset="utf-8"><title>${escape(`${copy.company} | ${copy.documentTitle}`)}</title><style>${css}</style></head>
<body>
<main>
  <section class="page cover" aria-labelledby="document-title">
    <header class="cover-hero">
      <div class="cover-topline"><img class="cover-logo" src="${asset('logo-full-light.png')}" alt="Quantquer">
      <span class="cover-edition">${escape(copy.edition)}</span></div>
      <p class="eyebrow" lang="en">From Silicon to Intelligence</p>
      <h1 id="document-title">${escape(copy.headline)}</h1>
      <p class="cover-company">${escape(copy.company)} · ${escape(copy.documentTitle)}</p>
    </header>
    <p class="cover-summary">${escape(copy.intro)}</p>
    <h2>${escape(copy.stackTitle)}</h2>
    <ol class="stack">${copy.stack.map(([title, description]) => `<li><h3>${escape(title)}</h3><p>${escape(description)}</p></li>`).join('\n')}</ol>
    <ul class="cover-contact">${contacts}</ul>
    ${footer(1)}
  </section>
  <section class="page">
    ${heading(copy.capabilitiesTitle, copy.capabilitiesIntro)}
    <ul class="capability-list">${copy.capabilities.map(([title, description, deliverable]) => `<li class="capability">
      <h3>${escape(title)}</h3><div><p>${escape(description)}</p><p class="deliverable"><strong>${escape(copy.exampleDeliverable)}</strong> · ${escape(deliverable)}</p></div>
    </li>`).join('\n')}</ul>
    ${footer(2)}
  </section>
  <section class="page">
    ${heading(copy.workTitle, copy.workIntro)}
    <div class="work-grid">${cases}</div>
    <p class="historical-note">${escape(copy.historicalNote)}</p>
    ${footer(3)}
  </section>
  <section class="page">
    ${heading(copy.engagementTitle, copy.engagementIntro)}
    <ul class="engagement-grid">${copy.engagements.map(([title, description]) => `<li class="engagement"><h3>${escape(title)}</h3><p>${escape(description)}</p></li>`).join('\n')}</ul>
    <section class="contact-panel"><h3>${escape(copy.ctaTitle)}</h3><p>${escape(copy.ctaText)}</p><ul>${contacts}</ul></section>
    ${footer(4)}
  </section>
</main>
</body></html>`;
}

const scratch = mkdtempSync(join(tmpdir(), 'quantquer-capability-pdf-'));
try {
  mkdirSync(output, { recursive: true });
  const rendered = [];
  for (const [locale, copy] of Object.entries(capabilityCopy)) {
    const html = join(scratch, `capabilities-${locale}.html`);
    const pdf = join(scratch, `quantquer-capabilities-${locale}.pdf`);
    writeFileSync(html, render(copy));
    const process = spawnSync(values.browser, [
      '--headless', '--no-sandbox', '--disable-background-networking', '--disable-gpu',
      '--allow-file-access-from-files', '--no-pdf-header-footer', '--export-tagged-pdf',
      `--user-data-dir=${join(scratch, `profile-${locale}`)}`,
      `--print-to-pdf=${pdf}`, pathToFileURL(html).href,
    ], { encoding: 'utf8', timeout: 45_000 });
    if (process.error || process.status !== 0) {
      const reason = process.error?.message ?? process.stderr?.trim();
      throw new Error(`Chromium could not generate the ${locale} statement. ${reason}`);
    }
    if (statSync(pdf).size < 10_000) throw new Error(`Incomplete ${locale} PDF generation`);
    rendered.push([locale, readFileSync(pdf)]);
  }
  for (const [locale, bytes] of rendered) {
    const pdf = join(output, `quantquer-capabilities-${locale}.pdf`);
    writeFileSync(pdf, bytes);
    console.log(`${pdf} (${Math.round(bytes.length / 1024)} KiB)`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
