import test from 'node:test';
import assert from 'node:assert/strict';

import { createI18nManager } from '../src/js/i18n/index.js';

function createMemoryStorage() {
  let store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

test('i18n manager normalizes and stores selected language', () => {
  const storage = createMemoryStorage();
  const i18n = createI18nManager({ storage, initialLanguage: 'EN' });

  assert.equal(i18n.language, 'en');
  assert.equal(storage.getItem('marxia-lang'), 'en');

  i18n.setLanguage('es');
  assert.equal(i18n.language, 'es');
  assert.equal(storage.getItem('marxia-lang'), 'es');
});

test('format replaces tokens using the active dictionary', () => {
  const storage = createMemoryStorage();
  const i18n = createI18nManager({ storage, initialLanguage: 'es' });

  const formatted = i18n.format('deliveryEta', { time: '08:30' });
  assert.equal(formatted.includes('08:30'), true);
  assert.equal(formatted.includes('{time}'), false);

  const fallback = i18n.translate('orderNow', 'en');
  assert.equal(fallback, 'Order now');
});
