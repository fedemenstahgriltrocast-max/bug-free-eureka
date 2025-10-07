// solaria-fab-chatbot.js — Floating action button chatbot with offline Q&A
// This module ships dependency-free and mounts an accessible FAB that opens a
// minimal conversational helper. All logic runs client-side. No network calls
// are issued unless you provide an async resolver.
//
// Public API:
//   import { mountSolariaFabChatbot } from './solaria-fab-chatbot.js';
//   mountSolariaFabChatbot({ ui, messages, qna, resolver });
//
// Config overview:
//   ui: {
//     position: 'right' | 'left',
//     fab: { icon, label, ariaLabel, showLabel, variant },
//     theme: { background, surface, primary }
//   }
//   messages: { welcome, disclaimer, fallback }
//   qna: [ { match: /regex/ or function, reply: string | () => string } ]
//   resolver: async (text, state) => string | null
//
// The bot stays repository-agnostic and does not reference Marxia-specific
// workflows. Feel free to drop the file into any static page.

export async function mountSolariaFabChatbot(config = {}) {
  const state = normalizeConfig(config);
  injectStyles(state);
  const root = buildWidget(state);
  attach(root, state);
  wireWidget(root, state);
  greeting(root, state);
  return root;
}

/* -------------------- Config -------------------- */
function normalizeConfig(cfg){
  const defaults = {
    ui: {
      position: 'right',
      fab: {
        icon: '✨',
        label: 'Solaria',
        ariaLabel: 'Open Solaria assistant',
        showLabel: true,
        variant: 'extended'
      },
      theme: {
        background: 'linear-gradient(135deg, #1d233b, #151c2d)',
        surface: 'var(--sb-surface, #151a2b)',
        primary: '#5cf1d4'
      }
    },
    messages: {
      welcome: '<strong>Hola, soy Solaria.</strong><br>Puedo compartir enlaces rápidos y recordatorios clave de tu proyecto.',
      disclaimer: 'Loading… may take a moment. / Cargando… puede tomar un momento.',
      fallback: 'Tomo nota, pero por ahora solo puedo compartir atajos preconfigurados.'
    },
    suggestions: [
      { label: 'Ver documentación', value: 'documentacion' },
      { label: 'Contactar soporte', value: 'soporte' },
      { label: 'Resumen de cambios', value: 'resumen' }
    ],
    qna: [
      { match: /(doc|document)/i, reply: '📘 Documentación: <a href="https://example.com/docs" target="_blank" rel="noopener">https://example.com/docs</a>' },
      { match: /(soporte|support)/i, reply: '💬 Escríbenos a <a href="mailto:help@example.com">help@example.com</a> y responderemos en minutos.' },
      { match: /(resumen|changelog|cambios)/i, reply: 'Últimos cambios: mejoras de rendimiento, auditoría de seguridad y nuevo panel de métricas.' }
    ],
    resolver: null
  };
  return deepMerge(defaults, cfg || {});
}
function deepMerge(a,b){
  if (!b || typeof b !== 'object') return a;
  const out = Array.isArray(a) ? [...a] : { ...a };
  Object.keys(b).forEach(k => {
    const src = out[k];
    const val = b[k];
    if (Array.isArray(val)) {
      out[k] = val.slice();
    } else if (val && typeof val === 'object') {
      out[k] = deepMerge(src || {}, val);
    } else {
      out[k] = val;
    }
  });
  return out;
}

