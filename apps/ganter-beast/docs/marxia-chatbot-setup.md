# Marxia Chatbot Setup Guide

This guide explains how to embed the Marxia "Orden Rápida" assistant inside any static page of this project using the standalone `marxia-chatbot.js` module.

## 1. Copy the module

Ensure `/scripts/marxia-chatbot.js` is available in your deployment output. The module ships NPM-free, so you can serve it directly.

## 2. Include the module on the page

Add a `<script type="module">` block to the page where the chatbot should appear:

```html
<script type="module">
  import { mountMarxiaChatbot } from '/scripts/marxia-chatbot.js';

  mountMarxiaChatbot({
    endpoint: 'https://script.google.com/macros/s/AKfycbxrn9TYVXDc910qQGNPEX1u5PjBUMLx-VhNg4mEtX82gnhYyuEc2i-wIU0NQy-PPpinnQ/exec',
    tiny: {
      mode: 'none',
      link: { text: '⚡ Connect Tiny ML · Tiny LLM · Tiny AI', href: 'https://your-tiny-docs-or-runtime.example' }
    },
    search: {
      enabled: true,
      topK: 3
      // Optional: supply your own corpus:
      // menu: {
      //   options: [{id:'op1', title:'Opción 1', desc:'…', priceCents:320}, ...],
      //   extras:  [{id:'ex_cafe', title:'Café', desc:'Café', priceCents:70}, ...]
      // }
    },
    repo: { enabled:false }
  });
</script>
```

The assistant pops up as a floating action button. A bilingual disclaimer (`"Loading… may take a moment. / Cargando… puede tomar un momento."`) is displayed when the widget boots so users know Tiny engines might need a few seconds.

### Customize the floating action button

You can tailor the FAB label, icon, and footprint through `ui.fab` options:

```js
mountMarxiaChatbot({
  ui: {
    position: 'left',
    fab: {
      icon: '🧠',
      label: 'Asistente Marxia',
      ariaLabel: 'Abrir asistente de pedidos Marxia',
      variant: 'extended', // or 'compact' for icon-only
      showLabel: true,
      badge: 'beta'
    }
  }
});
```

When `variant: 'compact'` (or `showLabel: false`) is supplied, the FAB collapses into a circular icon. Keyboard focus, scrim overlay, and the `Escape` key all continue to behave correctly regardless of the variant.

## 3. Provide cart + contact DOM hooks

The assistant expects the following elements to exist:

- `#cart .line` rows that contain product name, quantity (`.qtybox span`), and total (`strong` inside the trailing `div`).
- `#delivery-fee`, `#customer-name`, `#delivery-address`, `#whatsapp`, `#customer-email`, and `#business-email` inputs.

If your page already powers Marxia orders, these hooks should already exist.

## 4. Optional: Tiny ML / LLM engines

You can enable lightweight, in-browser inference for intent detection:

```js
mountMarxiaChatbot({
  tiny: {
    mode: 'onnx',
    onnx: {
      modelUrl: '/models/intent-tiny.onnx',
      wasmBase: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/'
    }
  }
});
```

For WebLLM, supply `tiny.webllm.modelId` and `tiny.webllm.workerUrl`. If the engine fails to load, the assistant automatically falls back to deterministic rules.

```html
<!-- Example: WebLLM on-device + BM25 -->
<script src="https://unpkg.com/@mlc-ai/web-llm/dist/web-llm.min.js"></script>
<script type="module">
  import { mountMarxiaChatbot } from '/scripts/marxia-chatbot.js';
  mountMarxiaChatbot({
    endpoint: 'https://script.google.com/macros/s/.../exec',
    tiny: {
      mode: 'webllm',
      webllm: { modelId: 'Qwen2.5-0.5B-instruct-q4f16_1', workerUrl: 'https://unpkg.com/@mlc-ai/web-llm/dist/worker.js' },
      link: { text:'⚡ Connect Tiny ML · Tiny LLM · Tiny AI', href:'https://your-tiny-docs-or-runtime.example' }
    },
    search: { enabled:true, topK:3 }
  });
</script>
```

## 5. Optional: Menu search corpus

To answer menu-related questions (e.g., ingredients, descriptions), provide menu data via configuration or rely on `window.OPTIONS`/`window.EXTRAS`.

```js
mountMarxiaChatbot({
  search: {
    enabled: true,
    topK: 3,
    menu: {
      options: [
        { id: 'a1', title: 'Arepa Doble Queso', desc: 'Harina de maíz, queso llanero, mantequilla', priceCents: 450 }
      ],
      extras: []
    }
  }
});
```

When `search.enabled` is true (default), the assistant builds an offline BM25 index in-browser and surfaces up to `search.topK` matches for `menu_query` intents.

## 6. Endpoint posture

The module never issues write requests to repositories (`PATCH`, `POST`, `PUT`). It only performs `POST` requests to the provided Google Apps Script endpoint to register invoices and optionally opens a WhatsApp tab for customer delivery.

## 7. Accessibility & UX tips

