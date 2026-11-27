import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
  const widths = [360, 390, 768, 1024, 1440];
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

  // Desktop and keyboard-driven mobile navigation plus equivalent locales.
  await open('/');
  await page.locator('#hdr .navlinks a[href="/solutions/"]').click();
  assert.equal(new URL(page.url()).pathname, '/solutions/');
  await page.locator('.studio-header-language').click();
  assert.equal(new URL(page.url()).pathname, '/en/solutions/');
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
  await open('/work/surgical-gauze-detection/#english');
  assert.equal(await page.locator('#english').count(), 1);
  assert.equal(await page.locator('#technical-diagram-en').count(), 1);
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
  await open('/en/capabilities/');
  assert.ok(await page.locator('a[download][href="/downloads/quantquer-capabilities-en.pdf"]').first().isVisible());

  // Production-configured fallback never calls a backend. No real email is opened.
  await open('/en/contact/?service=gpu-infrastructure');
  assert.equal(await page.locator('#inquiry-projectType').inputValue(), 'gpu-infrastructure');
  assert.equal(await page.locator('#contact-submit').isVisible(), false);
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
    body: 'export const inquiryPath = "/api/inquiry"; export const analyticsPath = ""; export const bookingUrl = "";',
  }));
  let attempts = 0;
  let previousId;
  await page.route('**/api/inquiry', route => {
    const payload = route.request().postDataJSON();
    assert.equal(payload.values.email, 'tester@example.com');
    assert.equal(payload.website, '');
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

  const preserved = [
    '/#capabilities', '/#contact', '/#partners', '/#showreel', '/semiconductor-ai/#english',
    '/financial-intelligence/#english', '/labs/interactive/#gpu-orchestration', '/labs/evidence/vision/#benchmark',
    '/labs/evidence/gpu/', '/project-planner/?service=edge-ai&lang=en',
  ];
  for (const path of preserved) {
    await open(path);
    const anchor = new URL(path, base).hash.slice(1);
    if (anchor) assert.equal(await page.locator(`[id="${anchor}"]`).count(), 1, path);
  }
  const missing = await page.goto(base + '/this-route-should-not-exist/');
  assert.equal(missing.status(), 404);
  assert.ok(await page.locator('meta[name="robots"][content="noindex"]').count());
  assert.equal(await page.locator('.nf-art').count(), 1);
  assert.deepEqual([...defects], []);
  await writeFile(resolve(out, 'layout.json'), JSON.stringify(snapshots, null, 2));
  console.log('PASS navigation, language, theme, filters, 3 new demos, 5 GPU strategies, vision controls, DXF, benchmark and PDF downloads, form fallback and mocked retry, 10 preserved URLs, custom 404 and browser errors');
} finally {
  await browser.close();
}
