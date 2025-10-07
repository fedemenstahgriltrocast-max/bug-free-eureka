import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createServiceWorkerController,
  normalizeAssets,
} from '../src/js/pwa/service-worker-controller.js';

function createFakeResponse(body, { ok = true } = {}) {
  return {
    ok,
    body,
    clone() {
      return createFakeResponse(body, { ok });
    },
    text() {
      return Promise.resolve(body);
    },
  };
}

function createCacheMock() {
  const entries = new Map();
  return {
    entries,
    async addAll(assets) {
      assets.forEach((asset) => {
        entries.set(asset, createFakeResponse(`precache:${asset}`));
      });
    },
    async match(request) {
      const key = typeof request === 'string' ? request : request?.url;
      return entries.get(key) ?? null;
    },
    async put(request, response) {
      const key = typeof request === 'string' ? request : request?.url;
      entries.set(key, response);
    },
  };
}

function createCachesMock() {
  const caches = new Map();
  return {
    async open(name) {
      if (!caches.has(name)) {
        caches.set(name, createCacheMock());
      }
      return caches.get(name);
    },
    async keys() {
      return Array.from(caches.keys());
    },
    async delete(name) {
      return caches.delete(name);
    },
    get size() {
      return caches.size;
    },
    get store() {
      return caches;
    },
  };
}

const createRequest = (url, { method = 'GET', mode, headers = {} } = {}) => {
  const headerMap = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    url,
    method,
    mode,
    headers: {
      get(name) {
        return headerMap.get(name.toLowerCase()) ?? null;
      },
    },
  };
};

test('normalizeAssets returns unique, rooted paths', () => {
  const normalized = normalizeAssets(['index.html', '/order.html', 'index.html']);
  assert.deepEqual(normalized, ['/index.html', '/order.html']);
});

test('precache stores offline fallback and core assets', async () => {
  const cachesMock = createCachesMock();
  const controller = createServiceWorkerController({
    cachesApi: cachesMock,
    coreAssets: ['/index.html', '/main.css'],
    warmPaths: ['order.html', '/order.html'],
    offlinePath: 'offline.html',
  });

  const assets = await controller.precache();
  assert.ok(assets.includes('/offline.html'));
  assert.equal(new Set(assets).size, assets.length);

  const cache = await cachesMock.open(controller.cacheName);
  assert.equal(cache.entries.has('/index.html'), true);
  assert.equal(cache.entries.has('/order.html'), true);
  assert.equal(cache.entries.has('/offline.html'), true);
});

test('activate removes stale caches while preserving active cache', async () => {
  const cachesMock = createCachesMock();
  await cachesMock.open('stale-cache');
  await cachesMock.open('marxia-static-v1');

  const controller = createServiceWorkerController({ cachesApi: cachesMock });
  const removed = await controller.activate();

  assert.deepEqual(removed, ['stale-cache']);
  assert.deepEqual(await cachesMock.keys(), ['marxia-static-v1']);
});

test('handleRequest caches successful network responses', async () => {
  const cachesMock = createCachesMock();
  const fetchCalls = [];
  const controller = createServiceWorkerController({
    cachesApi: cachesMock,
    fetchFn: async (request) => {
      fetchCalls.push(request.url);
      return createFakeResponse('network-success');
    },
    coreAssets: [],
  });

  await controller.precache();
  const request = createRequest('https://example.com/data.json');
  const response = await controller.handleRequest(request);

  assert.equal(await response.text(), 'network-success');
  assert.deepEqual(fetchCalls, ['https://example.com/data.json']);

  const cache = await cachesMock.open(controller.cacheName);
  const cached = await cache.match(request);
  assert.equal(await cached.text(), 'network-success');
});

test('handleRequest falls back to offline document when network fails', async () => {
  const cachesMock = createCachesMock();
  const controller = createServiceWorkerController({
    cachesApi: cachesMock,
    fetchFn: async () => {
      throw new Error('network down');
    },
    coreAssets: [],
    offlinePath: 'offline.html',
  });

  await controller.precache();
  const request = createRequest('https://example.com/app', {
    mode: 'navigate',
    headers: { accept: 'text/html' },
  });

  const response = await controller.handleRequest(request);
  assert.equal(await response.text(), 'precache:/offline.html');
});
