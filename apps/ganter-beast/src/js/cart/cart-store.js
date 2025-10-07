import { roundCurrency } from '../utils/currency.js';

export function createCartStore({ taxRate = 0, deliveryFee = 0 } = {}) {
  const items = new Map();

  const getItem = (id) => items.get(id);

  const list = ({ includeZero = false } = {}) =>
    Array.from(items.entries())
      .map(([id, entry]) => ({ id, ...entry }))
      .filter((entry) => includeZero || entry.quantity > 0);

  const totals = () => {
    const snapshot = list();
    const subtotal = snapshot.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
    const tax = subtotal * taxRate;
    const delivery = snapshot.length > 0 ? deliveryFee : 0;
    const total = subtotal + tax + delivery;
    return {
      subtotal: roundCurrency(subtotal),
      tax: roundCurrency(tax),
      delivery: roundCurrency(delivery),
      total: roundCurrency(total),
    };
  };

  const register = (id, data) => {
    if (!id) return;
    const nextEntry = {
      price: Number.parseFloat(data?.price ?? 0),
      quantity: Number.parseInt(data?.quantity ?? 0, 10) || 0,
      labels: data?.labels ?? {},
      card: data?.card,
    };
    items.set(id, nextEntry);
  };

  const modify = (id, delta) => {
    const entry = getItem(id);
    if (!entry) {
      return 0;
    }
    const nextQuantity = Math.max(0, Number.parseInt(entry.quantity ?? 0, 10) + delta);
    entry.quantity = nextQuantity;
    items.set(id, entry);
    return nextQuantity;
  };

  const clear = () => {
    items.forEach((entry, id) => {
      entry.quantity = 0;
      items.set(id, entry);
    });
  };

  return {
    register,
    modify,
    clear,
    getItem,
    get: getItem,
    has: (id) => items.has(id),
    list,
    totals,
    size: () => items.size,
  };
}
