const IVA_RATE = 0.15;
const LOCALE = { es: 'es-EC', en: 'en-US' };
const WORKER_ENDPOINT = 'https://cthrough-woodypecker-265a.meeka-monsta-dooku.workers.dev/api/save';
let currentLang = 'es';

const OPTIONS = [
  {
    id: 'op1',
    name: { es: 'Opción 1', en: 'Option 1' },
    desc: {
      es: 'Tortilla + Huevos + Chorizo + Bebida',
      en: 'Tortilla + Eggs + Sausage + Drink',
    },
    priceCents: 320,
  },
  {
    id: 'op2',
    name: { es: 'Opción 2', en: 'Option 2' },
    desc: {
      es: 'Tortilla + Chorizo + Bebida',
      en: 'Tortilla + Sausage + Drink',
    },
    priceCents: 270,
  },
  {
    id: 'op3',
    name: { es: 'Opción 3', en: 'Option 3' },
    desc: {
      es: 'Tortilla + Huevos + Bebida',
      en: 'Tortilla + Eggs + Drink',
    },
    priceCents: 270,
  },
  {
    id: 'op4',
    name: { es: 'Opción 4', en: 'Option 4' },
    desc: {
      es: '2 Tortilla + 2 Huevos + 2 Chorizo + 2 Bebida',
      en: '2 Tortillas + 2 Eggs + 2 Sausages + 2 Drinks',
    },
    priceCents: 640,
  },
];

const EXTRAS = [
  { id: 'ex_cafe', name: { es: 'Café', en: 'Coffee' }, priceCents: 70 },
  { id: 'ex_cola', name: { es: 'Cola', en: 'Cola' }, priceCents: 70 },
  { id: 'ex_chorizo', name: { es: 'Chorizo', en: 'Sausage' }, priceCents: 70 },
  { id: 'ex_huevo', name: { es: 'Huevo', en: 'Egg' }, priceCents: 70 },
  { id: 'ex_tortilla', name: { es: 'Tortilla', en: 'Tortilla' }, priceCents: 70 },
];

const cart = new Map();
const $ = (selector) => document.querySelector(selector);
const t = (value) => (typeof value === 'string' ? value : value[currentLang]);
const money = (cents) => (cents / 100).toLocaleString(LOCALE[currentLang], {
  style: 'currency',
  currency: 'USD',
});

function onlyDigits(value) {
  return (value || '').replace(/\D+/g, '');
}

function formatWAInput(input) {
  let digits = onlyDigits(input.value);
  if (!digits.startsWith('593')) digits = `593${digits}`;
  digits = digits.slice(0, 12);
  const local = digits.slice(3);
  const a = local.slice(0, 2);
  const b = local.slice(2, 5);
  const c = local.slice(5, 9);
  let formatted = '+593';
  if (a) formatted += ` ${a}`;
  if (b) formatted += ` ${b}`;
  if (c) formatted += ` ${c}`;
  input.value = formatted + (formatted === '+593' ? ' ' : '');
}

function normalizeWAForSend(input) {
  const digits = onlyDigits(input.value);
  if (!digits.startsWith('593')) return null;
  const local = digits.slice(3);
  if (local.length !== 9) return null;
  return `+593${local}`;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasThreatPattern(value) {
  return /<|>|\bjavascript:|data:text|onerror\b|onload\b/i.test(value || '');
}

function cleanText(value) {
  return (value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeField(value, { required = false, allowEmpty = false } = {}) {
  if (!value && required && !allowEmpty) {
    throw new Error('required');
  }
  if (hasThreatPattern(value)) {
    throw new Error('threat_detected');
  }
  const cleaned = cleanText(value);
  if (!cleaned && required && !allowEmpty) {
    throw new Error('required');
  }
  return cleaned;
}

function add(item) {
  const line = cart.get(item.id) || { ...item, qty: 0 };
  line.qty += 1;
  cart.set(item.id, line);
  const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
  if (isDark) {
    const btn = document.querySelector(`button[data-act="add"][data-id="${item.id}"]`);
    if (btn) {
      btn.classList.add('btn-adding');
      setTimeout(() => btn.classList.remove('btn-adding'), 2000);
    }
  }
  render();
}

function rem(item) {
  if (!cart.has(item.id)) return;
  const line = cart.get(item.id);
  line.qty -= 1;
  if (line.qty <= 0) {
    cart.delete(item.id);
  } else {
    cart.set(item.id, line);
  }
  render();
}

function buildOptions() {
  const host = $('#opts');
  if (!host) return;
  host.innerHTML = '';
  OPTIONS.forEach((option, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'opt';
    wrapper.innerHTML = `
      <div class="top">
        <button class="btn50 op${(index % 4) + 1}">${index + 1}</button>
        <div>
          <div class="desc">${t(option.desc)} — <strong>${money(option.priceCents)}</strong></div>
          <div class="actions">
            <button class="btn" data-act="rem" data-id="${option.id}">− Quitar</button>
            <button class="btn" data-act="add" data-id="${option.id}">+ Agregar</button>
          </div>
        </div>
      </div>`;
    host.appendChild(wrapper);
  });
}

function buildExtras() {
  const host = $('#extras');
  if (!host) return;
  host.innerHTML = '';
  EXTRAS.forEach((extra) => {
    const row = document.createElement('div');
    row.className = 'ex-row';
    row.innerHTML = `
      <div class="ex-left">${t(extra.name)} <span class="ex-price">${money(extra.priceCents)}</span></div>
      <div class="actions">
        <button class="btn" data-act="rem" data-id="${extra.id}">−</button>
        <button class="btn" data-act="add" data-id="${extra.id}">+ Agregar</button>
      </div>`;
    host.appendChild(row);
  });
}

function render() {
  const box = $('#cart');
  if (!box) return;
  box.innerHTML = '';
  let subtotal = 0;
  cart.forEach((line) => {
    subtotal += line.priceCents * line.qty;
    const el = document.createElement('div');
    el.className = 'line';
    const nameText =
      line.name && typeof line.name === 'object' ? line.name[currentLang] ?? line.name.es ?? '' : line.name;
    el.innerHTML = `
      <div>${nameText}</div>
      <div class="qtybox">
        <button class="btn" data-act="rem" data-id="${line.id}">−</button>
        <span>${line.qty}</span>
        <button class="btn" data-act="add" data-id="${line.id}">+</button>
      </div>
      <div><strong>${money(line.priceCents * line.qty)}</strong></div>`;
    box.appendChild(el);
  });
  const vat = Math.round(subtotal * IVA_RATE);
  const total = subtotal + vat;
  $('#subtotal').textContent = money(subtotal);
  $('#vat').textContent = money(vat);
  $('#total').textContent = money(total);
}

$('#lang').addEventListener('click', () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  $('#lang').textContent = currentLang.toUpperCase();
  buildOptions();
  buildExtras();
  render();
});

$('#theme').addEventListener('click', () => {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  $('#theme').textContent = next === 'light' ? '🌞' : '🌙';
});

document.body.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const act = btn.getAttribute('data-act');
  const item = OPTIONS.find((option) => option.id === id) || EXTRAS.find((extra) => extra.id === id) || cart.get(id);
  if (!item) return;
  const payload = {
    id: item.id,
    name: item.name?.[currentLang] ?? item.name,
    priceCents: item.priceCents,
  };
  if (act === 'add') {
    add(payload);
  } else {
    rem(payload);
  }
});

