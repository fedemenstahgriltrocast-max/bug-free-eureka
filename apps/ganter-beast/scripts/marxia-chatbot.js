// marxia-chatbot.js  — NPM-free, <script type="module"> friendly
// CX Chatbot for Marxia "Orden Rápida" — Read-only posture, Tiny-in-browser optional.
//
// Public API:
//   import { mountMarxiaChatbot } from './marxia-chatbot.js';
//   mountMarxiaChatbot({ endpoint, tiny, repo, ui });
//
// Required DOM in host page (already in your app):
//   - #cart .line rows, #delivery-fee, #customer-name, #delivery-address, #whatsapp, #customer-email, #business-email
//
// Tiny-in-browser options (all optional):
//   tiny: {
//     mode: 'onnx' | 'webllm' | 'none',
//     // ONNX:
//     onnx: { modelUrl: '/models/intent-tiny.onnx', wasmBase: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/' },
//     // WebLLM:
//     webllm: { modelId: 'Qwen2.5-0.5B-instruct-q4f16_1', workerUrl: 'https://unpkg.com/@mlc-ai/web-llm/dist/worker.js' }
//   }
//
// Read-only repo (optional; GET only):
//   repo: { enabled:false, owner:'org', repo:'name', branch:'main', token:'' }
//
// UI (optional):
//   ui: { theme: 'auto'|'dark'|'light', position: 'right'|'left' }

export async function mountMarxiaChatbot(config = {}) {
  const state = normalizeConfig(config);
  state._searchIndex = null;
  injectStyles(state);
  const root = buildWidget(state);
  wireWidget(root, state);
  attach(root, state);

  // Init Tiny engines (optional)
  if (state.tiny.mode === 'onnx') {
    await initONNX(state).catch(err => console.warn('ONNX init skipped:', err));
  } else if (state.tiny.mode === 'webllm') {
    await initWebLLM(state).catch(err => console.warn('WebLLM init skipped:', err));
  }
  greeting(root, state);
  return root;
}

/* -------------------- Config & UI -------------------- */
function normalizeConfig(cfg) {
  const def = {
    endpoint: '',
    currency: 'USD',
    ivaRate: 0.15,
    tiny: { mode: 'none', onnx: null, webllm: null },
    repo: { enabled:false, owner:'', repo:'', branch:'main', token:'' },
    ui: {
      theme:'auto',
      position:'right',
      fab: {
        icon:'💬',
        label:'Chat Marxia',
        ariaLabel:'Abrir chat Marxia',
        showLabel:true,
        variant:'extended'
      }
    },
    // NEW: local BM25 search settings
    search: {
      enabled: true,
      topK: 3,
      // If you don't pass a menu corpus in config, we'll auto-read from window.OPTIONS/EXTRAS
      menu: null
    }
  };
  const out = deepMerge(def, cfg || {});
  out.flags = { typing:false, booted:false };
  out.tinyCtx = { engine:null, session:null, tokenizer:null };
  return out;
}
function deepMerge(a,b){ for(const k in b){ if(b[k] && typeof b[k]==='object' && !Array.isArray(b[k])) a[k]=deepMerge(a[k]||{},b[k]); else a[k]=b[k]; } return a; }

