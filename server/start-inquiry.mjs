import { createServer } from 'node:http';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { createInquiryHandler, webhookDelivery } from './inquiry.mjs';

const {
  QUANTQUER_PUBLIC_ORIGIN: origin,
  QUANTQUER_INQUIRY_TRANSPORT_URL: url,
  QUANTQUER_INQUIRY_TRANSPORT_TOKEN: token,
  QUANTQUER_INQUIRY_PORT: port = '8092',
} = process.env;
if (!origin || new URL(origin).origin !== origin || new URL(origin).protocol !== 'https:') {
  throw new Error('QUANTQUER_PUBLIC_ORIGIN must be an HTTPS origin without a trailing slash');
}
const handler = createInquiryHandler({ origin, deliver: webhookDelivery({ url, token }) });
const server = createServer(async (request, response) => {
  if (request.url !== '/api/inquiry') {
    response.writeHead(404).end();
    return;
  }
  // Bind to loopback. The reverse proxy overwrites this header with its observed client IP.
  const clientKey = request.headers['x-quantquer-client-ip'];
  if (typeof clientKey !== 'string' || !isIP(clientKey)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const result = await handler(new Request(origin + '/api/inquiry', {
      method: request.method, headers: request.headers, ...(hasBody ? { body: Readable.toWeb(request), duplex: 'half' } : {}),
    }), clientKey);
    response.writeHead(result.status, Object.fromEntries(result.headers)).end(await result.text());
  } catch {
    response.writeHead(400).end();
  }
});
server.requestTimeout = 15_000;
server.listen(Number(port), '127.0.0.1');
