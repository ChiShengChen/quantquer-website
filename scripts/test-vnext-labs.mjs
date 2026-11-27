import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { projectMatches } from '../assets/vnext-labs.mjs';
import { labCategories, labProjects, labMaturity } from '../data/studio-labs.mjs';
import { artifacts, gpu, gpuRows, photonicFixture, quoteGate, resultIndex, vision, visionRows } from '../benchmarks/results.mjs';
import { buildVnextLabs, labsRoutes } from './build-vnext-labs.mjs';

const site = new URL('../', import.meta.url);
const read = path => readFile(new URL(path.slice(1), site), 'utf8');
const readJson = async path => JSON.parse(await read(path));

test('both locales and their result downloads regenerate exactly', async () => {
  await buildVnextLabs({ check: true });
  assert.deepEqual(await readJson('/benchmarks/results/index.json'), resultIndex);
  assert.deepEqual(await readJson(artifacts.photonics), photonicFixture);
  for (const route of labsRoutes) {
    const zh = await read(route + 'index.html');
    const en = await read('/en' + route + 'index.html');
    assert.match(zh, /<html lang="zh-Hant"/);
    assert.match(en, /<html lang="en"/);
    assert.ok(zh.includes('rel="canonical" href="https://quantquer.com' + route + '"'));
    assert.ok(en.includes('rel="canonical" href="https://quantquer.com/en' + route + '"'));
  }
});

test('project catalog is readable before hydration, without an initial false empty state', async () => {
  const ids = new Set(labProjects.map(project => project.id));
  assert.equal(ids.size, labProjects.length);
  for (const project of labProjects) {
    assert.ok(labCategories[project.category]);
    assert.ok(labMaturity[project.maturity]);
    assert.ok(project.offer.startsWith('/solutions/'));
  }
  for (const locale of ['', '/en']) {
    const page = await read(locale + '/labs/projects/index.html');
    assert.equal([...page.matchAll(/ data-lab-project /g)].length, labProjects.length);
    assert.match(page, /data-lab-filters hidden/);
    assert.match(page, /data-lab-empty hidden/);
    assert.doesNotMatch(page, /data-lab-project [^>]+ hidden/);
  }
});

test('project search is bilingual and combines query, maturity, and category', () => {
  const project = { labSearch: '生成式影像 Wide MI-GAN', maturity: 'demo', category: 'applied' };
  const filters = { query: 'ＭＩ－ＧＡＮ 影像', maturity: 'demo', category: 'applied' };
  assert.ok(projectMatches(project, filters));
  assert.ok(projectMatches(project, { query: '', category: '', maturity: '' }));
  assert.ok(!projectMatches(project, { ...filters, maturity: 'open' }));
  assert.ok(!projectMatches(project, { ...filters, category: 'compute' }));
  assert.ok(!projectMatches(project, { ...filters, query: 'unknown' }));
});

test('the summary keeps measured, replayed, and simulated evidence distinct', async () => {
  const schema = await readJson('/benchmarks/schemas/result.schema.json');
  for (const result of resultIndex) {
    assert.ok(schema.required.every(field => Object.hasOwn(result, field)));
    assert.ok(schema.properties.evidenceType.enum.includes(result.evidenceType));
    assert.ok(result.metrics.every(metric => Number.isFinite(metric.value)));
    await read(result.rawArtifactPath);
  }
  assert.deepEqual(resultIndex.map(result => result.evidenceType), ['measured', 'replayed', 'simulated', 'replayed']);
  const en = await read('/en/labs/benchmarks/index.html');
  const zh = await read('/labs/benchmarks/index.html');
  for (const raw of Object.values(artifacts)) {
    assert.ok(zh.includes('href="' + raw + '" download'));
    assert.ok(en.includes('href="' + raw + '" download'));
  }
  assert.equal([...en.matchAll(/<tbody>/g)].length, 4);
  assert.match(en, /Target NPU\/GPU latency, peak memory, power[^.]+are not yet measured/);
  assert.match(zh, /目標 NPU／GPU[^。]+尚未量測/);
});

test('published Vision numbers match all per-scene sample groups and the public trace has no NPU values', () => {
  assert.equal(vision.provider, 'CPUExecutionProvider');
  assert.equal(visionRows.length, 4);
  for (const row of visionRows) {
    assert.equal(row.samplesMs.length, vision.runs);
    const sorted = [...row.samplesMs].sort((first, second) => first - second);
    const median = (sorted[14] + sorted[15]) / 2;
    assert.ok(Math.abs(median - row.medianMs) <= 0.002);
  }
  assert.deepEqual(visionRows.map(row => row.psnrDb), [23.37, 22.75, 13.19, 14.04]);
  assert.equal(resultIndex[0].metrics.length, 12);
  assert.ok(resultIndex.every(result => !result.metrics.some(metric => /npu/i.test(metric.id))));
});

test('controlled GPU replay derives waits, admission order, and overlaps from events', () => {
  assert.equal(gpu.kind, 'recorded-replay');
  assert.deepEqual(gpuRows.map(job => job.queueWait), [0.713, 9.099, 0.632]);
  assert.deepEqual(gpuRows.map(job => job.runDuration), [8.389, 5.361, 5.317]);
  const [a, b, c] = gpuRows;
  assert.ok(a.finished < b.started);
  assert.ok(c.started < a.finished && c.finished > a.started);
  assert.ok(gpuRows.every(job => job.exitCode === 0));
  assert.equal(Math.max(...gpu.samples.map(sample => sample.usedMiB)), a.peakMiB);
  assert.equal(Math.max(...gpu.samples.map(sample => sample.reservedMiB)), a.requestedMiB);
});

test('Paper Evidence records pinned deterministic outcomes', () => {
  const result = resultIndex.find(result => result.project === 'paper-evidence');
  assert.equal(result.gitCommit, quoteGate.commit);
  assert.equal(quoteGate.fuzzyAllowed, false);
  assert.deepEqual(quoteGate.cases.map(item => [item.status, item.passed]), [
    ['EXACT', true], ['NORMALIZED', true], ['NUM_FAIL', false], ['FAIL', false],
  ]);
  assert.deepEqual(result.metrics.map(metric => metric.value), [2, 2]);
});
