const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const textEncoder = new TextEncoder();

const parseAllowedOrigins = (value) => {
  if (!value) {
    return new Set();
  }
  return new Set(
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
};

const resolveCorsOrigin = (requestOrigin, allowedOrigins, fallbackOrigin) => {
  if (requestOrigin) {
    return allowedOrigins.has(requestOrigin) ? requestOrigin : null;
  }
  return fallbackOrigin || null;
};

const buildCorsHeaders = (origin) => {
  const headers = new Headers();
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Gateway-Token, X-Payload-Hash, X-Api-Token'
  );
  headers.set('Access-Control-Max-Age', '600');
  headers.set('Access-Control-Expose-Headers', 'Content-Type, Content-Length, X-Request-Id');
  return headers;
};

const applySecurityHeaders = (headers) => {
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';");
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store');
  }
};

const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const verifyPayloadIntegrity = async (body, secret, expectedHash) => {
  if (!secret || !expectedHash) {
    return true;
  }
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body || ''));
  const digest = toHex(signature);
  return timingSafeEqual(digest, expectedHash.toLowerCase());
};

const sanitizeHeaders = (headers, hasBody) => {
  const result = new Headers();
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }
    if (lowerKey === 'content-length') {
      return;
    }
    if (!hasBody && lowerKey === 'content-type') {
      return;
    }
    if (lowerKey === 'origin' || lowerKey === 'referer') {
      return;
    }
    result.set(key, value);
  });
  return result;
};

const forwardRequest = async (request, env, body, hasBody, requestId) => {
  if (!env.FORWARDER_BASE) {
    throw new Error('FORWARDER_BASE is not configured');
  }
  const incomingUrl = new URL(request.url);
  const target = new URL(incomingUrl.pathname + incomingUrl.search, env.FORWARDER_BASE);
  const forwardHeaders = sanitizeHeaders(request.headers, hasBody);
  if (env.API_TOKEN) {
    forwardHeaders.set('Authorization', `Bearer ${env.API_TOKEN}`);
  }
  if (env.GATEWAY_TOKEN) {
    forwardHeaders.set('X-Gateway-Token', env.GATEWAY_TOKEN);
  }
  if (env.CORS_ORIGIN) {
    forwardHeaders.set('Origin', env.CORS_ORIGIN);
  } else {
    forwardHeaders.delete('Origin');
  }
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) {
    forwardHeaders.set('X-Forwarded-For', clientIp);
  }
  forwardHeaders.set('X-Forwarded-Proto', 'https');
  forwardHeaders.set('X-Request-Id', requestId);
  forwardHeaders.set('Accept-Encoding', 'identity');

  const init = {
    method: request.method,
    headers: forwardHeaders,
    body: hasBody ? body : undefined,
    redirect: 'follow',
  };
  return fetch(target, init);
};

const jsonResponse = (status, payload, baseHeaders, requestId) => {
  const headers = new Headers(baseHeaders);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Request-Id', requestId);
  applySecurityHeaders(headers);
  return new Response(JSON.stringify(payload), { status, headers });
};

export default {
  async fetch(request, env) {
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const fallbackOrigin = env.CORS_ORIGIN || [...allowedOrigins][0] || '';
    const originHeader = request.headers.get('Origin') || '';
    const corsOrigin = resolveCorsOrigin(originHeader, allowedOrigins, fallbackOrigin);
    const requestId = crypto.randomUUID();

    if (originHeader && !corsOrigin) {
      return jsonResponse(403, { error: 'Origin not allowed' }, { Vary: 'Origin' }, requestId);
    }

    const corsHeaders = buildCorsHeaders(corsOrigin);
    corsHeaders.set('X-Request-Id', requestId);

    if (request.method === 'OPTIONS') {
      applySecurityHeaders(corsHeaders);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/healthz') {
      return jsonResponse(
        200,
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
        },
        corsHeaders,
        requestId
      );
    }

    const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
    const cloned = hasBody ? request.clone() : null;
    const bodyText = hasBody && cloned ? await cloned.text() : null;

    const payloadHash = request.headers.get('X-Payload-Hash');
    const validSignature = await verifyPayloadIntegrity(bodyText, env.ENCRYPTION_SECRET, payloadHash);
    if (!validSignature) {
      return jsonResponse(401, { error: 'Invalid payload signature' }, corsHeaders, requestId);
    }

    try {
      const upstream = await forwardRequest(request, env, bodyText, hasBody, requestId);
      const responseHeaders = new Headers(upstream.headers);
      corsHeaders.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
      applySecurityHeaders(responseHeaders);
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return jsonResponse(502, { error: 'Upstream request failed', message: error.message }, corsHeaders, requestId);
    }
  },
};
