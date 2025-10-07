export const CONSENT_STORAGE_KEY = 'marxia-consent';

const DEFAULT_CHANNELS = Object.freeze({
  analytics: false,
  marketing: false,
  preferences: true,
});

const getDefaultStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage is not available in this environment');
  }
  return window.localStorage;
};

const sanitizeBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

const cloneState = (state) => ({ ...state });

export function createConsentManager({
  storage = undefined,
  channels = {},
  now = () => new Date().toISOString(),
} = {}) {
  const resolvedStorage = storage ?? getDefaultStorage();
  const channelDefaults = { ...DEFAULT_CHANNELS, ...channels };
  const channelKeys = Object.keys(channelDefaults);
  let state = {
    ...channelDefaults,
    updatedAt: null,
  };

  const loadFromStorage = () => {
    try {
      const raw = resolvedStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        resolvedStorage.removeItem(CONSENT_STORAGE_KEY);
        return;
      }
      channelKeys.forEach((key) => {
        state[key] = sanitizeBoolean(parsed[key], state[key]);
      });
      if (typeof parsed.updatedAt === 'string' && parsed.updatedAt.trim()) {
        state.updatedAt = parsed.updatedAt;
      }
    } catch (error) {
      resolvedStorage.removeItem(CONSENT_STORAGE_KEY);
      state = {
        ...channelDefaults,
        updatedAt: null,
      };
    }
  };

  loadFromStorage();

  const listeners = new Set();

  const persist = () => {
    const payload = channelKeys.reduce(
      (acc, key) => {
        acc[key] = state[key];
        return acc;
      },
      { updatedAt: state.updatedAt }
    );
    resolvedStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  };

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(cloneState(state));
      } catch (error) {
        console.error('consent listener error', error);
      }
    });
  };

  const commit = (updates) => {
    state = {
      ...state,
      ...updates,
      updatedAt: now(),
    };
    persist();
    notify();
    return cloneState(state);
  };

  const acceptAll = () => {
    const updates = channelKeys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    return commit(updates);
  };

  const rejectAll = () => {
    const updates = channelKeys.reduce((acc, key) => {
      acc[key] = key === 'preferences' ? channelDefaults[key] : false;
      return acc;
    }, {});
    return commit(updates);
  };

  const setPreference = (channel, value) => {
    if (!channelKeys.includes(channel)) {
      throw new Error(`Unknown consent channel: ${channel}`);
    }
    return commit({ [channel]: Boolean(value) });
  };

  const hasConsented = (channel) => {
    if (!channelKeys.includes(channel)) {
      return false;
    }
    return Boolean(state[channel]);
  };

  const shouldDisplayBanner = () => !state.updatedAt;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    storageKey: CONSENT_STORAGE_KEY,
    get state() {
      return cloneState(state);
    },
    acceptAll,
    rejectAll,
    setPreference,
    hasConsented,
    shouldDisplayBanner,
    subscribe,
  };
}
