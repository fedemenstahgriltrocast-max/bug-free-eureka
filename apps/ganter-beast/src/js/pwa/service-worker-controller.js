const DEFAULT_CACHE_NAME = 'marxia-static-v1';
const DEFAULT_OFFLINE_PATH = 'offline.html';
const DEFAULT_CORE_ASSETS = Object.freeze([
  '/',
  '/index.html',
  '/order.html',
  '/main.css',
  '/main.js',
  '/manifest.json',
]);

const getDefaultCaches = () => {
  if (typeof caches === 'undefined') {
    throw new Error('caches API is not available in this environment');
  }
  return caches;
};

const getDefaultFetch = () => {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch API is not available in this environment');
  }
  return fetch;
};

const normalizeAssets = (assets = []) =>
  Array.from(
    new Set(
      assets
        .filter((asset) => typeof asset === 'string' && asset.trim().length > 0)
        .map((asset) => (asset.startsWith('/') ? asset : `/${asset}`))
    )
  );

const keyFromRequest = (request) => {
  if (typeof request === 'string') {
    return request;
  }
  if (request && typeof request.url === 'string') {
    return request.url;
  }
  return String(request);
};

const isNavigationRequest = (request) => {
  if (!request || typeof request !== 'object') {
    return false;
  }
  if (request.mode === 'navigate' || request.destination === 'document') {
    return true;
  }
  const accept = request.headers?.get?.('accept') || '';
  return accept.includes('text/html');
};

export function createServiceWorkerController({
  cacheName = DEFAULT_CACHE_NAME,
  coreAssets = DEFAULT_CORE_ASSETS,
  offlinePath = DEFAULT_OFFLINE_PATH,
  warmPaths = [],
  cachesApi = undefined,
  fetchFn = undefined,
} = {}) {
  const activeCaches = cachesApi ?? getDefaultCaches();
  const networkFetch = fetchFn ?? getDefaultFetch();

  const normalizedCore = normalizeAssets(coreAssets);
  const normalizedOffline = offlinePath.startsWith('/') ? offlinePath : `/${offlinePath}`;
  const normalizedWarmPaths = normalizeAssets(warmPaths);
  const precacheAssets = Array.from(
    new Set([...normalizedCore, normalizedOffline, ...normalizedWarmPaths])
  );

  const openCache = () => activeCaches.open(cacheName);

  const precache = async () => {
    const cache = await openCache();
    await cache.addAll(precacheAssets);
    return [...precacheAssets];
  };

  const activate = async () => {
    const keys = await activeCaches.keys();
    const stale = keys.filter((key) => key !== cacheName);
    await Promise.all(stale.map((key) => activeCaches.delete(key)));
    return stale;
  };

  const handleRequest = async (request) => {
    const cache = await openCache();

    if (request?.method && request.method !== 'GET') {
      return networkFetch(request);
    }

    try {
      const networkResponse = await networkFetch(request);
      if (networkResponse && typeof networkResponse.clone === 'function' && networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      if (isNavigationRequest(request)) {
        const fallback = await cache.match(normalizedOffline);
        if (fallback) {
          return fallback;
        }
      }
      throw error;
    }
  };

  const handleMessage = async (data) => {
    if (!data || typeof data !== 'object') {
      return null;
    }
    if (data.type === 'SKIP_WAITING') {
      if (typeof self !== 'undefined' && typeof self.skipWaiting === 'function') {
        await self.skipWaiting();
      }
      return 'skipped-waiting';
    }
    if (data.type === 'PRECACHE') {
      await precache();
      return 'precache-complete';
    }
    return null;
  };

  return {
    cacheName,
    offlinePath: normalizedOffline,
    precacheAssets,
    precache,
    activate,
    handleRequest,
    handleMessage,
  };
}

export {
  DEFAULT_CACHE_NAME,
  DEFAULT_CORE_ASSETS,
  DEFAULT_OFFLINE_PATH,
  normalizeAssets,
  isNavigationRequest,
  keyFromRequest,
};