- The floating action button uses accessible labels (`aria-label`) and toggles `aria-expanded` while opening/closing the dialog.
- A scrim overlay plus the `Escape` key allow keyboard and screen-reader users to close the chat quickly.
- Keyboard users can submit via `Enter` inside the message box.
- The bilingual loading disclaimer addresses both English and Spanish speakers, aligning with inclusive UX guidance.

You're now ready to launch the Marxia assistant with offline Tiny AI optionality and compliance-friendly defaults.

## 8. Menu-only assistant

If you need a menu-focused concierge without order or endpoint logic, load the standalone `marxia-menu-bot.js` module. It indexes `window.OPTIONS`/`window.EXTRAS` (or any data you inject) with BM25, fuzzy matching, and synonym expansion:

```html
<script type="module">
  import { mountMarxiaMenuBot } from '/scripts/marxia-menu-bot.js';

  mountMarxiaMenuBot({
    ui: { position: 'right' },
    locale: 'es-EC',
    currency: 'USD',
    topK: 3
  });
</script>
```

The menu bot politely declines off-topic questions and keeps the UX consistent with the main assistant.

## 9. Advanced menu concierge

For richer concierge experiences—voice controls, IndexedDB caching, confidence dots, and upsell nudges—load the `marxia-menu-bot-advanced.js` module. It extends the baseline bot with bilingual loading disclaimers, offline persistence, and CSAT logging:

```html
<script type="module">
  import { mountMarxiaMenuBot } from '/scripts/marxia-menu-bot-advanced.js';

  mountMarxiaMenuBot({
    locale: 'es-EC',
    currency: 'USD',
    topK: 3,
    lang: 'es',
    hours: {
      breakfast: { start: '06:00', end: '11:00' }
    },
    pwa: { enableHints: true }
    // Optional: menu overrides or personalized synonym seeds
  });
</script>
```

The advanced concierge automatically hydrates menu data from `window.OPTIONS`/`window.EXTRAS` (or supplied config), stores a cached copy in IndexedDB for offline support, and politely stores CSAT thumbs-ups/downs in `localStorage` for analytics loops. Smart upsell chips, breakfast-hour disclosures, and bilingual hints keep the UX neuro-friendly while staying completely client-side.

### Example: inline data + PWA shell for the advanced concierge

To mirror the Marxia breakfast kiosk, seed menu data on the page, mount the advanced concierge, and wire a lightweight PWA shell:

```html
<script>
  window.OPTIONS = [
    { id:'op1', name:{es:'Opción 1',en:'Option 1'}, desc:{es:'Tortilla + Huevos + Chorizo + Bebida', en:'…'}, priceCents:320, img:'/img/op1.jpg' },
    { id:'op2', name:{es:'Opción 2',en:'Option 2'}, desc:{es:'Tortilla + Chorizo + Bebida', en:'…'}, priceCents:270, img:'/img/op2.jpg' },
    { id:'op3', name:{es:'Opción 3',en:'Option 3'}, desc:{es:'Tortilla + Huevos + Bebida', en:'…'}, priceCents:270 },
    { id:'op4', name:{es:'Opción 4',en:'Option 4'}, desc:{es:'2 Tortilla + 2 Huevos + 2 Chorizo + 2 Bebida', en:'…'}, priceCents:640 }
  ];
  window.EXTRAS = [
    { id:'ex_cafe', name:{es:'Café',en:'Coffee'}, priceCents:70, img:'/img/cafe.jpg' },
    { id:'ex_cola', name:{es:'Cola',en:'Cola'}, priceCents:70 },
    { id:'ex_chorizo', name:{es:'Chorizo',en:'Sausage'}, priceCents:70 },
    { id:'ex_huevo', name:{es:'Huevo',en:'Egg'}, priceCents:70 },
    { id:'ex_tortilla', name:{es:'Tortilla',en:'Tortilla'}, priceCents:70 }
  ];
</script>

<script type="module">
  import { mountMarxiaMenuBot } from '/scripts/marxia-menu-bot-advanced.js';

  mountMarxiaMenuBot({
    ui: { position: 'right' },
    locale: 'es-EC',
    currency: 'USD',
    topK: 3,
    lang: 'es',
    hours: { breakfast: { start: '06:00', end: '11:00' } }
  });
</script>

<link rel="manifest" href="/manifest.webmanifest">
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-marxia.js').catch(()=>{});
}
</script>
```

Add a matching `sw-marxia.js` to provide cache-first behaviour for the concierge bundle, thumbnails, and HTML shell:

```js
const CACHE = 'marxia-v1';
const ASSETS = [
  '/', '/index.html',
  '/scripts/marxia-menu-bot-advanced.js',
  // add your CSS, fonts, thumbnails, and menu JSON if external
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method==='GET' && new URL(req.url).origin===location.origin) {
    e.respondWith((async()=>{
      const hit = await caches.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        return hit || new Response('Offline', {status:503});
      }
    })());
  }
});
```

This arrangement keeps the concierge operational during spotty connectivity, satisfies PWA install prompts, and reinforces the bilingual disclaimer that appears while assets hydrate.
