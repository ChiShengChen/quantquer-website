export function inquiryEndpoint(value, origin) {
  if (typeof value !== 'string' || !value.startsWith('/api/') || !/^\/api\/[a-z0-9/-]+$/.test(value)) return null;
  const url = new URL(value, origin);
  return url.origin === origin && (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ? url.href
    : null;
}

export async function submitInquiry(endpoint, { replyTo, brief, requestId }, request = fetch) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo) || replyTo.length > 180) throw new Error('invalid-reply-address');
  if (!brief || brief.length > 7000 || !/^[0-9a-f-]{36}$/.test(requestId)) throw new Error('invalid-inquiry');
  const response = await request(endpoint, {
    method: 'POST',
    redirect: 'error',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({ replyTo, brief, requestId }),
  });
  if (!response.ok) throw new Error('inquiry-rejected');
  const result = await response.json();
  if (result.ok !== true || typeof result.receipt !== 'string' || !/^[\w-]{1,64}$/.test(result.receipt)) {
    throw new Error('unconfirmed-inquiry');
  }
  return result.receipt;
}