function injectStyles(state){
  if (document.getElementById('marxia-chatbot-css')) return;
  const s = document.createElement('style'); s.id='marxia-chatbot-css';
  s.textContent = `
    .mx-shell{position:relative;z-index:99996}
    .mx-fab{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:18px;z-index:99999;display:inline-flex;align-items:center;gap:10px;
      padding:0 20px;min-height:56px;border:none;border-radius:999px;background:linear-gradient(135deg,#22c3a6,#47e3c6);color:#07101d;
      font-weight:900;font-size:15px;letter-spacing:.01em;box-shadow:0 18px 32px rgba(34,195,166,.35);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease;
      will-change:transform,box-shadow}
    .mx-fab:hover{transform:translateY(-2px);box-shadow:0 20px 40px rgba(34,195,166,.45)}
    .mx-fab:active{transform:translateY(0);box-shadow:0 12px 20px rgba(34,195,166,.25)}
    .mx-fab:focus-visible{outline:2px solid #f7f9ff;outline-offset:4px}
    .mx-fab__icon{font-size:22px;line-height:1}
    .mx-fab__label{white-space:nowrap}
    .mx-fab__badge{position:absolute;top:-4px;right:-4px;background:#ffb347;color:#07101d;border-radius:999px;padding:2px 6px;font-size:11px;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,.25)}
    .mx-fab--compact{width:58px;padding:0;justify-content:center}
    .mx-fab--compact .mx-fab__label{display:none}
    .mx-scrim{position:fixed;inset:0;background:rgba(10,14,25,.55);backdrop-filter:blur(2px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease;z-index:99997}
    .mx-scrim.mx-scrim--visible{opacity:1;visibility:visible}
    .mx-panel{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:98px;width:360px;max-height:72vh;display:flex;flex-direction:column;
      background:var(--card,#161a2b);color:var(--fg,#e8eef6);border:1px solid var(--line,#2b2f40);border-radius:18px;overflow:hidden;z-index:99998;
      box-shadow:0 26px 58px rgba(0,0,0,.38);opacity:0;visibility:hidden;transform:translateY(12px);pointer-events:none;transition:opacity .22s ease,transform .22s ease,visibility .22s ease}
    .mx-panel.mx-panel--open{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}
    .mx-head{padding:12px 16px;font-weight:900;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#1c233a,#172034)}
    .mx-body{padding:12px;height:360px;overflow:auto;display:flex;flex-direction:column;gap:8px}
    .mx-foot{padding:12px;border-top:1px solid var(--line,#2b2f40);display:flex;gap:6px}
    .mx-msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
    .mx-bot{background:rgba(255,255,255,.06);border:1px solid var(--line,#2b2f40)}
    .mx-user{background:#22c3a6;color:#0b0f18;border:1px solid #1aa58a;margin-left:auto}
    .mx-quick{display:flex;flex-wrap:wrap;gap:6px}
    .mx-chip{padding:6px 9px;border-radius:999px;border:1px solid var(--line,#2b2f40);background:transparent;color:inherit;cursor:pointer;font-weight:800;font-size:12px}
    .mx-btn{padding:8px 12px;border-radius:10px;border:1px solid var(--line,#2b2f40);background:#22c3a6;color:#0b0f18;font-weight:900;cursor:pointer}
    .mx-link{display:inline-block;margin-top:8px;padding:8px 10px;border-radius:8px;border:1px dashed #5bc7b6;color:#22c3a6;text-decoration:none;font-weight:900}
    .mx-input{flex:1;padding:10px;border-radius:12px;border:1px solid var(--line,#2b2f40);background:var(--card,#161a2b);color:var(--fg,#e8eef6)}
    .mx-typing{opacity:.7;font-style:italic}
    .mx-disclaimer{font-size:12px;opacity:.75}
    @media (max-width:720px){
      .mx-panel{width:min(100vw-24px,420px)}
    }
    @media (max-width:480px){
      .mx-panel{width:min(100vw-20px,380px);bottom:94px}
      .mx-fab{padding:0 16px;min-height:52px}
      .mx-fab__label{display:none}
    }
    @media (prefers-reduced-motion:reduce){
      .mx-panel,.mx-fab,.mx-scrim{transition:none !important}
    }
  `;
  document.head.appendChild(s);
}
function buildWidget(state){
  const wrap = document.createElement('div');
  wrap.className = 'mx-shell';

  const fab = document.createElement('button');
  fab.className = 'mx-fab';
  fab.id = 'mx-fab';
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'mx-panel');
  fab.setAttribute('aria-label', state.ui.fab?.ariaLabel || 'Abrir chat');
  if (state.ui.fab?.variant === 'compact' || state.ui.fab?.showLabel === false) fab.classList.add('mx-fab--compact');

  const icon = document.createElement('span');
  icon.className = 'mx-fab__icon';
  icon.textContent = state.ui.fab?.icon ?? '💬';
  fab.appendChild(icon);

  if (state.ui.fab?.showLabel !== false) {
    const label = document.createElement('span');
    label.className = 'mx-fab__label';
    label.textContent = state.ui.fab?.label || 'Chat';
    fab.appendChild(label);
  }

  if (state.ui.fab?.badge) {
    const badge = document.createElement('span');
    badge.className = 'mx-fab__badge';
    badge.textContent = state.ui.fab.badge;
    fab.appendChild(badge);
  }

  const scrim = document.createElement('div');
  scrim.id = 'mx-scrim';
  scrim.className = 'mx-scrim';
  scrim.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'mx-panel';
  panel.id = 'mx-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', state.ui.fab?.dialogLabel || 'Asistente de pedidos');
  panel.innerHTML = `
    <div class="mx-head"><div>Asistente Marxia</div><button class="mx-chip" id="mx-close" type="button" aria-label="Cerrar chat">×</button></div>
    <div class="mx-body" id="mx-body"></div>
    <div class="mx-foot">
      <input class="mx-input" id="mx-input" placeholder="Escribe tu duda… (total, enviar, etc.)" aria-label="Escribe tu pregunta">
      <button class="mx-btn" id="mx-send" type="button">Enviar</button>
    </div>
  `;

  wrap.appendChild(fab);
  wrap.appendChild(scrim);
  wrap.appendChild(panel);
  return wrap;
}
function attach(wrap){ document.body.appendChild(wrap); }

