import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { summarizeNpuCapture } from './vision-npu.mjs';

// Validator behavior only. This synthetic profiler fixture is not a device result.
const report = Buffer.from('validator fixture only');
const hash = createHash('sha256').update(report).digest('hex');
const capture = {
  date: '2026-11-27', os: 'Fixture OS',
  hardware: { device: 'Fixture hardware', soc: 'Fixture SoC', accelerator: 'Fixture NPU' },
  runtime: { name: 'Fixture Runtime', version: 'fixture version', provider: 'Fixture NPU provider' },
  model: { name: 'Fixture model', sha256: hash, precision: 'int8' },
  fixture: { sha256: hash, width: 768, height: 512 },
  measurement: { scope: 'prepared-input-to-rgb', batch: 1, warmups: 5, samplesMs: [9, 3, 7, 5], peakMemoryMiB: null, memoryScope: 'unavailable in fixture' },
  quality: { maskedPsnrDb: 17, referenceSha256: hash },
  placement: { npu: 3, cpu: 0, gpu: 0, unknown: 0, sha256: hash },
};

test('summarizes known operator placement and calculates p50/p95 from raw samples', () => {
  const summary = summarizeNpuCapture(capture, report);
  assert.equal(summary.status, 'prepared-capture-awaiting-review');
  assert.equal(summary.execution, 'npu-operator-placement');
  assert.equal(summary.measurement.p50Ms, 6);
  assert.equal(summary.measurement.p95Ms, 8.7);
  assert.equal(summary.measurement.sampleCount, 4);
  assert.equal(summary.measurement.peakMemoryMiB, null);
  assert.deepEqual(capture.measurement.samplesMs, [9, 3, 7, 5]);
});

test('keeps CPU/GPU fallback visible and rejects unresolved or empty placement', () => {
  const fallback = { ...capture, placement: { ...capture.placement, cpu: 2, gpu: 1 } };
  assert.equal(summarizeNpuCapture(fallback, report).execution, 'hybrid-with-npu');
  assert.throws(() => summarizeNpuCapture({ ...capture, placement: { ...capture.placement, unknown: 1 } }, report), /resolved placement/);
  assert.throws(() => summarizeNpuCapture({ ...capture, placement: { ...capture.placement, npu: 0 } }, report), /resolved placement/);
  assert.throws(() => summarizeNpuCapture({ ...capture, runtime: { ...capture.runtime, provider: 'CPUExecutionProvider' } }, report), /NPU-capable/);
});

test('requires an actual matching report and validates device, model and latency inputs', () => {
  assert.throws(() => summarizeNpuCapture(capture, null), /placement report/);
  assert.throws(() => summarizeNpuCapture(capture, Buffer.from('different')), /SHA-256/);
  assert.throws(() => summarizeNpuCapture({ ...capture, hardware: undefined }, report), /hardware/);
  assert.throws(() => summarizeNpuCapture({ ...capture, model: { ...capture.model, precision: 'unknown' } }, report), /model artifact/);
  assert.throws(() => summarizeNpuCapture({ ...capture, fixture: { ...capture.fixture, width: 0 } }, report), /fixture/);
  assert.throws(() => summarizeNpuCapture({ ...capture, date: '2026-02-31' }, report), /date/);
  assert.throws(() => summarizeNpuCapture({ ...capture, measurement: { ...capture.measurement, samplesMs: [] } }, report), /latency samples/);
  const oneSample = { ...capture, measurement: { ...capture.measurement, samplesMs: [3] } };
  assert.equal(summarizeNpuCapture(oneSample, report).measurement.p95Ms, null);
});

test('visible CPU trade-offs reproduce the archived per-scene differences', () => {
  const raw = JSON.parse(readFileSync(new URL('../../assets/evidence/vision/benchmark.json', import.meta.url), 'utf8'));
  const html = readFileSync(new URL('../../labs/evidence/vision/index.html', import.meta.url), 'utf8');
  const change = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
  for (const { migan, telea } of Object.values(raw.scenes)) {
    assert.ok(html.includes(`<td>${change(migan.medianMs - telea.medianMs)}</td><td>${change(migan.psnrDb - telea.psnrDb)}</td>`));
  }
});