/* -------------------- Styles & DOM -------------------- */
function injectStyles(state){
  if (document.getElementById('solaria-fab-css')) return;
  const s = document.createElement('style');
  s.id = 'solaria-fab-css';
  s.textContent = `
    .sb-shell{position:relative;z-index:99950}
    .sb-fab{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:18px;z-index:99999;display:inline-flex;align-items:center;gap:10px;
      padding:0 22px;min-height:56px;border:none;border-radius:999px;background:${state.ui.theme.primary};color:#041019;font-weight:900;font-size:15px;
      letter-spacing:.01em;box-shadow:0 18px 36px rgba(92,241,212,.35);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease;
      will-change:transform,box-shadow}
    .sb-fab:hover{transform:translateY(-2px);box-shadow:0 22px 48px rgba(92,241,212,.45)}
    .sb-fab:active{transform:translateY(0);box-shadow:0 12px 24px rgba(92,241,212,.25)}
    .sb-fab:focus-visible{outline:2px solid #f7f9ff;outline-offset:4px}
    .sb-fab__icon{font-size:22px;line-height:1}
    .sb-fab__label{white-space:nowrap}
    .sb-fab--compact{width:58px;padding:0;justify-content:center}
    .sb-fab--compact .sb-fab__label{display:none}
    .sb-scrim{position:fixed;inset:0;background:rgba(7,12,20,.55);backdrop-filter:blur(2px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease;z-index:99997}
    .sb-scrim.sb-scrim--visible{opacity:1;visibility:visible}
    .sb-panel{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:98px;width:340px;max-height:70vh;display:flex;flex-direction:column;
      background:${state.ui.theme.surface};color:#e8efff;border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;z-index:99998;
      box-shadow:0 24px 56px rgba(0,0,0,.35);opacity:0;visibility:hidden;transform:translateY(12px);pointer-events:none;transition:opacity .22s ease,transform .22s ease,visibility .22s ease}
    .sb-panel.sb-panel--open{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}
    .sb-head{padding:12px 16px;font-weight:900;display:flex;align-items:center;justify-content:space-between;background:${state.ui.theme.background}}
    .sb-body{padding:12px;height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px}
    .sb-foot{padding:12px;border-top:1px solid rgba(255,255,255,.12);display:flex;gap:6px}
    .sb-msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
    .sb-bot{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)}
    .sb-user{background:${state.ui.theme.primary};color:#041019;border:1px solid rgba(4,16,25,.25);margin-left:auto}
    .sb-quick{display:flex;flex-wrap:wrap;gap:6px}
    .sb-chip{padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;cursor:pointer;font-weight:800;font-size:12px}
    .sb-input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(13,18,32,.85);color:#e8efff}
    .sb-btn{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:${state.ui.theme.primary};color:#041019;font-weight:900;cursor:pointer}
    .sb-typing{opacity:.7;font-style:italic}
    .sb-disclaimer{opacity:.75;font-size:12px}
    .sb-link{color:${state.ui.theme.primary};text-decoration:none;font-weight:700}
    @media (max-width:620px){
      .sb-panel{width:min(100vw-24px,380px)}
    }
    @media (max-width:480px){
      .sb-fab{padding:0 16px;min-height:52px}
      .sb-fab__label{display:none}
    }
    @media (prefers-reduced-motion:reduce){
      .sb-panel,.sb-fab,.sb-scrim{transition:none !important}
    }
  `;
  document.head.appendChild(s);
}

function buildWidget(state){
  const wrap = document.createElement('div');
  wrap.className = 'sb-shell';

  const fab = document.createElement('button');
  fab.className = 'sb-fab';
  fab.id = 'sb-fab';
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'sb-panel');
  fab.setAttribute('aria-label', state.ui.fab?.ariaLabel || 'Open assistant');
  if (state.ui.fab?.variant === 'compact' || state.ui.fab?.showLabel === false) fab.classList.add('sb-fab--compact');

  const icon = document.createElement('span');
  icon.className = 'sb-fab__icon';
  icon.textContent = state.ui.fab?.icon ?? '✨';
  fab.appendChild(icon);

  if (state.ui.fab?.showLabel !== false) {
    const label = document.createElement('span');
    label.className = 'sb-fab__label';
    label.textContent = state.ui.fab?.label || 'Assistant';
    fab.appendChild(label);
  }

  const scrim = document.createElement('div');
  scrim.id = 'sb-scrim';
  scrim.className = 'sb-scrim';
  scrim.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'sb-panel';
  panel.id = 'sb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', state.ui.fab?.dialogLabel || 'Assistant dialog');
  panel.innerHTML = `
    <div class="sb-head">
      <div>Solaria Assistant</div>
      <button class="sb-chip" id="sb-close" type="button" aria-label="Close assistant">×</button>
    </div>
    <div class="sb-body" id="sb-body"></div>
    <div class="sb-foot">
      <input class="sb-input" id="sb-input" placeholder="Escribe tu duda… / Type your request…" aria-label="Message the assistant">
      <button class="sb-btn" id="sb-send" type="button">Enviar</button>
    </div>
  `;

  wrap.appendChild(fab);
  wrap.appendChild(scrim);
  wrap.appendChild(panel);
  return wrap;
}

