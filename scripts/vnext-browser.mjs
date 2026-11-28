import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { caseVisuals } from '../data/case-visuals.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.QUANTQUER_PLAYWRIGHT || 'playwright');
const base = process.env.QUANTQUER_PREVIEW ?? 'http://127.0.0.1:8766';
const out = resolve(process.env.QUANTQUER_BROWSER_REPORT ?? '/tmp/quantquer-vnext-qa/browser');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({ reducedMotion: 'reduce', acceptDownloads: true });
const page = await context.newPage();
const defects = new Set();
const snapshots = [];
const portfolio = JSON.parse(await readFile(new URL('../data/projects.json', import.meta.url), 'utf8'));
const projectMedia = new Map(portfolio.projects.map(project => [project.slug, project.media]));
page.on('pageerror', error => defects.add(error.message));
page.on('console', message => {
  if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) defects.add(message.text());
});
page.on('response', response => {
  if (response.url().startsWith(base) && response.status() >= 400 && !/\/api\/inquiry$|\/this-route-should-not-exist\//.test(response.url())) defects.add(`${response.status()} ${response.url()}`);
});
page.on('requestfailed', request => {
  if (request.url().startsWith(base) && request.failure()?.errorText !== 'net::ERR_ABORTED') defects.add(`${request.failure()?.errorText} ${request.url()}`);
});

async function open(path) {
  const response = await page.goto(base + path, { waitUntil: 'load' });
  assert.equal(response?.status() ?? (await context.request.get(base + path)).status(), 200, path);
}

async function screenshot(name, fullPage = false) {
  await page.screenshot({ path: resolve(out, name + '.png'), fullPage, animations: 'disabled' });
}

try {
  const widths = [320, 360, 390, 768, 1024, 1440, 1920];
  const samples = [
    '/', '/en/', '/solutions/semiconductor-edge-ai/', '/en/solutions/ai-reliability/',
    '/services/feasibility-study/', '/work/', '/en/work/enterprise-knowledge-arbitration/',
    '/work/surgical-gauze-detection/', '/en/labs/projects/', '/labs/benchmarks/', '/labs/demos/reliability/',
    '/labs/demos/robot-workcell/', '/en/labs/demos/knowledge-arbitration/', '/en/contact/', '/capabilities/',
  ];
  const sitemap = await (await context.request.get(base + '/sitemap.xml')).text();
  const routes = [...sitemap.matchAll(/<loc>https:\/\/quantquer\.com([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(routes.length, new Set(routes).size);
  const canonicalPages = await Promise.all(routes.map(async path => {
    const response = await context.request.get(base + path);
    assert.equal(response.status(), 200, path);
    const html = await response.text();
    assert.match(html, /<meta name="description" content="[^"]{20,}/i, path);
    assert.ok(html.includes(`rel="canonical" href="https://quantquer.com${path}"`), path);
    assert.match(html, /property="og:image" content="https:\/\/quantquer\.com\/assets\/[^"]+"/i, path);
    if (!path.startsWith('/en/')) return path;
    assert.match(html, /<html lang="en"/i, path);
    assert.ok(html.includes(`hreflang="zh-Hant" href="https://quantquer.com${path.slice(3)}"`), path);
    assert.ok(html.includes(`hreflang="en" href="https://quantquer.com${path}"`), path);
    return path;
  }));
  console.log(`HTTP, metadata and locale links: ${canonicalPages.length} sitemap entries`);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of samples) {
      await open(path);
      const measurements = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        headings: document.querySelectorAll('h1').length,
        brokenImages: [...document.images].filter(img => img.getBoundingClientRect().width && img.complete && !img.naturalWidth && img.loading !== 'lazy').map(img => img.src),
        contentLength: document.querySelector('main')?.textContent.trim().length ?? 0,
        documentLanguage: document.documentElement.lang,
      }));
      assert.equal(measurements.headings, 1, path);
      assert.ok(measurements.contentLength > 100, path);
      assert.equal(measurements.documentLanguage, path.startsWith('/en/') ? 'en' : 'zh-Hant', path);
      assert.ok(measurements.overflow <= 1, `horizontal overflow ${path} @ ${width}: ${measurements.overflow}px`);
      assert.deepEqual(measurements.brokenImages, [], path);
      snapshots.push({ width, path, ...measurements });
      if (width === 390 && path === '/') await screenshot('home-mobile');
      if (width === 1440 && path === '/') await screenshot('home-desktop');
      if (width === 390 && path === '/en/contact/') await screenshot('contact-mobile', true);
      if (width === 1440 && path === '/labs/benchmarks/') await screenshot('benchmarks-desktop');
    }
  }
  console.log(`Responsive layout at ${widths.join(', ')} px: ${snapshots.length} checks`);

  for (const path of ['/', '/en/']) {
    await open(path);
    const brand = page.locator('#brand');
    assert.equal(await brand.getByRole('heading').textContent(), 'Quantify to Conquer.');
    assert.equal(await brand.locator('p.topic-lead').last().textContent(), path === '/en/'
      ? 'Research-Driven Deep-Tech Engineering Studio'
      : '研究驅動的深科技工程工作室');
    assert.match(await page.locator('meta[property="og:title"]').getAttribute('content'), /Quantify to Conquer\.$/);
    assert.ok(await brand.evaluate(section => section.offsetTop >= document.querySelector('#top').offsetHeight));
    assert.equal(await page.locator('#core-solutions li h3 a').count(), 4);
    assert.equal(await page.locator('#core-solutions li .text-link').count(), 4);
    assert.equal(await page.locator('#featured .home-case:visible').count(), portfolio.featured.length);
    assert.ok(await page.locator('#featured').evaluate(section =>
      section.compareDocumentPosition(document.getElementById('core-solutions')) & Node.DOCUMENT_POSITION_FOLLOWING));
    const cards = page.locator('#featured .home-case');
    for (const [index, card] of (await cards.all()).entries()) {
      const project = portfolio.featured[index];
      const picture = card.locator('figure.home-case-image img');
      assert.equal(await picture.getAttribute('src'), `/assets/${projectMedia.get(project)}.webp`);
      assert.equal(await picture.getAttribute('loading'), 'lazy');
      await picture.scrollIntoViewIfNeeded();
      await picture.evaluate(img => img.decode());
      assert.ok(await picture.evaluate(img => img.alt.trim() && img.naturalWidth > 0 && img.naturalHeight > 0));
      assert.equal(await card.locator('h3 a').getAttribute('href'), `${path === '/en/' ? '/en' : ''}/work/${project}/`);
    }
    const sectionArtwork = page.locator('.home-section-art img');
    for (const [selector, count] of [
      ['#engineering-evidence', 2], ['#engagements', 4], ['#studio-architecture', 1],
      ['#project-contact', 1], ['.home-directory-head', 1],
    ]) assert.equal(await page.locator(`${selector} .home-section-art img:visible`).count(), count);
    for (const picture of await sectionArtwork.all()) {
      assert.equal(await picture.getAttribute('alt'), '');
      await picture.scrollIntoViewIfNeeded();
      await picture.evaluate(img => img.decode());
      assert.match(await picture.evaluate(img => img.currentSrc), /\/assets\/(labs|svcs|caps)\/[^/]+\.webp$/);
      const frame = await picture.locator('..').boundingBox();
      const artwork = await picture.boundingBox();
      assert.ok(frame && artwork && Math.abs(artwork.width - frame.width * .8) <= 2, 'Homepage illustrations occupy 80% of their frames');
      assert.equal(await picture.evaluate(img => getComputedStyle(img).objectFit), 'contain');
    }
    const engagementImages = page.locator('#engagements .home-section-art');
    for (const figure of await engagementImages.all()) {
      const figureBox = await figure.boundingBox();
      const cardBox = await figure.locator('..').boundingBox();
      assert.ok(figureBox && cardBox && cardBox.width - figureBox.width <= 2, 'An engagement illustration spans its card');
    }
    await page.locator('#themeToggle').click();
    for (const [index, card] of (await cards.all()).entries()) {
      const picture = card.locator('figure.home-case-image img');
      assert.equal(await picture.getAttribute('src'), `/assets/${projectMedia.get(portfolio.featured[index])}-dark.webp`);
      await picture.scrollIntoViewIfNeeded();
      await picture.evaluate(img => img.decode());
      assert.ok(await picture.evaluate(img => img.currentSrc.endsWith('-dark.webp')));
    }
    for (const picture of await sectionArtwork.all()) {
      await picture.scrollIntoViewIfNeeded();
      await picture.evaluate(img => img.decode());
      assert.ok(await picture.evaluate(img => img.currentSrc.endsWith('-dark.webp')));
    }
    await page.locator('#themeToggle').click();
    const archive = page.locator('details[data-home-archive]');
    assert.ok(await archive.count() > 1);
    assert.equal(await page.locator('details[data-home-archive][open]').count(), await archive.count());
    const finder = page.locator('[data-solution-finder]');
    await finder.locator('summary').press('Enter');
    for (const service of ['edge-ai', 'agent', 'gpu-infrastructure', 'research', 'assessment']) {
      await finder.locator('select').selectOption(service);
      const visible = finder.locator('[data-solution-result]:visible');
      assert.equal(await visible.getAttribute('data-solution-result'), service);
      assert.match(await visible.getByRole('link').last().getAttribute('href'), new RegExp(`service=${service}#rfp$`));
    }
  }

  // Desktop and keyboard-driven mobile navigation plus equivalent locales.
  await open('/');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'), '#content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'content');
  await page.locator('#hdr .navlinks a[href="/solutions/"]').click();
  assert.equal(new URL(page.url()).pathname, '/solutions/');
  await page.locator('.studio-header-language').click();
  assert.equal(new URL(page.url()).pathname, '/en/solutions/');
  await page.setViewportSize({ width: 320, height: 568 });
  await open('/');
  for (const path of ['/', '/en/']) {
    assert.equal(new URL(page.url()).pathname, path);
    await page.evaluate(() => document.fonts.ready);
    const canvas = page.locator('#spectrum');
    assert.equal(await canvas.getAttribute('aria-hidden'), 'true');
    await page.waitForFunction(() => {
      const canvas = document.getElementById('spectrum');
      return canvas.getContext('2d').getImageData(0, Math.round(canvas.height * .6), canvas.width, 1).data.some(value => value !== 0);
    });
    const actions = await page.locator('.hero .cta-row').boundingBox();
    assert.ok(actions.y + actions.height <= 568, path);
    await page.locator('#hdr .studio-header-language').click();
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await open('/');
  await page.locator('#burger').press('Enter');
  assert.equal(await page.locator('#burger').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#burger').getAttribute('aria-expanded'), 'false');
  await open('/en/solutions/');
  const menu = page.locator('.studio-mobile-nav summary');
  await menu.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.studio-mobile-nav').getAttribute('open'), '');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.studio-mobile-nav').getAttribute('open'), null);
  assert.ok(await menu.evaluate(node => node === document.activeElement));
  await menu.press('Space');
  await page.locator('.studio-mobile-nav a[href="/en/work/"]').click();
  assert.equal(new URL(page.url()).pathname, '/en/work/');
  await page.locator('input[name=q]').fill('no-such-case-xyz');
  await page.locator('.filter-empty').waitFor({ state: 'visible' });
  await page.locator('[data-reset-work]').click();
  assert.equal(await page.locator('#case-list article:visible').count(), 16);
  await page.locator('input[name=q]').fill('workcell');
  assert.ok(await page.locator('#case-list article:visible').count() < 16);

  for (const path of ['/#work', '/work/', '/en/work/']) {
    await open(path);
    const filter = page.locator('[data-work-filter]');
    const visibleCases = page.locator('#case-list article:visible');
    await filter.locator('[data-filter="health"]').click();
    assert.equal(await visibleCases.count(), 5);
    await filter.locator('[data-filter="industrial"]').click();
    assert.equal(await visibleCases.count(), 0);
    assert.ok(await filter.locator('.filter-empty').isVisible());
    assert.deepEqual(new URL(page.url()).searchParams.getAll('industry'), ['health', 'industrial']);

    await filter.locator('[data-filter="industrial"]').click();
    await filter.locator('[data-filter="science"]').click();
    await filter.locator('select[name=technology]').selectOption('vision');
    await filter.locator('select[name=status]').selectOption('evaluation');
    await filter.locator('select[name=type]').selectOption('anonymous-engineering');
    const en = path.startsWith('/en/');
    await filter.locator('input[name=q]').fill(en ? 'sequencing denoising' : '影像 降噪');
    await page.reload({ waitUntil: 'load' });
    assert.deepEqual(new URL(page.url()).searchParams.getAll('industry'), ['health', 'science']);
    assert.equal(await visibleCases.count(), 1);
    assert.ok(await visibleCases.locator(`a[href="${en ? '/en' : ''}/work/ngs-denoising/"]`).isVisible());
    await filter.locator('input[name=featured]').check();
    assert.equal(await visibleCases.count(), 0);
    await filter.locator('input[name=featured]').uncheck();
    await filter.locator('select[name=status]').selectOption('delivered');
    assert.equal(await visibleCases.count(), 0);
    await filter.locator('[data-reset-work]').click();
    assert.equal(await visibleCases.count(), 16);
    assert.equal(new URL(page.url()).search, '');
  }

  // Public evidence in case heroes and the artwork fallback.
  for (const [locale, width] of [['zh', 390], ['en', 1440]]) {
    await page.setViewportSize({ width, height: 900 });
    const prefix = locale === 'en' ? '/en' : '';
    for (const [slug, visuals] of Object.entries(caseVisuals)) {
      await open(`${prefix}/work/${slug}/`);
      const gallery = page.locator('.topic-hero #case-images');
      const images = gallery.locator('img');
      assert.equal(await images.count(), visuals.length, slug);
      for (const [index, image] of (await images.all()).entries()) {
        const visual = visuals[index];
        const file = visual.files[locale === 'en' ? 1 : 0] ?? visual.files[0];
        assert.equal(await image.getAttribute('src'), file.path);
        assert.equal(await image.locator('..').getAttribute('href'), file.path);
        await image.evaluate(img => img.decode());
        assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight]), [file.width, file.height]);
        if (visual.source) assert.equal(await gallery.locator('figcaption a').last().getAttribute('href'), visual.source[locale === 'en' ? 1 : 0]);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, slug);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await open('/work/surgical-gauze-detection/#english');
  assert.equal(await page.locator('#english').count(), 1);
  assert.equal(await page.locator('#technical-diagram-en').count(), 1);
  assert.equal(await page.locator('main .topic-hero img[src="/assets/cases/surgical-gauze.webp"]').count(), 1);
  assert.ok(await page.locator('a[href="https://link.springer.com/article/10.1007/s10439-022-03033-9"]').count());
  assert.deepEqual(await page.locator('.case-evidence-facts dt').allTextContents(), ['成果歸屬', '專案成熟度', '公開證據分類']);
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await open('/en/work/surgical-gauze-detection/');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await screenshot('case-mobile-dark');
  await page.locator('#themeToggle').click();

  // Real filters and downloaded benchmark artifacts.
  await open('/en/labs/projects/');
  const all = await page.locator('[data-lab-project]:visible').count();
  assert.ok(all >= 10);
  await page.locator('select[name=category]').selectOption('reliability');
  assert.ok(await page.locator('[data-lab-project]:visible').count() < all);
  await page.locator('input[name=query]').fill('no-such-project-xyz');
  await page.locator('[data-lab-empty]').waitFor({ state: 'visible' });
  await page.locator('[data-lab-filters] button[type=reset]').click();
  assert.equal(await page.locator('[data-lab-project]:visible').count(), all);
  await open('/en/labs/benchmarks/');
  assert.ok(await page.locator('table tbody tr').count() >= 10);
  const data = await page.locator('a[download][href$=".json"]').first().getAttribute('href');
  assert.ok((await (await context.request.get(new URL(data, base).href)).body()).length > 200);
  const pdf = await context.request.get(base + '/downloads/quantquer-capabilities-en.pdf');
  assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-');

  for (const [route, selector, value] of [
    ['reliability', '#demo-scenario', 'unavailable'],
    ['knowledge-arbitration', '#demo-query', 'highHeat'],
    ['robot-workcell', '#demo-layout', 'bypass'],
  ]) {
    await open(`/en/labs/demos/${route}/`);
    const panel = page.locator('[data-engineering-demo-report]');
    const before = await panel.textContent();
    await page.locator(selector).selectOption(value);
    await page.waitForFunction(initial => document.querySelector('[data-engineering-demo-report]').textContent !== initial, before);
    if (route === 'robot-workcell') {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-engineering-demo-export]').click()]);
      assert.match(download.suggestedFilename(), /\.dxf$/);
      assert.match(await readFile(await download.path(), 'utf8'), /ENTITIES/);
    }
  }

  await open('/labs/evidence/gpu/?lang=en#policy-simulation');
  const policy = page.locator('#gpu-policy-select');
  await policy.waitFor({ state: 'visible' });
  const earlier = await page.locator('#gpu-policy-rule').textContent();
  for (const strategy of ['priority', 'memory', 'shortest', 'workload']) {
    await policy.selectOption(strategy);
    assert.notEqual(await page.locator('#gpu-policy-rule').textContent(), earlier);
    assert.equal(await page.locator('#gpu-policy-timing tr').count(), 7);
  }
  await open('/labs/evidence/vision/?lang=en#comparison');
  await page.locator('#vision-evidence-scene').selectOption('forest');
  await page.locator('#vision-evidence-method').selectOption('telea');
  await page.waitForFunction(() => document.getElementById('vision-evidence-base').src.endsWith('/forest-telea.webp'));
  assert.match(await page.locator('#deployment').textContent(), /NPU/);
  await open('/labs/evidence/photonics/?lang=en');
  const result = page.locator('#mesh-summary');
  const withFault = await result.textContent();
  await page.locator('#mesh-fault').uncheck();
  assert.notEqual(await result.textContent(), withFault);
  await page.locator('#mesh-reset').click();
  await page.waitForFunction(expected => document.getElementById('mesh-summary').textContent === expected, withFault);

  await open('/labs/interactive/?lang=en#generative-vision');
  const visionSummary = page.locator('#vision-result');
  const defaultPadding = await visionSummary.textContent();
  await page.locator('#vision-mask').selectOption('18');
  assert.notEqual(await visionSummary.textContent(), defaultPadding);
  await page.locator('#photon-fault-enabled').uncheck();
  assert.ok((await page.locator('#photon-result').textContent()).trim());
  await page.locator('#gpu-policy').selectOption('fifo');
  await page.locator('#gpu-step').press('Enter');
  assert.notEqual(await page.locator('#gpu-time').inputValue(), '-1');
  await page.locator('#gpu-reset').click();
  assert.equal(await page.locator('#gpu-time').inputValue(), '-1');

  await open('/en/capabilities/');
  assert.ok(await page.locator('a[download][href="/downloads/quantquer-capabilities-en.pdf"]').first().isVisible());

  // Production-configured fallback never calls a backend. No real email is opened.
  await open('/en/contact/?service=gpu-infrastructure');
  assert.equal(await page.locator('#inquiry-projectType').inputValue(), 'gpu-infrastructure');
  assert.equal(await page.locator('#contact-submit').isVisible(), false);
  assert.ok(await page.locator('#contact-quick').isVisible());
  assert.equal(await page.locator('#quick-submit').textContent(), 'Open email draft');
  assert.equal(await page.locator('#quick-inquiry [required]').count(), 3);
  await page.locator('#quick-submit').click();
  assert.equal(await page.locator('#quick-name').getAttribute('aria-invalid'), 'true');
  assert.ok(await page.locator('#quick-name').evaluate(node => node === document.activeElement));
  for (const [key, value] of Object.entries({
    name: 'Synthetic Tester', email: 'tester@example.com', challenge: 'A short technical question.',
  })) await page.locator(`#quick-${key}`).fill(value);
  await page.locator('#quick-copy').click();
  await page.waitForFunction(() => /copied|manually/i.test(document.getElementById('quick-status').textContent));
  await page.locator('#quick-challenge').fill('Synthetic longer input for testing. '.repeat(49));
  await page.locator('#quick-submit').click();
  assert.ok(await page.locator('#quick-brief').isVisible());
  assert.match(await page.locator('#quick-brief').inputValue(), /Synthetic longer input/);
  assert.match(await page.locator('#contact-direct-email').getAttribute('href'), /^mailto:/);
  assert.ok(await page.locator('#inquiry-hardware').isVisible());
  assert.ok(await page.locator('#inquiry-nda').isVisible());
  await page.locator('#contact-copy').click();
  assert.equal(await page.locator('#inquiry-name').getAttribute('aria-invalid'), 'true');
  assert.match(await page.locator('#contact-summary').textContent(), /highlighted/);
  for (const [name, value] of Object.entries({
    name: 'Synthetic Tester', company: 'Example Company', email: 'tester@example.com', challenge: 'Scope a synthetic benchmark.',
  })) await page.locator(`#inquiry-${name}`).fill(value);
  await page.locator('#contact-copy').click();
  await page.waitForFunction(() => /copied|manually/i.test(document.querySelector('#contact-status').textContent));

  await page.locator('#inquiry-challenge').fill('Synthetic longer input for testing. '.repeat(52));
  await page.locator('#contact-draft').click();
  assert.ok(await page.locator('#contact-brief').isVisible());
  assert.match(await page.locator('#contact-brief').inputValue(), /Synthetic longer input/);

  // Simulate enabling a same-origin adapter in this context only.
  await page.route('**/assets/studio-integrations.mjs', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export const inquiryPath = "/api/inquiry"; export const analyticsPath = ""; export const bookingUrl = "https://example.invalid/appointment";',
  }));
  let attempts = 0;
  let previousId;
  await page.route('**/api/inquiry', route => {
    const payload = route.request().postDataJSON();
    assert.equal(payload.values.email, 'tester@example.com');
    assert.equal(payload.website, '');
    if (payload.mode === 'quick') {
      assert.deepEqual(Object.keys(payload.values), ['name', 'email', 'challenge']);
      return route.fulfill({ status: 200, json: { ok: true, receipt: 'quick-test-receipt' } });
    }
    assert.equal(payload.mode, 'full');
    if (previousId) assert.equal(payload.requestId, previousId);
    previousId = payload.requestId;
    attempts++;
    return route.fulfill({ status: attempts === 1 ? 502 : 200, json: attempts === 1 ? { ok: false } : { ok: true, receipt: 'playwright-receipt' } });
  });
  await open('/en/contact/?service=edge-ai');
  for (const [name, value] of Object.entries({
    name: 'Synthetic Tester', company: 'Example Company', email: 'tester@example.com', challenge: 'Scope a synthetic benchmark.',
  })) await page.locator(`#inquiry-${name}`).fill(value);
  await page.locator('#contact-submit').click();
  await page.waitForFunction(() => /could not be confirmed/.test(document.querySelector('#contact-status').textContent));
  await page.locator('#contact-submit').click();
  await page.waitForFunction(() => /playwright-receipt/.test(document.querySelector('#contact-status').textContent));
  assert.equal(attempts, 2);
  assert.equal(await page.locator('#inquiry-email').inputValue(), '');
  assert.ok(await page.locator('a[href="https://example.invalid/appointment"]').isVisible());
  await page.locator('#quick-submit').click();
  assert.equal(await page.locator('#quick-name').getAttribute('aria-invalid'), 'true');
  for (const [name, value] of Object.entries({
    name: 'Synthetic Tester', email: 'tester@example.com', challenge: 'A short technical question.',
  })) await page.locator(`#quick-${name}`).fill(value);
  await page.locator('#quick-submit').click();
  await page.waitForFunction(() => /quick-test-receipt/.test(document.getElementById('quick-status').textContent));

  const preserved = [
    '/#capabilities', '/#contact', '/#partners', '/#showreel', '/semiconductor-ai/#english',
    '/financial-intelligence/#english', '/labs/interactive/#gpu-orchestration', '/labs/evidence/vision/#benchmark',
    '/labs/evidence/gpu/', '/project-planner/?service=edge-ai&lang=en',
  ];
  for (const path of preserved) {
    await open(path);
    const anchor = new URL(path, base).hash.slice(1);
    if (anchor) assert.equal(await page.locator(`[id="${anchor}"]`).count(), 1, path);
    if (path.startsWith('/#')) assert.ok(await page.locator(`#${anchor}`).isVisible(), path);
  }
  for (const [route, language] of [['/#showreel', 'zh-Hant'], ['/en/#showreel', 'en']]) {
    await open(route);
    const showreel = page.locator('#showreel');
    assert.ok(await showreel.evaluate(section =>
      (document.getElementById('featured').compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      (section.compareDocumentPosition(document.getElementById('core-solutions')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    assert.equal(await showreel.locator('video').count(), 0);
    await showreel.locator('[data-showreel-play]').press('Enter');
    const movie = showreel.locator('video');
    await movie.waitFor({ state: 'visible' });
    assert.equal(await movie.locator('track').count(), 2);
    assert.equal(await movie.locator('track[default]').getAttribute('srclang'), language);
    assert.ok(await movie.evaluate(video => video.controls && video.playsInline));
    await page.waitForFunction(() => document.querySelector('#showreel video').readyState >= 2);
    assert.ok(await movie.evaluate(video => Math.abs(video.duration - 39) <= .1));
    await movie.evaluate(video => video.pause());
    assert.equal(await movie.evaluate(video => video.paused), true);
  }

  await open('/#research-quantum');
  assert.ok(await page.locator('#research-quantum').isVisible());
  const directory = page.locator('.home-archive-directory');
  const cases = directory.locator('.home-archive-item').filter({ has: page.locator('#work') });
  await cases.locator(':scope > summary').press('Enter');
  assert.equal(await page.locator('#work').isVisible(), false);
  await directory.locator(':scope > summary').press('Enter');
  assert.equal(await directory.locator('.home-directory-expand').isVisible(), true);
  await page.evaluate(() => { location.hash = 'work'; });
  await page.locator('#work').waitFor({ state: 'visible' });
  assert.equal(await directory.locator('.home-directory-collapse').isVisible(), true);
  await open('/#edge-ai-deployment');
  assert.ok(await page.locator('#edge-ai-deployment').isVisible());
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticHome = await staticContext.newPage();
    await staticHome.goto(base + '/');
    assert.equal(await staticHome.locator('#featured .home-case:visible').count(), portfolio.featured.length);
    assert.equal(await staticHome.locator('[data-solution-finder]').isVisible(), false);
    const archiveEntries = staticHome.locator('details[data-home-archive]');
    assert.equal(await staticHome.locator('details[data-home-archive][open]').count(), await archiveEntries.count());
    assert.equal(await staticHome.locator('#case-list article:visible').count(), 16);
    await staticHome.locator('.home-archive-directory > summary').click();
    assert.equal(await staticHome.locator('#work').isVisible(), false);
    await staticHome.locator('.home-archive-directory > summary').click();
    assert.equal(await staticHome.locator('#case-list article:visible').count(), 16);
    await staticHome.goto(base + '/contact/');
    assert.ok(await staticHome.locator('#contact-direct-email').isVisible());
    assert.equal(await staticHome.locator('#contact-quick').isVisible(), false);
  } finally {
    await staticContext.close();
  }
  const missing = await page.goto(base + '/this-route-should-not-exist/');
  assert.equal(missing.status(), 404);
  assert.ok(await page.locator('meta[name="robots"][content="noindex"]').count());
  assert.equal(await page.locator('.nf-art').count(), 1);
  assert.deepEqual([...defects], []);
  await writeFile(resolve(out, 'layout.json'), JSON.stringify(snapshots, null, 2));
  console.log('PASS brand copy, homepage section and case illustrations in both themes, case evidence visuals, navigation, language, AND case filters, Labs filters, 3 new demos, 5 GPU strategies, vision controls, DXF, benchmark and PDF downloads, video controls, form fallback and mocked retry, 10 preserved URLs, expanded directories, custom 404 and browser errors');
} finally {
  await browser.close();
}
