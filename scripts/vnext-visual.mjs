import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.QUANTQUER_PLAYWRIGHT || 'playwright');
const host = process.env.QUANTQUER_PREVIEW ?? 'http://127.0.0.1:8766';
const baseline = process.env.QUANTQUER_BASELINE ?? 'http://127.0.0.1:8767';
const out = resolve(process.env.QUANTQUER_VISUAL_REPORT ?? 'docs/visual-regression');
const viewports = [
  { width: 1440, height: 900 }, { width: 1280, height: 800 },
  { width: 768, height: 1024 }, { width: 390, height: 844 },
];
for (const folder of ['before', 'after', 'comparisons']) await mkdir(resolve(out, folder), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
const report = [];

async function fixedCapture(path, page) {
  const response = await page.goto(path, { waitUntil: 'load' });
  assert.equal(response.status(), 200);
  await page.evaluate(async () => {
    await document.fonts.ready;
    dispatchEvent(new Event('resize'));
  });
  await page.locator('#spectrum').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#spectrum');
    const frame = canvas.getBoundingClientRect();
    return canvas.width === Math.round(frame.width * devicePixelRatio) &&
      canvas.height === Math.round(frame.height * devicePixelRatio);
  });
  const frame = await page.evaluate(() => {
    const style = (selector, properties) => {
      const values = getComputedStyle(document.querySelector(selector));
      return properties.map(property => property.startsWith('--') ? values.getPropertyValue(property) : values[property]);
    };
    const canvas = document.querySelector('#spectrum');
    const heading = document.querySelector('.hero-title');
    const titleLines = Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight));
    const buttonBottom = Math.max(...[...document.querySelectorAll('.hero .cta-row a')].map(link => link.getBoundingClientRect().bottom));
    return {
      canvas: canvas.toDataURL(),
      colors: style('html', ['--bg', '--accent', '--canvas-grid', '--canvas-axis']).map(x => x.trim()),
      hero: style('.hero', ['minHeight', 'alignItems', 'overflow']),
      title: style('.hero-title', ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight']),
      nav: style('#hdr .nav', ['height', 'fontFamily', 'justifyContent']),
      motif: style('#spectrum', ['opacity', 'width', 'height']),
      titleLines,
      caption: document.querySelector('.fig-cap').textContent.trim(),
      articleBelowFold: document.querySelector('#featured').getBoundingClientRect().top >= innerHeight,
      buttonBottom,
    };
  });
  return {
    ...frame, canvas: createHash('sha256').update(frame.canvas).digest('hex'),
    screenshot: await page.screenshot({ animations: 'disabled' }),
  };
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', ignoreHTTPSErrors: true, deviceScaleFactor: 1 });
    const beforePage = await context.newPage();
    const afterPage = await context.newPage();
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark' && ![390, 1440].includes(viewport.width)) continue;
      if (theme === 'dark') {
        await beforePage.locator('#themeToggle').click();
        await afterPage.locator('#themeToggle').click();
      }
      const before = await fixedCapture(baseline + '/', beforePage);
      const after = await fixedCapture(host + '/', afterPage);
      const key = `${viewport.width}x${viewport.height}-${theme}`;
      for (const property of ['canvas', 'colors', 'hero', 'title', 'titleLines', 'nav', 'motif', 'caption']) {
        assert.deepEqual(after[property], before[property], `${property} at ${key}`);
      }
      assert.ok(after.articleBelowFold, key);
      assert.ok(after.buttonBottom <= viewport.height, `CTA below first screen: ${key}`);
      await Promise.all([
        writeFile(resolve(out, 'before', key + '.png'), before.screenshot),
        writeFile(resolve(out, 'after', key + '.png'), after.screenshot),
      ]);
      const comparison = await context.newPage();
      await comparison.setViewportSize({ width: viewport.width * 2, height: viewport.height + 36 });
      await comparison.setContent(`<body style="margin:0;display:flex;background:#101b2a;color:white;font:600 16px system-ui"><figure style="margin:0"><figcaption style="padding:7px 12px">Production baseline</figcaption><img alt="" src="data:image/png;base64,${before.screenshot.toString('base64')}"></figure><figure style="margin:0"><figcaption style="padding:7px 12px">Engineering &amp; Evidence Upgrade</figcaption><img alt="" src="data:image/png;base64,${after.screenshot.toString('base64')}"></figure></body>`);
      await comparison.screenshot({ path: resolve(out, 'comparisons', key + '.png') });
      await comparison.close();
      report.push({ viewport, theme, canvasSha256: after.canvas, titleLines: after.titleLines, primaryActionBottomPx: after.buttonBottom });
    }
    await context.close();
  }

  for (const path of [baseline, host]) {
    const context = await browser.newContext({ viewport: viewports[0], reducedMotion: 'no-preference', ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(path + '/');
    const waveform = page.locator('#spectrum');
    const first = await waveform.evaluate(canvas => canvas.toDataURL());
    await page.waitForFunction(previous => document.getElementById('spectrum').toDataURL() !== previous, first);
    await page.evaluate(() => window.scrollTo({ top: 90, behavior: 'instant' }));
    await page.waitForFunction(() => scrollY >= 80 && document.getElementById('hdr').classList.contains('scrolled'));
    if (path === host) {
      await page.evaluate(() => window.scrollTo({ top: innerHeight + 120, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('#spectrum').getBoundingClientRect().bottom < 0);
      await page.waitForTimeout(130);
      const stopped = await waveform.evaluate(canvas => canvas.toDataURL());
      await page.waitForTimeout(130);
      assert.equal(await waveform.evaluate(canvas => canvas.toDataURL()), stopped);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(previous => document.getElementById('spectrum').toDataURL() !== previous, stopped);
    }
    await context.close();
  }
  await writeFile(resolve(out, 'comparisons', 'waveform-checks.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS ${report.length} protected fixed-frame comparisons, animated frames, theme and scroll behavior`);
} finally {
  await browser.close();
}
