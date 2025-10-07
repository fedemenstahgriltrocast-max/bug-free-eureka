import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createConsentManager,
  CONSENT_STORAGE_KEY,
} from '../src/js/privacy/consent-manager.js';

function createMemoryStorage(initial = new Map()) {
  const store = new Map(initial);
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('acceptAll grants every channel and persists the decision', () => {
  const storage = createMemoryStorage();
  const manager = createConsentManager({
    storage,
    now: () => {
      const stamp = '2024-07-01T12:00:00.000Z';
      return stamp;
    },
  });

  let broadcastState;
  const unsubscribe = manager.subscribe((state) => {
    broadcastState = state;
  });

  const state = manager.acceptAll();

  assert.equal(manager.hasConsented('analytics'), true);
  assert.equal(manager.hasConsented('marketing'), true);
  assert.equal(manager.hasConsented('preferences'), true);
  assert.equal(state.analytics, true);
  assert.equal(manager.shouldDisplayBanner(), false);

  const persisted = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY));
  assert.equal(persisted.analytics, true);
  assert.equal(typeof persisted.updatedAt, 'string');
  assert.equal(broadcastState.analytics, true);
  unsubscribe();
});

test('rejectAll revokes optional channels but keeps preferences enabled', () => {
  const storage = createMemoryStorage();
  const manager = createConsentManager({
    storage,
    now: () => '2024-07-02T00:00:00.000Z',
  });

  manager.acceptAll();
  const state = manager.rejectAll();

  assert.equal(state.analytics, false);
  assert.equal(state.marketing, false);
  assert.equal(state.preferences, true);
  assert.equal(manager.hasConsented('preferences'), true);
});

test('initialization hydrates stored preferences and skips banner', () => {
  const saved = {
    analytics: true,
    marketing: false,
    preferences: true,
    updatedAt: '2024-06-30T08:30:00.000Z',
  };
  const storage = createMemoryStorage([[CONSENT_STORAGE_KEY, JSON.stringify(saved)]]);
  const manager = createConsentManager({ storage });

  assert.equal(manager.hasConsented('analytics'), true);
  assert.equal(manager.hasConsented('marketing'), false);
  assert.equal(manager.shouldDisplayBanner(), false);
});

test('setPreference validates channel names', () => {
  const storage = createMemoryStorage();
  const manager = createConsentManager({ storage, now: () => '2024-07-03T00:00:00.000Z' });

  assert.throws(() => manager.setPreference('unknown', true), /Unknown consent channel/);

  const updated = manager.setPreference('analytics', true);
  assert.equal(updated.analytics, true);
});

test('corrupted storage resets to defaults without throwing', () => {
  const storage = createMemoryStorage([[CONSENT_STORAGE_KEY, '{bad json']]);
  const manager = createConsentManager({ storage });

  assert.equal(manager.hasConsented('analytics'), false);
  assert.equal(manager.shouldDisplayBanner(), true);
});
