import { createHash } from 'node:crypto';
import { contactBrief, validateContact } from '../assets/contact-model.mjs';

const bodyLimit = 32768;
const windowMs = 15 * 60 * 1000;
const rate = 8;
const reply = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function readJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body');
  let size = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > bodyLimit) {
      await reader.cancel();
      throw new RangeError('Request body is too large');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

// The host supplies a trusted connection key and same-origin routing to this handler.
export function createInquiryHandler({ origin, deliver, clock = Date.now }) {
  const attempts = new Map();
  const receipts = new Map();
  let sweepAt = 0;
  return async function handle(request, clientKey) {
    if (request.method !== 'POST') return reply(405, { ok: false });
    if (request.headers.get('origin') !== origin || !clientKey) return reply(403, { ok: false });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return reply(415, { ok: false });
    if (Number(request.headers.get('content-length')) > bodyLimit) return reply(413, { ok: false });
    const now = clock();
    if (now >= sweepAt) {
      for (const table of [attempts, receipts]) for (const [key, entry] of table) if (entry.until <= now) table.delete(key);
      sweepAt = now + 60_000;
    }
    const limit = attempts.get(clientKey);
    if ((!limit && attempts.size >= 4096) || (limit?.until > now && limit.count >= rate)) return reply(429, { ok: false });
    attempts.set(clientKey, limit?.until > now ? { ...limit, count: limit.count + 1 } : { until: now + windowMs, count: 1 });
    let input;
    try { input = await readJson(request); } catch (error) { return reply(error instanceof RangeError ? 413 : 400, { ok: false }); }
    if (!input || typeof input !== 'object' || input.website !== '' || !['en', 'zh'].includes(input.locale) || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(input.requestId ?? '') || !input.values || typeof input.values !== 'object' || Array.isArray(input.values)) {
      return reply(400, { ok: false });
    }
    const { values, errors } = validateContact(input.values);
    if (Object.keys(errors).length) return reply(422, { ok: false, errors });
    const fingerprint = createHash('sha256').update(JSON.stringify({ values, locale: input.locale })).digest('hex');
    let saved = receipts.get(input.requestId);
    if (saved?.until <= now) saved = undefined;
    if (saved && saved.fingerprint !== fingerprint) return reply(409, { ok: false });
    if (!saved) {
      if (receipts.size >= 4096) return reply(429, { ok: false });
      const job = Promise.resolve().then(() => deliver({ replyTo: values.email, brief: contactBrief(values, input.locale), requestId: input.requestId }));
      saved = { until: now + windowMs, fingerprint, job };
      receipts.set(input.requestId, saved);
    }
    try {
      const receipt = await saved.job;
      if (!/^[\w-]{1,64}$/.test(receipt ?? '')) throw new Error('Unconfirmed transport');
      return reply(200, { ok: true, receipt });
    } catch {
      if (receipts.get(input.requestId) === saved) receipts.delete(input.requestId);
      return reply(502, { ok: false });
    }
  };
}

export function webhookDelivery({ url, token }, send = fetch) {
  if (!url || new URL(url).protocol !== 'https:' || !token) throw new Error('Inquiry transport requires an approved HTTPS URL and token');
  return async inquiry => {
    const response = await send(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(9000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': inquiry.requestId },
      body: JSON.stringify(inquiry),
    });
    if (!response.ok) throw new Error('Inquiry transport failed');
    const result = await response.json();
    if (result.ok !== true || !/^[\w-]{1,64}$/.test(result.receipt ?? '')) throw new Error('Unconfirmed transport');
    return result.receipt;
  };
}
