import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contactBrief, validateContact } from '../assets/contact-model.mjs';
import { createInquiryHandler, webhookDelivery } from '../server/inquiry.mjs';
import { makeEvent } from '../assets/analytics.mjs';

const origin = 'https://quantquer.com';
const values = { name: 'Test User', company: 'Example', email: 'engineer@example.com', projectType: 'edge-ai', challenge: 'Characterize runtime support.' };
const payload = { requestId: '91c2a554-35fa-4f31-875b-098ee0a9e112', values, website: '', locale: 'en' };
const request = (body = payload, { source = origin, type = 'application/json' } = {}) => new Request(origin + '/api/inquiry', {
  method: 'POST', headers: { origin: source, 'content-type': type }, body: JSON.stringify(body),
});

test('validates the bilingual contact brief and ignores unexpected fields', () => {
  assert.deepEqual(validateContact({ ...values, name: ' Test User ' }).errors, {});
  assert.deepEqual(validateContact({ ...values, name: ' ', email: 'a@example', projectType: 'constructor', notes: 'a'.repeat(1801) }).errors, {
    name: 'required', email: 'email', projectType: 'invalid', notes: 'length',
  });
  const result = validateContact({ ...values, privateField: 'ignored' });
  assert.ok(contactBrief(result.values, 'zh').includes('專案類型: 晶片端 AI'));
  assert.ok(contactBrief(result.values, 'en').includes('Project type: Edge AI'));
  assert.ok(!contactBrief(result.values, 'en').includes('ignored'));
});

test('rejects invalid origins, methods, spam, body size, and bad fields before delivery', async () => {
  const handler = createInquiryHandler({ origin, deliver: () => assert.fail('Delivery should not run') });
  assert.equal((await handler(request(payload, { source: 'https://other.example' }), 'client')).status, 403);
  assert.equal((await handler(new Request(origin + '/api/inquiry'), 'client')).status, 405);
  assert.equal((await handler(request(payload, { type: 'text/plain' }), 'client')).status, 415);
  assert.equal((await handler(request({ ...payload, website: 'spam' }), 'client')).status, 400);
  assert.equal((await handler(request({ ...payload, values: { ...values, notes: 'a'.repeat(32768) } }), 'client')).status, 413);
  assert.equal((await handler(request({ ...payload, values: { ...values, email: 'bad' } }), 'client')).status, 422);
});

test('deduplicates concurrent retries, rejects changed payloads and enforces rate limits', async () => {
  let calls = 0;
  let time = 0;
  const handler = createInquiryHandler({ origin, clock: () => time, deliver: ({ replyTo, requestId }) => {
    assert.equal(replyTo, values.email);
    assert.equal(requestId, payload.requestId);
    calls++;
    return 'test-receipt';
  } });
  const first = await Promise.all([handler(request(), 'client'), handler(request(), 'client')]);
  for (const response of first) assert.deepEqual(await response.json(), { ok: true, receipt: 'test-receipt' });
  assert.equal(calls, 1);
  assert.equal((await handler(request({ ...payload, values: { ...values, name: 'Different' } }), 'client')).status, 409);
  for (let i = 0; i < 5; i++) assert.equal((await handler(request(), 'client')).status, 200);
  assert.equal((await handler(request(), 'client')).status, 429);
  time += 15 * 60 * 1000 + 1;
  assert.equal((await handler(request(), 'client')).status, 200);
  assert.equal(calls, 2);
});

test('accepts an explicit quick inquiry without weakening full brief validation', async () => {
  let delivery;
  const handler = createInquiryHandler({ origin, deliver: input => { delivery = input; return 'quick-receipt'; } });
  const { name, email, challenge } = values;
  const minimal = { ...payload, values: { name, email, challenge } };
  assert.equal((await handler(request(minimal), 'client')).status, 422);
  assert.equal((await handler(request({ ...minimal, mode: 'unexpected' }), 'client')).status, 400);
  const response = await handler(request({ ...minimal, mode: 'quick' }), 'client');
  assert.deepEqual(await response.json(), { ok: true, receipt: 'quick-receipt' });
  assert.equal(delivery.replyTo, email);
  assert.match(delivery.brief, /Technical challenge: Characterize runtime support/);
  assert.equal((await handler(request({ ...minimal, mode: 'quick', values: { ...minimal.values, email: 'bad' } }), 'client')).status, 422);
});

test('a failed delivery can be retried and never returns a fake receipt', async () => {
  let calls = 0;
  const handler = createInquiryHandler({ origin, deliver: () => ++calls === 1 ? null : 'test-retry' });
  assert.equal((await handler(request(), 'client')).status, 502);
  assert.deepEqual(await (await handler(request(), 'client')).json(), { ok: true, receipt: 'test-retry' });
  const transport = webhookDelivery({ url: 'https://transport.example/api', token: 'test-token' }, async (url, options) => {
    assert.equal(url, 'https://transport.example/api');
    assert.equal(options.headers['Idempotency-Key'], payload.requestId);
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ ok: true }) };
  });
  await assert.rejects(transport({ requestId: payload.requestId }), /Unconfirmed transport/);
});

test('analytics event IDs are allowlisted and the contact event excludes form content', () => {
  assert.deepEqual(makeEvent('solution_viewed', { solution: 'ai-reliability', name: 'Private' }, 'en'), { event: 'solution_viewed', locale: 'en', solution: 'ai-reliability' });
  assert.deepEqual(makeEvent('demo_interacted', { demo: 'robot-workcell' }, 'en'), { event: 'demo_interacted', locale: 'en', demo: 'robot-workcell' });
  assert.deepEqual(makeEvent('inquiry_submitted', { email: values.email, brief: values.challenge }), { event: 'inquiry_submitted', locale: 'zh-Hant' });
  assert.deepEqual(makeEvent('solution_finder_used', { service: 'assessment', email: values.email }), { event: 'solution_finder_used', locale: 'zh-Hant', service: 'assessment' });
});