const loader = $('#loader');
const toast = $('#toast');

function showToast(message, ms = 1800) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), ms);
}

function genOrderId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const random = Math.floor(Math.random() * 900 + 100);
  return `ORD-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}-${random}`;
}

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) {
    const message = json.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return json;
}

function scanCartLines() {
  const items = [];
  cart.forEach((line) => {
    const nameText =
      line.name && typeof line.name === 'object' ? line.name[currentLang] ?? line.name.es ?? '' : line.name;
    if (hasThreatPattern(nameText)) {
      throw new Error('threat_detected');
    }
    items.push({
      id: line.id,
      name: nameText,
      qty: line.qty,
      priceCents: line.priceCents,
    });
  });
  return items;
}

function clearForm() {
  $('#name').value = '';
  $('#email').value = '';
  $('#wa').value = '+593 ';
  $('#addr').value = '';
  $('#owner').value = '';
}

$('#accept').addEventListener('click', async () => {
  if (cart.size === 0) {
    showToast('Carrito vacío');
    return;
  }

  const rawName = $('#name').value;
  const rawEmail = $('#email').value;
  const rawAddr = $('#addr').value;
  const rawOwner = $('#owner').value;

  try {
    const name = sanitizeField(rawName, { allowEmpty: true });
    const email = sanitizeField(rawEmail, { required: true });
    if (email && !validEmail(email)) {
      showToast('Email inválido');
      return;
    }
    const wa = normalizeWAForSend($('#wa'));
    if (!wa) {
      showToast('WhatsApp debe ser +593 99 999 9999');
      return;
    }
    const address = sanitizeField(rawAddr, { required: true });
    const owner = sanitizeField(rawOwner, { allowEmpty: true });

    const items = scanCartLines();

    const payload = {
      orderId: genOrderId(),
      name: name || undefined,
      email,
      phone: wa,
      address,
      ownerEmail: owner || undefined,
      items,
    };

    loader.style.display = 'flex';
    $('#accept').disabled = true;

    await postJSON(WORKER_ENDPOINT, payload);

    showToast('¡Pedido enviado con éxito!');
    cart.clear();
    render();
    clearForm();
  } catch (error) {
    if (error instanceof Error && error.message === 'required') {
      showToast('Revisa los campos obligatorios');
    } else if (error instanceof Error && error.message === 'threat_detected') {
      showToast('Entrada no permitida detectada');
    } else if (error instanceof Error && error.message) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast('Error desconocido');
    }
  } finally {
    loader.style.display = 'none';
    $('#accept').disabled = false;
  }
});

const waInput = $('#wa');
waInput.addEventListener('input', () => formatWAInput(waInput));
waInput.addEventListener('focus', () => {
  if (!waInput.value.trim()) {
    waInput.value = '+593 ';
  }
});
waInput.addEventListener('blur', () => formatWAInput(waInput));

(function init() {
  document.documentElement.setAttribute('data-theme', 'dark');
  buildOptions();
  buildExtras();
  render();
})();