/* -------------------- Conversation UI -------------------- */
function ui(root){
  const body = root.querySelector('#mx-body');
  return {
    body,
    msg(text, who='bot'){
      const b = document.createElement('div');
      b.className = 'mx-msg ' + (who==='bot'?'mx-bot':'mx-user');
      b.innerHTML = text;
      body.appendChild(b);
      body.scrollTop = body.scrollHeight;
    },
    typing(on=true){
      if (on) {
        const t = document.createElement('div');
        t.className = 'mx-msg mx-bot mx-typing';
        t.textContent = 'Escribiendo…';
        body.appendChild(t); body._typing = t;
      } else if (body._typing){ body.removeChild(body._typing); body._typing=null; }
      body.scrollTop = body.scrollHeight;
    },
    chips(list){
      const wrap = document.createElement('div'); wrap.className='mx-quick';
      list.forEach(({label, action})=>{
        const c=document.createElement('button'); c.className='mx-chip'; c.textContent=label;
        c.onclick=()=>action();
        wrap.appendChild(c);
      });
      body.appendChild(wrap); body.scrollTop = body.scrollHeight;
    },
    link(text, href){
      const a=document.createElement('a'); a.className='mx-link'; a.href=href; a.target='_blank'; a.textContent=text;
      body.appendChild(a); body.scrollTop = body.scrollHeight;
    },
    disclaimer(text){
      const d=document.createElement('div'); d.className='mx-msg mx-bot mx-disclaimer'; d.textContent=text;
      body.appendChild(d); body.scrollTop = body.scrollHeight;
    }
  };
}

function greeting(root, state){
  const U = ui(root);
  if (state.flags.booted) return;
  U.disclaimer('Loading… may take a moment. / Cargando… puede tomar un momento.');
  U.msg(`<strong>¡Hola! Soy tu asistente de pedidos Marxia.</strong><br>Puedo calcular <em>total</em>, desglosar <em>IVA</em> y <em>enviar</em> la orden al cliente o al negocio.`,'bot');
  U.chips([
    {label:'Ver total', action:()=>handleText('total', root, state)},
    {label:'Enviar al cliente', action:()=>handleText('enviar cliente', root, state)},
    {label:'Enviar al negocio', action:()=>handleText('enviar negocio', root, state)}
  ]);
  // Highlight Tiny link
  if (state.tiny.link) U.link(state.tiny.link.text, state.tiny.link.href);
  state.flags.booted = true;
}

