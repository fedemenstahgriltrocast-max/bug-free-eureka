import test from 'node:test';
import assert from 'node:assert/strict';

import { createCartStore } from '../src/js/cart/cart-store.js';

const TAX_RATE = 0.15;
const DELIVERY_FEE = 3.5;

test('cart totals compute VAT and delivery fee', () => {
  const cart = createCartStore({ taxRate: TAX_RATE, deliveryFee: DELIVERY_FEE });
  cart.register('empanada', { price: 2.5, quantity: 0, labels: { en: 'Empanada' } });
  cart.register('coffee', { price: 3, quantity: 0, labels: { en: 'Coffee' } });

  cart.modify('empanada', 2); // $5.00
  cart.modify('coffee', 1); // $3.00

  const { subtotal, tax, delivery, total } = cart.totals();

  assert.equal(subtotal, 8);
  assert.equal(Number(tax.toFixed(2)), 1.2);
  assert.equal(delivery, DELIVERY_FEE);
  assert.equal(Number(total.toFixed(2)), 12.7);
});

test('clearing the cart resets totals to zero', () => {
  const cart = createCartStore({ taxRate: TAX_RATE, deliveryFee: DELIVERY_FEE });
  cart.register('cake', { price: 10, quantity: 0, labels: { en: 'Cake' } });
  cart.modify('cake', 1);

  cart.clear();

  const { subtotal, tax, delivery, total } = cart.totals();
  assert.equal(subtotal, 0);
  assert.equal(tax, 0);
  assert.equal(delivery, 0);
  assert.equal(total, 0);
});