function attach(wrap){ document.body.appendChild(wrap); }

/* -------------------- UI Helpers -------------------- */
function ui(root){
  const body = root.querySelector('#sb-body');
  return {
    body,
    msg(text, who='bot'){
      const div = document.createElement('div');
      div.className = `sb-msg ${who==='bot'?'sb-bot':'sb-user'}`;
      div.innerHTML = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    },
    typing(on=true){
      if (on){
        const div = document.createElement('div');
        div.className = 'sb-msg sb-bot sb-typing';
        div.textContent = 'Escribiendo…';
        body.appendChild(div);
        body._typing = div;
      } else if (body._typing){
        body.removeChild(body._typing);
        body._typing = null;
      }
      body.scrollTop = body.scrollHeight;
    },
    chips(list){
      if (!list?.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'sb-quick';
      list.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'sb-chip';
        btn.type = 'button';
        btn.textContent = item.label;
        btn.onclick = ()=> item.action?.();
        wrap.appendChild(btn);
      });
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    },
    disclaimer(text){
      const div = document.createElement('div');
      div.className = 'sb-msg sb-bot sb-disclaimer';
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
  };
}

function greeting(root, state){
  const U = ui(root);
  U.disclaimer(state.messages.disclaimer);
  U.msg(state.messages.welcome, 'bot');
  U.chips(state.suggestions.map(item => ({
    label: item.label,
    action: ()=>handleText(item.value, root, state)
  })));
}

/* -------------------- Event Wiring -------------------- */
function wireWidget(root, state){
  const panel = root.querySelector('#sb-panel');
  const fab = root.querySelector('#sb-fab');
  const scrim = root.querySelector('#sb-scrim');
  const closeBtn = root.querySelector('#sb-close');
  const input = root.querySelector('#sb-input');
  const sendBtn = root.querySelector('#sb-send');

  const isOpen = ()=>panel.classList.contains('sb-panel--open');
  const showPanel = ()=>{
    panel.classList.add('sb-panel--open');
    fab.setAttribute('aria-expanded', 'true');
    if (scrim){
      scrim.hidden = false;
      requestAnimationFrame(()=>scrim.classList.add('sb-scrim--visible'));
    }
    setTimeout(()=>input.focus(), 160);
  };
  const hidePanel = ()=>{
    panel.classList.remove('sb-panel--open');
    fab.setAttribute('aria-expanded', 'false');
    if (scrim){
      scrim.classList.remove('sb-scrim--visible');
      setTimeout(()=>{ if (!isOpen()) scrim.hidden = true; }, 200);
    }
  };

  fab.addEventListener('click', ()=>{ isOpen() ? hidePanel() : showPanel(); });
  closeBtn.addEventListener('click', hidePanel);
  scrim.addEventListener('click', hidePanel);
  root.addEventListener('keydown', e=>{
    if (e.key === 'Escape' && isOpen()){
      hidePanel();
      fab.focus();
    }
  });

  const send = ()=>{
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    handleText(value, root, state);
  };
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e=>{
    if (e.key === 'Enter'){ e.preventDefault(); send(); }
  });
}

/* -------------------- Core Logic -------------------- */
async function handleText(text, root, state){
  const U = ui(root);
  U.msg(escapeHtml(text), 'user');
  U.typing(true);
  try {
    const reply = await resolveReply(text, state);
    U.typing(false);
    U.msg(reply, 'bot');
  } catch (err){
    console.error(err);
    U.typing(false);
    U.msg('Algo salió mal. Intenta de nuevo en unos segundos.', 'bot');
  }
}

async function resolveReply(text, state){
  for (const rule of state.qna){
    try {
      if (typeof rule.match === 'function' && rule.match(text, state)){
        return typeof rule.reply === 'function' ? await rule.reply(text, state) : rule.reply;
      }
      if (rule.match instanceof RegExp){
        rule.match.lastIndex = 0;
        if (rule.match.test(text)){
          return typeof rule.reply === 'function' ? await rule.reply(text, state) : rule.reply;
        }
      }
    } catch (err){
      console.warn('QnA rule failed', err);
    }
  }
  if (typeof state.resolver === 'function'){
    const out = await state.resolver(text, state);
    if (out) return out;
  }
  return state.messages.fallback;
}

/* -------------------- Utils -------------------- */
function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