/* -------------------- Event wiring -------------------- */
function wireWidget(root, state){
  const panel = root.querySelector('#mx-panel');
  const fab = root.querySelector('#mx-fab');
  const scrim = root.querySelector('#mx-scrim');
  const closeBtn = root.querySelector('#mx-close');
  const input = root.querySelector('#mx-input');
  const sendBtn = root.querySelector('#mx-send');

  const isOpen = ()=>panel.classList.contains('mx-panel--open');
  const showPanel = ()=>{
    panel.classList.add('mx-panel--open');
    fab.setAttribute('aria-expanded', 'true');
    if (scrim) {
      scrim.hidden = false;
      requestAnimationFrame(()=>scrim.classList.add('mx-scrim--visible'));
    }
    if (state.ui?.fab?.autoFocus !== false) {
      setTimeout(()=>input?.focus(), 180);
    }
  };
  const hidePanel = ()=>{
    panel.classList.remove('mx-panel--open');
    fab.setAttribute('aria-expanded', 'false');
    if (scrim) {
      scrim.classList.remove('mx-scrim--visible');
      setTimeout(()=>{ if (!isOpen()) scrim.hidden = true; }, 220);
    }
  };

  fab.addEventListener('click', ()=>{ isOpen() ? hidePanel() : showPanel(); });
  closeBtn?.addEventListener('click', hidePanel);
  scrim?.addEventListener('click', hidePanel);

  root.addEventListener('keydown', e=>{
    if (e.key === 'Escape' && isOpen()){
      hidePanel();
      fab.focus();
    }
  });

  sendBtn.onclick = ()=>{
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    handleText(v, root, state);
  };
  input.addEventListener('keydown', e=>{
    if (e.key==='Enter'){ e.preventDefault(); sendBtn.click(); }
  });
}

/* -------------------- App Logic -------------------- */
function snapshotOrder(){
  // Prefer global cart Map your app already uses:
  let items=[];
  if (window.cart instanceof Map && window.cart.size){
    items = Array.from(window.cart.values()).map(line => ({
      item: line.name,
      description: line.desc || line.name,
      qty: line.qty,
      unit_price_usd: +(line.priceCents/100).toFixed(2)
    }));
  } else {
    // Fallback: extract from DOM if needed
    document.querySelectorAll('#cart .line').forEach(row=>{
      const name = row.querySelector('div:first-child')?.textContent?.trim() || 'Item';
      const qty  = +(row.querySelector('.qtybox span')?.textContent?.trim() || '1');
      const priceTxt = row.querySelector('div:last-child strong')?.textContent || '$0';
      const total = parseFloat(priceTxt.replace(/[^\d.]/g,'')||'0');
      const unit  = +(total/Math.max(qty,1)).toFixed(2);
      items.push({ item:name, description:name, qty, unit_price_usd:unit });
    });
  }
  const deliveryFee = +((document.getElementById('delivery-fee')?.value)||0);
  const customerName = document.getElementById('customer-name')?.value || '';
  const deliveryAddress = document.getElementById('delivery-address')?.value || '';
  const whatsapp = document.getElementById('whatsapp')?.value || '';
  const customerEmail = document.getElementById('customer-email')?.value || '';
  const businessEmail = document.getElementById('business-email')?.value || '';
  return { items, deliveryFee, customerName, deliveryAddress, whatsapp, customerEmail, businessEmail };
}
function computeTotals(items, deliveryFee, iva=0.15){
  const sub = +(items.reduce((s,i)=>s + i.unit_price_usd * i.qty, 0).toFixed(2));
  const vat = +(sub * iva).toFixed(2);
  const tot = +(sub + vat + (deliveryFee||0)).toFixed(2);
  return { subtotal: sub, vat, total: tot };
}
function genInvoice(){
  const now = new Date();
  const d = now.toISOString().slice(0,10).replace(/-/g,'');
  const r = Math.random().toString(36).slice(2,7).toUpperCase();
  return `INV-${d}-${r}`;
}

async function postToGAS(endpoint, payload){
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // simple request (no preflight)
    body: JSON.stringify(payload)
  });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { success:false, raw:txt }; }
}

