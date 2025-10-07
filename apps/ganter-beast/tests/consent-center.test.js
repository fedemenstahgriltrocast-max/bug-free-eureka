import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeConsentCenter } from '../src/js/privacy/consent-center.js';

class FakeClassList {
  constructor(initial = []) {
    this.tokens = new Set(initial);
  }

  add(token) {
    this.tokens.add(token);
  }

  remove(token) {
    this.tokens.delete(token);
  }

  toggle(token, force) {
    if (force === undefined) {
      if (this.tokens.has(token)) {
        this.tokens.delete(token);
        return false;
      }
      this.tokens.add(token);
      return true;
    }
    if (force) {
      this.tokens.add(token);
      return true;
    }
    this.tokens.delete(token);
    return false;
  }

  contains(token) {
    return this.tokens.has(token);
  }
}

class FakeElement {
  constructor() {
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = '';
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(handler);
  }

  dispatch(type) {
    const handlers = this.listeners.get(type) ?? [];
    const event = {
      currentTarget: this,
      target: this,
      preventDefault() {
        event.defaultPrevented = true;
      },
      defaultPrevented: false,
    };
    handlers.forEach((handler) => handler(event));
    return event;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
    if (name === 'hidden') {
      this.hidden = true;
    }
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'hidden') {
      this.hidden = false;
    }
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }
}

class FakeButton extends FakeElement {}

class FakeCard extends FakeElement {
  constructor(initialClasses = []) {
    super();
    this.classList = new FakeClassList(initialClasses);
  }
}

class FakeToggle extends FakeElement {
  constructor(channel, { checked = false, card = null } = {}) {
    super();
    this.dataset = { consentToggle: channel };
    this.checked = checked;
    this.card = card;
  }

  closest() {
    return this.card;
  }
}

class FakeContainer extends FakeElement {
  constructor({ toggles = [], acceptButton = null, rejectButton = null } = {}) {
    super();
    this._toggles = toggles;
    this._acceptButton = acceptButton;
    this._rejectButton = rejectButton;
  }

  querySelector(selector) {
    if (selector === '[data-consent-accept]') {
      return this._acceptButton;
    }
    if (selector === '[data-consent-reject]') {
      return this._rejectButton;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === '[data-consent-toggle]') {
      return this._toggles;
    }
    return [];
  }
}

function createManagerStub(initialState) {
  const listeners = new Set();
  const calls = { setPreference: [], acceptAll: 0, rejectAll: 0 };
  let state = { ...initialState };

  return {
    get state() {
      return state;
    },
    setPreference(channel, value) {
      calls.setPreference.push({ channel, value });
      state = {
        ...state,
        [channel]: Boolean(value),
        updatedAt: '2024-06-02T10:00:00.000Z',
      };
      listeners.forEach((listener) => listener({ ...state }));
    },
    acceptAll() {
      calls.acceptAll += 1;
      state = {
        ...state,
        analytics: true,
        marketing: true,
        preferences: true,
        updatedAt: '2024-06-03T08:00:00.000Z',
      };
      listeners.forEach((listener) => listener({ ...state }));
    },
    rejectAll() {
      calls.rejectAll += 1;
      state = {
        ...state,
        analytics: false,
        marketing: false,
        preferences: true,
        updatedAt: '2024-06-04T08:00:00.000Z',
      };
      listeners.forEach((listener) => listener({ ...state }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    calls,
  };
}

test('initializeConsentCenter wires toggles and updates state feedback', () => {
  const analyticsCard = new FakeCard(['consent-card']);
  const marketingCard = new FakeCard(['consent-card']);

  const analyticsToggle = new FakeToggle('analytics', { checked: false, card: analyticsCard });
  const marketingToggle = new FakeToggle('marketing', { checked: true, card: marketingCard });

  const acceptButton = new FakeButton();
  const rejectButton = new FakeButton();

  const container = new FakeContainer({
    toggles: [analyticsToggle, marketingToggle],
    acceptButton,
    rejectButton,
  });

  const statusElement = new FakeElement();
  const timestampElement = new FakeElement();
  timestampElement.setAttribute('hidden', '');

  const manager = createManagerStub({
    analytics: false,
    marketing: true,
    preferences: true,
    updatedAt: '2024-06-01T12:00:00.000Z',
  });

  const root = {
    querySelector(selector) {
      if (selector === '[data-consent-center]') {
        return container;
      }
      if (selector === '[data-consent-status]') {
        return statusElement;
      }
      if (selector === '[data-consent-timestamp]') {
        return timestampElement;
      }
      return null;
    },
  };

  const controller = initializeConsentCenter({
    root,
    managerFactory: () => manager,
  });

  assert.ok(controller, 'controller should be returned');
  assert.equal(analyticsToggle.checked, false);
  assert.equal(marketingToggle.checked, true);
  assert.equal(
    marketingCard.classList.contains('consent-card--active'),
    true,
    'marketing card should be active when enabled',
  );
  assert.equal(
    analyticsCard.classList.contains('consent-card--active'),
    false,
    'analytics card should be inactive when disabled',
  );
  assert.equal(
    statusElement.textContent,
    'Preferencias guardadas. Puedes ajustar cada categoría cuando lo necesites.',
  );
  assert.equal(timestampElement.hasAttribute('hidden'), false);
  assert.ok(timestampElement.textContent.length > 0, 'timestamp should be visible');

  analyticsToggle.checked = true;
  analyticsToggle.dispatch('change');
  assert.deepStrictEqual(manager.calls.setPreference, [{ channel: 'analytics', value: true }]);

  acceptButton.dispatch('click');
  assert.equal(manager.calls.acceptAll, 1);
  assert.equal(analyticsToggle.checked, true);
  assert.equal(marketingToggle.checked, true);
  assert.equal(analyticsCard.classList.contains('consent-card--active'), true);

  rejectButton.dispatch('click');
  assert.equal(manager.calls.rejectAll, 1);
  assert.equal(analyticsToggle.checked, false);
  assert.equal(marketingToggle.checked, false);
  assert.equal(analyticsCard.classList.contains('consent-card--active'), false);
  assert.equal(marketingCard.classList.contains('consent-card--active'), false);
});
