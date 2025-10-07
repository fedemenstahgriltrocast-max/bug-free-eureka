// marxia-menu-bot.js — Menu-only chatbot (BM25 + synonyms + fuzzy), NPM-free
// Expected data sources already on page:
//   window.OPTIONS = [{id, name:{es|en}, desc:{es|en}, priceCents}, ...]
//   window.EXTRAS  = [{id, name:{es|en}, priceCents}, ...]
// This bot ONLY talks about the menu. Any off-topic request => polite disclosure.
//
// Public API:
//   import { mountMarxiaMenuBot } from './marxia-menu-bot.js';
//   mountMarxiaMenuBot({ ui: { position:'right'|'left' }, locale:'es-EC', currency:'USD', topK:3 });

export async function mountMarxiaMenuBot(cfg = {}) {
  const state = norm({
    locale: 'es-EC',
    currency: 'USD',
    topK: 3,
    ui: { position: 'right' },   // or 'left'
    lang: 'es',                  // 'es' or 'en' for titles/descriptions
  }, cfg);

  injectStyles(state);
  const root = buildWidget(state);
  attach(root);
  wire(root, state);

  // Build index once
  state.index = buildIndexFromWindow(state);
  greet(root, state);
  return root;
}

/* =============== UI =============== */
function injectStyles(state){
  if (document.getElementById('menu-bot-css')) return;
  const s = document.createElement('style'); s.id='menu-bot-css';
  s.textContent = `
    .mb-fab{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:18px;z-index:99999;background:#22c3a6;color:#0b0f18;
      border:none;border-radius:999px;width:58px;height:58px;font-size:22px;box-shadow:0 10px 24px rgba(0,0,0,.25);cursor:pointer}
    .mb-panel{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:86px;width:340px;max-height:70vh;display:none;flex-direction:column;
      background:var(--card,#161a2b);color:var(--fg,#e8eef6);border:1px solid var(--line,#2b2f40);border-radius:16px;overflow:hidden;z-index:99999}
    .mb-head{padding:12px 14px;font-weight:900;display:flex;align-items:center;justify-content:space-between;
      background:linear-gradient(135deg,#1c233a,#172034)}
    .mb-body{padding:10px;height:360px;overflow:auto;display:flex;flex-direction:column;gap:8px}
    .mb-foot{padding:10px;border-top:1px solid var(--line,#2b2f40);display:flex;gap:6px}
    .mb-msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
    .mb-bot{background:rgba(255,255,255,.06);border:1px solid var(--line,#2b2f40)}
    .mb-user{background:#22c3a6;color:#0b0f18;border:1px solid #1aa58a;margin-left:auto}
    .mb-quick{display:flex;flex-wrap:wrap;gap:6px}
    .mb-chip{padding:6px 9px;border-radius:999px;border:1px solid var(--line,#2b2f40);background:transparent;color:inherit;cursor:pointer;font-weight:800;font-size:12px}
    .mb-input{flex:1;padding:10px;border-radius:12px;border:1px solid var(--line,#2b2f40);background:var(--card,#161a2b);color:var(--fg,#e8eef6)}
    .mb-btn{padding:8px 12px;border-radius:10px;border:1px solid var(--line,#2b2f40);background:#22c3a6;color:#0b0f18;font-weight:900;cursor:pointer}
    .mb-typing{opacity:.7;font-style:italic}
    .mb-list{margin:6px 0 0 16px;padding-left:0}
    .mb-list li{margin:4px 0}
  `;
  document.head.appendChild(s);
}
function buildWidget(state){
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button class="mb-fab" id="mb-fab" aria-label="Abrir menú">🍽️</button>
    <div class="mb-panel" id="mb-panel" role="dialog" aria-label="Asistente del menú">
      <div class="mb-head">
        <div>Asistente del Menú</div>
        <button class="mb-chip" id="mb-close">×</button>
      </div>
      <div class="mb-body" id="mb-body"></div>
      <div class="mb-foot">
        <input class="mb-input" id="mb-input" placeholder="Pregunta sobre el menú… (ej. opción 3, huevo, cola)">
        <button class="mb-btn" id="mb-send">Enviar</button>
      </div>
    </div>
  `;
  return wrap;
}
function attach(wrap){ document.body.appendChild(wrap); }
function UI(root){
  const body = root.querySelector('#mb-body');
  return {
    body,
    msg(t, who='bot'){ const b=document.createElement('div'); b.className='mb-msg '+(who==='bot'?'mb-bot':'mb-user'); b.innerHTML=t; body.appendChild(b); body.scrollTop=body.scrollHeight; },
    typing(on=true){
      if (on){ const t=document.createElement('div'); t.className='mb-msg mb-bot mb-typing'; t.textContent='Escribiendo…'; body.appendChild(t); body._typing=t; }
      else if (body._typing){ body.removeChild(body._typing); body._typing=null; }
      body.scrollTop=body.scrollHeight;
    },
    chips(list){
      const w=document.createElement('div'); w.className='mb-quick';
      list.forEach(({label,action})=>{ const c=document.createElement('button'); c.className='mb-chip'; c.textContent=label; c.onclick=action; w.appendChild(c); });
      body.appendChild(w); body.scrollTop=body.scrollHeight;
    }
  };
}
function wire(root, state){
  root.querySelector('#mb-fab').onclick = ()=> root.querySelector('#mb-panel').style.display='flex';
  root.querySelector('#mb-close').onclick = ()=> root.querySelector('#mb-panel').style.display='none';
  const send = ()=>{ const v=root.querySelector('#mb-input').value.trim(); if(!v) return; root.querySelector('#mb-input').value=''; handle(v, root, state); };
  root.querySelector('#mb-send').onclick = send;
  root.querySelector('#mb-input').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } });
}
function greet(root, state){
  const ui = UI(root);
  ui.msg(`<strong>¡Hola!</strong> Pregúntame por el <em>contenido</em> o <em>precio</em> de una opción o extra.`, 'bot');
  ui.chips([
    {label:'Ver opciones', action:()=>handle('lista opciones', root, state)},
    {label:'Ver extras', action:()=>handle('lista extras', root, state)},
    {label:'¿Qué tiene la opción 3?', action:()=>handle('qué incluye opción 3', root, state)}
  ]);
}

/* =============== INDEXING (BM25 + synonyms + fuzzy) =============== */
function buildIndexFromWindow(state){
  const lang = state.lang || 'es';
  const options = (window.OPTIONS||[]).map(o => ({
    id:o.id, kind:'option',
    title:(o.name?.[lang] || o.name?.es || o.name?.en || ''),
    desc:(o.desc?.[lang] || o.desc?.es || o.desc?.en || ''),
    priceCents:o.priceCents||0
  }));
  const extras  = (window.EXTRAS||[]).map(e => ({
    id:e.id, kind:'extra',
    title:(e.name?.[lang] || e.name?.es || e.name?.en || ''),
    desc:(e.name?.[lang] || e.name?.es || e.name?.en || ''),
    priceCents:e.priceCents||0
  }));
  const docs = [...options, ...extras].map(d => ({ ...d, text:`${d.title} ${d.desc}`.trim() })).filter(d=>d.text);

  // BM25 prep
  const N = Math.max(docs.length,1);
  const df = new Map(), postings = new Map(), lengths = [];
  docs.forEach((d, idx)=>{
    const toks = tokenize(d.text);
    const tf = new Map();
    toks.forEach(t=>tf.set(t,(tf.get(t)||0)+1));
    lengths[idx]=toks.length;
    for(const [term,freq] of tf){
      df.set(term,(df.get(term)||0)+1);
      if(!postings.has(term)) postings.set(term,[]);
      postings.get(term).push({doc:idx, tf:freq});
    }
  });
  const avgdl = lengths.reduce((a,b)=>a+b,0)/N;

  return { docs, df, postings, lengths, avgdl, N, lang };
}

/* --- tokenizer, synonyms, fuzzy --- */
function normalizeText(str=''){
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // remove accents
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function tokenize(str){ return normalizeText(str).split(' ').filter(Boolean); }

// small Spanish synonyms (extend freely)
const SYN = {
  bebida: ['refresco','gaseosa','cola','soda'],
  cola: ['bebida','gaseosa'],
  huevo: ['huevos'],
  chorizo: ['salchicha','salchichon'],
  tortilla: ['arepa'/* if relevant */],
  opcion: ['opcion','opciones','combo','menu','plato'],
  incluye: ['lleva','trae','contiene','ingredientes','descripcion','describe'],
  precio: ['cuesta','vale','costo','coste']
};

// Expand a token set with synonyms
function expandSynonyms(tokens){
  const out = new Set(tokens);
  tokens.forEach(t=>{
    const base = t; // already normalized
    // find exact key OR fuzzy-close key
    const key = findBestKey(Object.keys(SYN), base, 1) || base;
    const arr = SYN[key];
    if (arr) arr.forEach(s=>out.add(normalizeText(s)));
  });
  return Array.from(out);
}

// fuzzy helpers
function lev(a,b){
  const m=a.length,n=b.length; const dp=new Array(m+1); for(let i=0;i<=m;i++){dp[i]=new Array(n+1); dp[i][0]=i;}
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const c=(a[i-1]===b[j-1])?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+c);
    }
  }
  return dp[m][n];
}
function findBestKey(keys, token, maxDist=1){
  let best=null, bestD=999;
  keys.forEach(k=>{
    const d=lev(k, token);
    if(d<bestD){bestD=d;best=k;}
  });
  return bestD<=maxDist ? best : null;
}

// BM25 scoring with synonym + fuzzy term lift
function bm25Search(query, index, {k1=1.5, b=0.75, topK=3}={}){
  const raw = tokenize(query);
  const qTokens = expandSynonyms(raw);
  const { df, postings, lengths, avgdl, N } = index;
  const scores = new Map();

  qTokens.forEach(term=>{
    // fuzzy term mapping to existing vocab if close
    const vocab = Array.from(df.keys());
    const t = df.has(term) ? term : (findBestKey(vocab, term, 1) || term);
    const ni = df.get(t) || 0;
    if (!ni) return;

    // small boost if synonym/fuzzy
    const fuzzyBoost = (t!==term)? 0.9 : 1.0;

    const idf = Math.log((N - ni + 0.5) / (ni + 0.5) + 1);
    const plist = postings.get(t) || [];
    plist.forEach(({doc, tf})=>{
      const dl = lengths[doc] || 1;
      const denom = tf + k1*(1 - b + b*(dl/avgdl));
      const s = idf * ((tf*(k1+1))/denom) * fuzzyBoost;
      scores.set(doc, (scores.get(doc)||0) + s);
    });
  });

  return Array.from(scores.entries())
    .sort((a,b)=>b[1]-a[1])
    .slice(0, topK)
    .map(([doc,score])=>({ doc, score }));
}

/* =============== INTENTS (menu-only) =============== */
const RULES = [
  { re: /(qu[eé]\s+incluye|lleva|trae|ingredientes?|describ[ei]|contenido)/i, intent:'menu_details' },
  { re: /(opci[oó]n\s*\d+)/i, intent:'menu_option_ref' },
  { re: /(precio|cuesta|vale|cost[eo])/i, intent:'menu_price' },
  { re: /(lista\s+opciones|ver\s+opciones)/i, intent:'list_options' },
  { re: /(lista\s+extras|ver\s+extras)/i, intent:'list_extras' },
  // catch-all menu search
  { re: /.+/, intent:'menu_search' }
];

function detectIntent(text){
  for (const r of RULES) if (r.re.test(text)) return r.intent;
  return 'menu_search';
}

/* =============== Controller =============== */
async function handle(text, root, state){
  const ui = UI(root);
  ui.msg(text, 'user');
  ui.typing(true);
  try{
    // only menu: if user is clearly off-topic, disclose politely
    if (isOffTopic(text)){
      ui.typing(false);
      ui.msg(`I apologize my focus is on the menu, thank you. Shall we continue?`,'bot');
      return;
    }

    const intent = detectIntent(text);
    const idx = state.index;
    const topK = state.topK || 3;

    // direct option number?
    const optNum = extractOptionNumber(text);

    if (intent==='list_options'){
      ui.typing(false);
      const opts = idx.docs.filter(d=>d.kind==='option');
      ui.msg(renderList(opts.slice(0,10), state), 'bot');
      return;
    }
    if (intent==='list_extras'){
      ui.typing(false);
      const extras = idx.docs.filter(d=>d.kind==='extra');
      ui.msg(renderList(extras.slice(0,10), state), 'bot');
      return;
    }
    if (intent==='menu_option_ref' && optNum){
      const hit = findOptionByNumber(idx, optNum);
      ui.typing(false);
      if (!hit) { ui.msg('No encontré esa opción. ¿Quieres ver la lista de opciones?', 'bot'); return; }
      ui.msg(renderItems([hit], state), 'bot');
      return;
    }
    if (intent==='menu_price' && optNum){
      const hit = findOptionByNumber(idx, optNum);
      ui.typing(false);
      if (!hit) { ui.msg('No encontré esa opción. ¿Quieres ver la lista de opciones?', 'bot'); return; }
      ui.msg(renderPrice(hit, state), 'bot');
      return;
    }

    // menu_details or general menu_search → BM25
    const hits = bm25Search(text, idx, { topK });
    ui.typing(false);
    if (!hits.length){ ui.msg('No encontré coincidencias. Prueba con “opción 2”, “huevo” o “cola”.', 'bot'); return; }
    const docs = hits.map(h=>idx.docs[h.doc]);
    ui.msg(renderItems(docs, state), 'bot');

  } catch(err){
    ui.typing(false);
    ui.msg('Ocurrió un error. Intenta de nuevo.', 'bot');
    console.error(err);
  }
}

/* =============== Helpers =============== */
function norm(a,b){ for(const k in b){ if(b[k] && typeof b[k]==='object' && !Array.isArray(b[k])) a[k]=norm(a[k]||{},b[k]); else a[k]=b[k]; } return a; }
function money(cents, locale='es-EC', currency='USD'){ return (cents/100).toLocaleString(locale, {style:'currency', currency}); }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function isOffTopic(q){
  // very loose: if it mentions send, email, address, payment, etc., treat as off-menu
  return /(enviar|pago|pagar|whatsapp|correo|email|direccion|entrega\s+domicilio|factur[aá]|pdf|sheets?|google|impuesto fuera del menu)/i.test(q);
}
function extractOptionNumber(q){
  const m = q.toLowerCase().match(/opci[oó]n\s*(\d+)/); return m? parseInt(m[1],10):null;
}
function findOptionByNumber(index, n){
  // assumes options are titled like "Opción 1", "Opción 2" (or include the number in text)
  const cand = index.docs.filter(d=>d.kind==='option');
  return cand.find(d => normalizeText(d.title).includes(`opcion ${n}`)) || null;
}
function renderItems(docs, state){
  const items = docs.map(d=>{
    const price = money(d.priceCents, state.locale, state.currency);
    const title = escapeHtml(d.title||'Item');
    const desc  = escapeHtml(d.desc||'');
    return `<li><strong>${title}</strong>${desc?` — ${desc}`:''} <em>(${price})</em></li>`;
  }).join('');
  return `<div><strong>Sugerencias:</strong></div><ul class="mb-list">${items}</ul>`;
}
function renderList(docs, state){
  if (!docs.length) return 'No hay elementos.';
  return renderItems(docs, state);
}
function renderPrice(doc, state){
  return `<div><strong>${escapeHtml(doc.title)}</strong> cuesta <strong>${money(doc.priceCents, state.locale, state.currency)}</strong>.</div>`;
}