async function handleText(text, root, state){
  const U = ui(root);
  U.msg(text,'user');
  U.typing(true);

  try{
    // 1) Get intent via Tiny engine (ONNX/WebLLM) or fallback
    const intent = await resolveIntent(text, state);

    // 2) Route
    if (intent === 'total') {
      const snap = snapshotOrder();
      if (!snap.items.length) { U.typing(false); U.msg('No veo ítems en el carrito. Agrega opciones y pregúntame de nuevo.','bot'); return; }
      const {subtotal, vat, total} = computeTotals(snap.items, snap.deliveryFee, state.ivaRate);
      U.typing(false);
      U.msg(`
        <div><strong>Resumen:</strong></div>
        <div>Subtotal: <strong>$${subtotal.toFixed(2)}</strong></div>
        <div>Entrega: <strong>$${(+snap.deliveryFee||0).toFixed(2)}</strong></div>
        <div>IVA (15%): <strong>$${vat.toFixed(2)}</strong></div>
        <div style="font-size:16px;margin-top:6px;">TOTAL: <strong>$${total.toFixed(2)}</strong></div>
      `,'bot');
      U.chips([
        {label:'Enviar al cliente', action:()=>handleText('enviar cliente', root, state)},
        {label:'Enviar al negocio', action:()=>handleText('enviar negocio', root, state)},
        {label:'Enviar a ambos',    action:()=>handleText('enviar ambos', root, state)}
      ]);
      return;
    }

    if (intent === 'enviar_cliente' || intent === 'enviar_negocio' || intent === 'enviar_ambos') {
      const snap = snapshotOrder();
      if (!snap.items.length) throw new Error('Carrito vacío.');
      if (!snap.customerName || !snap.deliveryAddress || !snap.whatsapp || !snap.customerEmail)
        throw new Error('Faltan datos del cliente.');

      const invoiceNumber = genInvoice();
      const payload = {
        date: new Date().toLocaleDateString('es-EC'),
        invoiceNumber,
        customerName: snap.customerName,
        deliveryAddress: snap.deliveryAddress,
        whatsapp: snap.whatsapp,
        customerEmail: snap.customerEmail,
        businessEmail: snap.businessEmail || '',
        deliveryFee: +(+snap.deliveryFee||0).toFixed(2),
        status: 'pending',
        user_agent: navigator.userAgent || '',
        source_ip: '',
        orderItems: snap.items
      };
      const resp = await postToGAS(state.endpoint, payload);
      if (!resp || !resp.success) throw new Error(resp?.error || 'Error al enviar');

      // WhatsApp for cliente (if pdfUrl present)
      if ((intent==='enviar_cliente' || intent==='enviar_ambos') && snap.whatsapp){
        const { total } = computeTotals(snap.items, snap.deliveryFee, state.ivaRate);
        const phone = snap.whatsapp.replace(/\D/g,'');
        const msg = `Factura ${invoiceNumber} — Total: $${Number(total).toFixed(2)}${resp.pdfUrl?` — PDF: ${resp.pdfUrl}`:''}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
      }
      U.typing(false);
      U.msg(`✅ Listo. Factura <strong>${resp.invoiceNumber || invoiceNumber}</strong> registrada.`, 'bot');
      return;
    }

    if (intent === 'repo_help') {
      if (!state.repo.enabled) {
        U.typing(false);
        U.msg('Tengo acceso <strong>solo de lectura</strong> al repositorio (sin permisos de edición). Actívalo en config.repo.enabled si deseas lecturas.', 'bot');
      } else {
        U.typing(false);
        U.msg('Lectura de repo habilitada (GET-only). No puedo editar, ni aunque me lo pidas.', 'bot');
      }
      return;
    }

    if (intent === 'menu_query') {
      if (!state.search?.enabled){
        U.typing(false);
        U.msg('La búsqueda está deshabilitada.', 'bot');
        return;
      }
      const idx = ensureSearchIndex(state);
      if (!idx || !idx.docs.length){
        U.typing(false);
        U.msg('Aún no tengo el menú disponible para buscar.', 'bot');
        return;
      }
      const hits = bm25Score(text, idx).slice(0, state.search.topK || 3);
      if (!hits.length){
        U.typing(false);
        U.msg('No encontré coincidencias en el menú. Intenta con otro término (por ej., “opción 3” o “huevo”).', 'bot');
        return;
      }
      U.typing(false);
      const rows = hits.map(h => {
        const d = idx.docs[h.doc];
        const cents = Number.isFinite(d.priceCents) ? d.priceCents : 0;
        const price = (cents/100).toLocaleString('es-EC',{style:'currency', currency:'USD'});
        return `<li><strong>${escapeHtml(d.title)}</strong> — ${escapeHtml(d.desc)} <em>(${price})</em></li>`;
      }).join('');
      U.msg(`<div><strong>Sugerencias del menú:</strong></div><ul>${rows}</ul>`, 'bot');
      U.chips([
        {label:'Ver total', action:()=>handleText('total', root, state)},
        {label:'Enviar al cliente', action:()=>handleText('enviar cliente', root, state)}
      ]);
      return;
    }

    // default
    U.typing(false);
    U.msg('Puedo calcular <em>total</em>, <em>IVA</em>, <em>enviar</em> la orden (cliente/negocio/ambos) y responder sobre el <em>menú</em>.','bot');

  }catch(err){
    U.typing(false);
    U.msg(`⚠️ ${err.message || 'Ocurrió un error.'}`, 'bot');
    console.error(err);
  }
}

/* -------------------- Tiny Engines -------------------- */
// Intent labels for fallback matching
const FALLBACK_RULES = [
  { re: /(total|iva|subtotal|cu[aá]nto)/i, intent:'total' },
  { re: /enviar.*amb(os)?/i, intent:'enviar_ambos' },
  { re: /enviar.*client(e)?/i, intent:'enviar_cliente' },
  { re: /enviar.*(negocio|dueñ|owner)/i, intent:'enviar_negocio' },
  { re: /(repo|github|c[oó]digo)/i, intent:'repo_help' },
  // NEW — menu queries
  { re: /(qu[eé]\s+incluye|qu[eé]\s+lleva|ingredientes?|describ[ei]|opci[oó]n\s*\d+)/i, intent:'menu_query' }
];

async function resolveIntent(text, state){
  // ONNX path
  if (state.tiny.mode==='onnx' && state.tinyCtx.session) {
    try {
      const out = await onnxInferIntent(text, state);
      if (out) return out;
    } catch (e) { console.warn('ONNX inference fallback:', e); }
  }
  // WebLLM path
  if (state.tiny.mode==='webllm' && state.tinyCtx.engine) {
    try {
      const out = await webllmInferIntent(text, state);
      if (out) return out;
    } catch (e) { console.warn('WebLLM inference fallback:', e); }
  }
  // Fallback rules
  for (const rule of FALLBACK_RULES) if (rule.re.test(text)) return rule.intent;
  return 'unknown';
}

/* ----- ONNX Runtime Web (optional) ----- */
async function initONNX(state){
  if (!window.ort) throw new Error('onnxruntime-web not loaded');
  const wasmBase = state?.tiny?.onnx?.wasmBase || 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
  window.ort.env.wasm.wasmPaths = wasmBase;
  const modelUrl = state?.tiny?.onnx?.modelUrl;
  if (!modelUrl) throw new Error('No ONNX modelUrl provided');
  state.tinyCtx.session = await window.ort.InferenceSession.create(modelUrl);
  // You can load a tokenizer or vocab here if needed
}
async function onnxInferIntent(text, state){
  // Minimal placeholder: turn text into toy features; REMAP to your model’s actual input
  const inputIds = simpleHashToFixedArray(text, 16); // toy demo vector
  const input = new Float32Array(inputIds);
  const feeds = { input: new window.ort.Tensor('float32', input, [1, input.length]) };
  const out = await state.tinyCtx.session.run(feeds);
  // Assume single output 'logits' with order: [total, enviar_cliente, enviar_negocio, enviar_ambos, repo_help, menu_query]
  const logits = (Object.values(out)[0]?.data) || [];
  const idx = argmax(logits);
  return ['total','enviar_cliente','enviar_negocio','enviar_ambos','repo_help','menu_query'][idx] || 'unknown';
}

/* ----- WebLLM (optional) ----- */
async function initWebLLM(state){
  if (!window.webllm || !window.webllm.CreateWebWorkerEngine) throw new Error('WebLLM not loaded');
  const { modelId='Qwen2.5-0.5B-instruct-q4f16_1', workerUrl } = state.tiny.webllm || {};
  state.tinyCtx.engine = await window.webllm.CreateWebWorkerEngine(
    new URL(workerUrl, location.origin),
    { model_id: modelId, log_level: 'warn' }
  );
}
async function webllmInferIntent(text, state){
  const sys = 'You map user messages to one of intents: total | enviar_cliente | enviar_negocio | enviar_ambos | repo_help | menu_query. Reply with only the intent token.';
  const prompt = `User: ${text}\nAssistant:`;
  const out = await state.tinyCtx.engine.chat.completions.create({
    messages: [{role:'system', content:sys}, {role:'user', content:prompt}],
    temperature: 0
  });
  const ans = (out?.choices?.[0]?.message?.content || '').trim().toLowerCase();
  if (ans.includes('total')) return 'total';
  if (ans.includes('enviar_ambos') || /enviar.*amb/.test(ans)) return 'enviar_ambos';
  if (ans.includes('enviar_cliente') || /cliente/.test(ans)) return 'enviar_cliente';
  if (ans.includes('enviar_negocio') || /negocio|owner/.test(ans)) return 'enviar_negocio';
  if (ans.includes('repo')) return 'repo_help';
  if (ans.includes('menu_query') || /menu|opcion|ingrediente/.test(ans)) return 'menu_query';
  return 'unknown';
}

/* -------------------- BM25 Offline Search -------------------- */
// Super-simple tokenizer: lowercase, strip accents, keep letters/numbers
function normalizeText(str=''){
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // accents
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function tokenize(str){ return normalizeText(str).split(' ').filter(Boolean); }

function buildMenuCorpus(state){
  // Prefer config.search.menu, else auto-read window.OPTIONS/EXTRAS
  const src = state.search.menu || {
    options: (window.OPTIONS || []).map(o => ({
      id: o.id, title: (o.name?.es || o.name?.en || ''), desc: (o.desc?.es || o.desc?.en || ''), priceCents: o.priceCents
    })),
    extras:  (window.EXTRAS  || []).map(e => ({
      id: e.id, title: (e.name?.es || e.name?.en || ''), desc: (e.name?.es || e.name?.en || ''), priceCents: e.priceCents
    }))
  };

  const docs = [...(src.options||[]), ...(src.extras||[])]
    .map(d => ({
      id: d.id,
      title: d.title || '',
      desc: d.desc || '',
      priceCents: d.priceCents || 0,
      text: `${d.title} ${d.desc}`
    }))
    .filter(d => d.text.trim().length > 0);

  // BM25 index
  const N = docs.length || 1;
  const df = new Map(); // term -> doc freq
  const postings = new Map(); // term -> [{doc, tf}]
  const lengths = [];
  docs.forEach((d, idx) => {
    const toks = tokenize(d.text);
    const tf = new Map();
    toks.forEach(t => tf.set(t, (tf.get(t)||0)+1));
    lengths[idx] = toks.length;
    for (const [term, freq] of tf){
      df.set(term, (df.get(term)||0)+1);
      if (!postings.has(term)) postings.set(term, []);
      postings.get(term).push({ doc: idx, tf: freq });
    }
  });
  const avgdl = lengths.reduce((a,b)=>a+b,0) / N;

  return { docs, df, postings, lengths, avgdl, N };
}

function ensureSearchIndex(state){
  if (!state.search?.enabled) return null;
  if (!state._searchIndex) state._searchIndex = buildMenuCorpus(state);
  return state._searchIndex;
}

function bm25Score(query, index, {k1=1.5, b=0.75} = {}){
  const q = tokenize(query);
  const { df, postings, lengths, avgdl, N } = index;
  const scores = new Map(); // doc -> score

  q.forEach(term=>{
    const ni = df.get(term) || 0;
    if (!ni) return;
    const idf = Math.log( (N - ni + 0.5) / (ni + 0.5) + 1 ); // +1 to keep positive
    const plist = postings.get(term) || [];
    plist.forEach(({doc, tf})=>{
      const dl = lengths[doc] || 1;
      const denom = tf + k1*(1 - b + b*(dl/avgdl));
      const s = idf * ((tf*(k1+1))/denom);
      scores.set(doc, (scores.get(doc) || 0) + s);
    });
  });

  return Array.from(scores.entries())
    .sort((a,b)=>b[1]-a[1])
    .map(([doc,score])=>({ doc, score }));
}

/* -------------------- Utils -------------------- */
function argmax(a){ let m=-1e9,idx=0; for(let i=0;i<a.length;i++) if(a[i]>m){m=a[i];idx=i;} return idx; }
function simpleHashToFixedArray(s, n){ // tiny toy featurizer
  const arr = new Array(n).fill(0);
  for (let i=0;i<s.length;i++){ const k = (s.charCodeAt(i)+i)%n; arr[k]+=1; }
  return arr.map(x=>x/Math.max(1,s.length));
}
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
