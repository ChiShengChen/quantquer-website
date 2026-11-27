import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createBrief, initialService, requirementFields } from '../assets/planner-model.mjs';
import { inquiryEndpoint, submitInquiry } from '../assets/inquiry.mjs';
import { makeEvent } from '../assets/analytics.mjs';
import { checkedTrace, jobState, latestAt } from '../assets/evidence/gpu/trace-model.mjs';

test('service prefills and objective defaults use only defined service IDs', () => {
  assert.equal(initialService('gpu-infrastructure', 'deploy'), 'gpu-infrastructure');
  assert.equal(initialService('https://example.com', 'deploy'), 'edge-ai');
  assert.equal(initialService(undefined, '__proto__'), 'domain-rd');
  assert.ok(requirementFields('edge-ai').fps);
  assert.ok(requirementFields('gpu-infrastructure').users);
  assert.ok(requirementFields('agent').review);
  assert.ok(requirementFields('research').reproducibility);
});

test('planner preserves supplied information and flags regulated deployments', () => {
  const brief = createBrief({
    service: 'generative-vision', industry: 'semiconductor', objective: 'deploy',
    description: '  Deploy a model  ', readiness: 'regulated',
    deliverables: ['production', 'source', 'source', 'unknown'],
    constraints: { nda: 'required' }, tech: { backend: 'NPU', hardware: 'Prototype', review: 'hidden' },
  }, 'en');
  assert.equal(brief.complexity, 'High');
  assert.equal(brief.score, 4);
  assert.equal(brief.description, 'Deploy a model');
  assert.deepEqual(brief.deliverables, ['Production system', 'Source code']);
  assert.deepEqual(brief.tech.map(item => item.answer), ['Prototype', 'NPU']);
  assert.equal(brief.risks.length, 2);
  assert.equal(brief.constraints[0].answer, 'required');
  assert.equal(createBrief({}, 'zh-Hant').complexity, '初步探索');
});

test('analytics keeps allowlisted fields and never copies contact or draft text', () => {
  const event = makeEvent('project_planner_step_completed', {
    step: 3, service: 'research', email: 'test@example.com', name: 'Example', description: 'Private',
  }, 'en');
  assert.deepEqual(event, { event: 'project_planner_step_completed', locale: 'en', step: 3, service: 'research' });
  assert.deepEqual(makeEvent('service_cta_clicked', { project: 'example@example.com', service: 'anything' }), {
    event: 'service_cta_clicked', locale: 'zh-Hant',
  });
  assert.equal(makeEvent('unknown'), null);
  assert.equal(makeEvent('inquiry_started', { channel: 'mailto' }).channel, undefined);
});

test('inquiry requires a same-origin API and an explicit successful receipt', async () => {
  const origin = 'https://quantquer.com';
  assert.equal(inquiryEndpoint('/api/inquiry', origin), origin + '/api/inquiry');
  assert.equal(inquiryEndpoint('//other.test/api/inquiry', origin), null);
  assert.equal(inquiryEndpoint('/api/../outside', origin), null);
  assert.equal(inquiryEndpoint('/api/inquiry?return=//other.test', origin), null);
  assert.equal(inquiryEndpoint('/api/inquiry', 'http://production.test'), null);
  const payload = {
    replyTo: 'person@example.com', brief: 'Synthetic scope',
    requestId: 'd44f30d0-8c88-4db6-9e83-1dcd9378ab54',
  };
  const result = await submitInquiry(origin + '/api/inquiry', payload, async (url, init) => {
    assert.equal(url, origin + '/api/inquiry');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(JSON.parse(init.body), payload);
    return { ok: true, json: async () => ({ ok: true, receipt: 'test-1' }) };
  });
  assert.equal(result, 'test-1');
  await assert.rejects(submitInquiry('/api/inquiry', payload, async () => ({
    ok: true, json: async () => ({ ok: true }),
  })), { message: 'unconfirmed-inquiry' });
  await assert.rejects(submitInquiry('/api/inquiry', { ...payload, brief: 'a'.repeat(7001) }), { message: 'invalid-inquiry' });
});

test('public recorded GPU trace validates jobs, overlap and VRAM order', async () => {
  const input = JSON.parse(await readFile(new URL('../assets/evidence/gpu/trace.json', import.meta.url), 'utf8'));
  const trace = checkedTrace(input);
  const [first, second, cpu] = trace.jobs;
  assert.ok(first.finished <= second.started);
  assert.ok(first.started <= cpu.started && cpu.finished <= first.finished);
  assert.equal(jobState(second, first.started), 'queued');
  assert.equal(jobState(second, second.started), 'running');
  assert.equal(jobState(second, trace.duration), 'done');
  assert.equal(latestAt(trace.samples, 4).usedMiB, 286);
  assert.equal(latestAt(trace.events, trace.duration).id, 'GPU B');
  assert.ok(trace.samples.every(row => row.usedMiB <= row.reservedMiB));
  assert.throws(() => checkedTrace({ ...input, samples: [...input.samples].reverse() }), /Invalid replay data/);
});
