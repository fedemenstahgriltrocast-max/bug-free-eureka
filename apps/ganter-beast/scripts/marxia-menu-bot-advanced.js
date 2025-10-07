// marxia-menu-bot-advanced.js — Menu-only, offline-first bot
// Features: BM25 + synonyms + fuzzy + personalized synonyms (localStorage),
// smart upsell chips, time-based availability message, mini images in results,
// promo nudges, voice in/out (Web Speech API), confidence dot, IndexedDB cache,
// PWA-friendly, CSAT thumbs, disclosure for off-topic.
//
// Expected data present (or provide via config.menu):
//   window.OPTIONS = [{id, name:{es|en}, desc:{es|en}, priceCents, img? }, ...]
//   window.EXTRAS  = [{id, name:{es|en}, priceCents,           img? }, ...]
//
// Public API:
//   import { mountMarxiaMenuBot } from './marxia-menu-bot-advanced.js';
//   mountMarxiaMenuBot({ ui, locale, currency, topK, lang, hours, menu, pwa });

export async function mountMarxiaMenuBot(cfg = {}) {
  const state = norm({
    locale: 'es-EC',
    currency: 'USD',
    topK: 3,
    lang: 'es',                   // choose 'es' or 'en' fields
    ui: { position:'right' },     // 'left' supported
    hours: {                      // local business hours (example)
      breakfast: { start: '06:00', end: '11:00' } // 24h format, local time
    },
    pwa: { enableHints: true },   // hint to install if offline-ready
    menu: null                    // optional {options:[...], extras:[...]}
  }, cfg);

  injectStyles(state);
  const root = buildWidget(state);
  attach(root);
  wire(root, state);

  // Load menu from IndexedDB (if available), else from window/config; then index
  state.menu = await hydrateMenu(state);
  state.index = buildIndex(state, state.menu);

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
    .mb-panel{position:fixed;${state.ui.position==='left'?'left':'right'}:18px;bottom:86px;width:360px;max-height:72vh;display:none;flex-direction:column;
      background:var(--card,#161a2b);color:var(--fg,#e8eef6);border:1px solid var(--line,#2b2f40);border-radius:16px;overflow:hidden;z-index:99999}
    .mb-head{padding:12px 14px;font-weight:900;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#1c233a,#172034)}
    .mb-body{padding:10px;height:420px;overflow:auto;display:flex;flex-direction:column;gap:8px}
    .mb-foot{padding:10px;border-top:1px solid var(--line,#2b2f40);display:flex;gap:6px}
    .mb-msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.35;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
    .mb-bot{background:rgba(255,255,255,.06);border:1px solid var(--line,#2b2f40)}
    .mb-user{background:#22c3a6;color:#0b0f18;border:1px solid #1aa58a;margin-left:auto}
    .mb-quick{display:flex;flex-wrap:wrap;gap:6px}
    .mb-chip{padding:6px 9px;border-radius:999px;border:1px solid var(--line,#2b2f40);background:transparent;color:inherit;cursor:pointer;font-weight:800;font-size:12px}
    .mb-input{flex:1;padding:10px;border-radius:12px;border:1px solid var(--line,#2b2f40);background:var(--card,#161a2b);color:var(--fg,#e8eef6)}
    .mb-btn{padding:8px 12px;border-radius:10px;border:1px solid var(--line,#2b2f40);background:#22c3a6;color:#0b0f18;font-weight:900;cursor:pointer}
    .mb-typing{opacity:.7;font-style:italic}
    .mb-list{margin:6px 0 0 0;padding-left:0;list-style:none}
    .mb-item{display:flex;gap:8px;align-items:flex-start;margin:6px 0}
    .mb-thumb{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,.12)}
    .mb-title{font-weight:900}
    .mb-meta{font-size:12px;opacity:.8}
    .mb-conf{display:inline-block;width:8px;height:8px;border-radius:999px;margin-left:6px;vertical-align:middle}
    .mb-conf.h{background:#22c3a6}.mb-conf.m{background:#f7c948}.mb-conf.l{background:#ff6b6b}
    .mb-csat{display:flex;gap:8px;align-items:center;margin-top:8px}
    .mb-csat button{padding:6px 8px;border-radius:10px;border:1px solid var(--line,#2b2f40);background:transparent;color:inherit;cursor:pointer}
    .mb-hint{font-size:12px;opacity:.75;margin-top:6px}
    .mb-voice{display:flex;gap:6px;margin-top:6px}
    .mb-disclaimer{font-size:12px;opacity:.75}
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
  const append = el => {
    const anchor = body._voiceBar;
    if (anchor && anchor.parentNode === body) body.insertBefore(el, anchor);
    else body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  };
  return {
    body,
    append,
    msg(t, who='bot'){
      const b=document.createElement('div');
      b.className='mb-msg '+(who==='bot'?'mb-bot':'mb-user');
      b.innerHTML=t;
      append(b);
    },
    typing(on=true){
      if (on){
        const t=document.createElement('div');
        t.className='mb-msg mb-bot mb-typing';
        t.textContent='Escribiendo…';
        body._typing=t;
        append(t);
      } else if (body._typing){
        const t = body._typing;
        if (t.parentNode === body) body.removeChild(t);
        body._typing=null;
        body.scrollTop = body.scrollHeight;
      }
    },
    chips(list){
      const w=document.createElement('div'); w.className='mb-quick';
      list.forEach(({label,action})=>{ const c=document.createElement('button'); c.className='mb-chip'; c.textContent=label; c.onclick=action; w.appendChild(c); });
      append(w);
    },
    disclaimer(text){
      const d=document.createElement('div'); d.className='mb-msg mb-bot mb-disclaimer'; d.textContent=text;
      append(d);
    }
  };
}
function wire(root, state){
  root.querySelector('#mb-fab').onclick = ()=> root.querySelector('#mb-panel').style.display='flex';
  root.querySelector('#mb-close').onclick = ()=> root.querySelector('#mb-panel').style.display='none';
  const send = ()=>{ const v=root.querySelector('#mb-input').value.trim(); if(!v) return; root.querySelector('#mb-input').value=''; handle(v, root, state); };
  root.querySelector('#mb-send').onclick = send;
  root.querySelector('#mb-input').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } });

  // Voice: in/out
  const voiceBar = document.createElement('div');
  voiceBar.className='mb-voice';
  voiceBar.innerHTML = `
    <button class="mb-chip" id="mb-voice-in">🎙️ Hablar</button>
    <button class="mb-chip" id="mb-voice-out">🔊 Leer</button>
  `;
  const body = root.querySelector('#mb-body');
  body.appendChild(voiceBar);
  body._voiceBar = voiceBar;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = state.lang==='es'?'es-EC':'en-US'; rec.interimResults=false; rec.maxAlternatives=1;
    document.getElementById('mb-voice-in').onclick = ()=>{ try{ rec.start(); }catch{} };
    rec.onresult = (e)=>{ const s=e.results[0][0].transcript; root.querySelector('#mb-input').value=s; send(); };
  } else {
    const btn = document.getElementById('mb-voice-in');
    if (btn) btn.disabled = true;
  }
  document.getElementById('mb-voice-out').onclick = ()=>{
    const txt = body.innerText.slice(-400);
    if ('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = state.lang==='es'?'es-EC':'en-US';
      window.speechSynthesis.speak(u);
    }
  };
}
function greet(root, state){
  const ui = UI(root);
  ui.disclaimer('Loading… may take a moment. / Cargando… puede tomar un momento.');
  ui.msg(`<strong>¡Hola!</strong> Pregúntame por el <em>contenido</em> o <em>precio</em> de una opción o extra.`, 'bot');
  ui.chips([
    {label:'Ver opciones', action:()=>handle('lista opciones', root, state)},
    {label:'Ver extras', action:()=>handle('lista extras', root, state)},
    {label:'¿Qué tiene la opción 3?', action:()=>handle('qué incluye opción 3', root, state)}
  ]);
  if (state.pwa?.enableHints && 'serviceWorker' in navigator) {
    ui.msg(`<div class="mb-hint">💡 Tip: añade esta página a tu pantalla de inicio para usar el menú incluso sin internet.</div>`, 'bot');
  }
}

/* =============== MENU LOAD (IndexedDB) =============== */
const DB_NAME='marxia_menu_db', DB_STORE='menu_store', DB_KEY='menu_payload', DB_VER=1;
function hasIndexedDB(){
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
async function hydrateMenu(state){
  if (!hasIndexedDB()){
    return state.menu || readWindowMenu(state.lang);
  }
  let payload = await dbGet(DB_KEY).catch(()=>null);
  if (payload && payload.version && sameMenuShape(payload)) return payload;

  // fallback to window/config and write to DB
  const menu = state.menu || readWindowMenu(state.lang);
  payload = { version: Date.now(), ...menu };
  await dbPut(DB_KEY, payload).catch(()=>{});
  return payload;
}
function sameMenuShape(p){ return p && Array.isArray(p.options) && Array.isArray(p.extras); }
function readWindowMenu(lang='es'){
  const options = (window.OPTIONS||[]).map(o=>({
    id:o.id, kind:'option',
    title:(o.name?.[lang] || o.name?.es || o.name?.en || ''),
    desc:(o.desc?.[lang] || o.desc?.es || o.desc?.en || ''),
    priceCents:o.priceCents||0, img:o.img||''
  }));
  const extras = (window.EXTRAS||[]).map(e=>({
    id:e.id, kind:'extra',
    title:(e.name?.[lang] || e.name?.es || e.name?.en || ''),
    desc:(e.name?.[lang] || e.name?.es || e.name?.en || ''),
    priceCents:e.priceCents||0, img:e.img||''
  }));
  return { options, extras };
}
function dbOpen(){
  if (!hasIndexedDB()) return Promise.reject(new Error('indexedDB unavailable'));
  return new Promise((resolve, reject)=>{
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = ()=>{ r.result.createObjectStore(DB_STORE); };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
async function dbGet(key){
  if (!hasIndexedDB()) return null;
  const db = await dbOpen();
  return new Promise((resolve, reject)=>{
    const tx=db.transaction(DB_STORE,'readonly'); const st=tx.objectStore(DB_STORE);
    const g=st.get(key); g.onsuccess=()=>resolve(g.result); g.onerror=()=>reject(g.error);
  });
}
async function dbPut(key,val){
  if (!hasIndexedDB()) return false;
  const db = await dbOpen();
  return new Promise((resolve, reject)=>{
    const tx=db.transaction(DB_STORE,'readwrite'); const st=tx.objectStore(DB_STORE);
    const p=st.put(val,key); p.onsuccess=()=>resolve(true); p.onerror=()=>reject(p.error);
  });
}

/* =============== INDEXING (BM25 + synonyms + fuzzy + personal synonyms) =============== */
function buildIndex(state, menu){
  const docs = [...menu.options, ...menu.extras]
    .map(d=>({ ...d, text:`${d.title} ${d.desc}`.trim() }))
    .filter(d=>d.text);

  const N = Math.max(docs.length,1);
  const df = new Map(), postings = new Map(), lengths=[];
  docs.forEach((d, idx)=>{
    const toks = tokenize(d.text);
    const tf = new Map(); toks.forEach(t=>tf.set(t,(tf.get(t)||0)+1));
    lengths[idx]=toks.length;
    for(const [term,freq] of tf){
      df.set(term,(df.get(term)||0)+1);
      if(!postings.has(term)) postings.set(term,[]);
      postings.get(term).push({doc:idx, tf:freq});
    }
  });
  const avgdl = lengths.reduce((a,b)=>a+b,0)/N;

  const personalSyn = loadPersonalSynonyms();
  return { docs, df, postings, lengths, avgdl, N, personalSyn };
}

function normalizeText(str=''){
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function tokenize(str){ return normalizeText(str).split(' ').filter(Boolean); }

// base synonyms
const SYN = {
  bebida: ['refresco','gaseosa','cola','soda','bebidas'],
  cola: ['bebida','gaseosa','refresco'],
  huevo: ['huevos'],
  chorizo: ['salchicha','salchichon'],
  tortilla: ['arepa'],
  opcion: ['opcion','opciones','combo','menu','plato'],
  incluye: ['lleva','trae','contiene','ingredientes','descripcion','describe'],
  precio: ['cuesta','vale','costo','coste'],
  cafe: ['café', 'expreso', 'espresso']
};

function loadPersonalSynonyms(){
  try {
    const raw = localStorage.getItem('marxia_synonyms');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function savePersonalSynonyms(map){
  try { localStorage.setItem('marxia_synonyms', JSON.stringify(map)); } catch {}
}

function expandSynonyms(tokens, personal){
  const out = new Set(tokens);
  const addFrom = (map, key)=>{
    const arr = map[key]; if (arr) arr.forEach(s=>out.add(normalizeText(s)));
  };
  tokens.forEach(t=>{
    addFrom(SYN, t);
    if (personal && personal[t]) addFrom(personal, t);
  });
  return Array.from(out);
}

// fuzzy
function lev(a,b){
  const m=a.length,n=b.length; const dp=new Array(m+1);
  for(let i=0;i<=m;i++){ dp[i]=new Array(n+1); dp[i][0]=i; }
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const c=(a[i-1]===b[j-1])?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+c);
    }
  }
  return dp[m][n];
}
function nearestKey(keys, token, maxDist=1){
  let best=null, bestD=99;
  keys.forEach(k=>{ const d=lev(k, token); if (d<bestD){bestD=d;best=k;} });
  return bestD<=maxDist? best : null;
}

function bm25Search(query, index, {k1=1.5, b=0.75, topK=3}={}){
  const raw = tokenize(query);
  const qTokens = expandSynonyms(raw, index.personalSyn);
  const { df, postings, lengths, avgdl, N } = index;
  const scores = new Map();

  qTokens.forEach(term=>{
    const vocab = Array.from(df.keys());
    const mapped = df.has(term) ? term : (nearestKey(vocab, term, 1) || term);
    const ni = df.get(mapped) || 0;
    if (!ni) return;
    const fuzzyBoost = (mapped!==term)? 0.9 : 1.0;

    const idf = Math.log((N - ni + 0.5) / (ni + 0.5) + 1);
    const plist = postings.get(mapped) || [];
    plist.forEach(({doc, tf})=>{
      const dl = lengths[doc] || 1;
      const denom = tf + k1*(1 - b + b*(dl/avgdl));
      const s = idf * ((tf*(k1+1))/denom) * fuzzyBoost;
      scores.set(doc, (scores.get(doc)||0) + s);
    });
  });

  const arr = Array.from(scores.entries()).sort((a,b)=>b[1]-a[1]);
  const max = arr[0]?.[1] || 1;
  // confidence bucket
  const conf = (score)=> score/max >= 0.66 ? 'h' : score/max >= 0.33 ? 'm' : 'l';

  return arr.slice(0, topK).map(([doc,score])=>({ doc, score, conf: conf(score) }));
}

/* =============== INTENTS & CONTROLLER (menu-only) =============== */
const RULES = [
  { re: /(qu[eé]\s+incluye|lleva|trae|ingredientes?|describ[ei]|contenido)/i, intent:'menu_details' },
  { re: /(opci[oó]n\s*\d+)/i, intent:'menu_option_ref' },
  { re: /(precio|cuesta|vale|cost[eo])/i, intent:'menu_price' },
  { re: /(lista\s+opciones|ver\s+opciones)/i, intent:'list_options' },
  { re: /(lista\s+extras|ver\s+extras)/i, intent:'list_extras' },
  // catch-all menu search
  { re: /.+/, intent:'menu_search' }
];
function detectIntent(text){ for (const r of RULES) if (r.re.test(text)) return r.intent; return 'menu_search'; }

function isOffTopic(q){
  // strictly menu-only
  return /(enviar|pago|pagar|whatsapp|correo|email|direccion|factur|pdf|sheets?|google|delivery fee|iva fuera del menu)/i.test(q);
}
function extractOptionNumber(q){ const m=q.toLowerCase().match(/opci[oó]n\s*(\d+)/); return m? parseInt(m[1],10) : null; }
function findOptionByNumber(index, n){
  const cand = index.docs.filter(d=>d.kind==='option');
  return cand.find(d => normalizeText(d.title).includes(`opcion ${n}`)) || null;
}

async function handle(text, root, state){
  const ui = UI(root); ui.msg(text,'user'); ui.typing(true);

  try {
    // availability hint if user mentions "desayuno"
    if (/desayuno|breakfast/i.test(text) && !isWithin(state.hours.breakfast)){
      ui.typing(false);
      ui.msg('Ahora mismo no es horario de desayuno. Te recomiendo nuestras opciones todo el día: Opción 2 y Extras de bebidas. 😉', 'bot');
      return;
    }

    if (isOffTopic(text)){
      ui.typing(false);
      ui.msg('I apologize my focus is on the menu, thank you. Shall we continue?','bot');
      return;
    }

    const intent = detectIntent(text);
    const idx = state.index, topK = state.topK || 3;

    // direct references
    const optNum = extractOptionNumber(text);

    if (intent==='list_options'){
      ui.typing(false);
      const opts = idx.docs.filter(d=>d.kind==='option').slice(0,20);
      ui.msg(renderItems(opts, state, /*withConf*/false), 'bot');
      return;
    }
    if (intent==='list_extras'){
      ui.typing(false);
      const ex = idx.docs.filter(d=>d.kind==='extra').slice(0,20);
      ui.msg(renderItems(ex, state, false), 'bot');
      return;
    }
    if (intent==='menu_option_ref' && optNum){
      ui.typing(false);
      const hit = findOptionByNumber(idx, optNum);
      if (!hit) { ui.msg('No encontré esa opción. ¿Quieres ver la lista de opciones?', 'bot'); return; }
      ui.msg(renderItems([hit], state, false), 'bot');
      // smart upsell (if item doesn’t mention a drink, offer cola or café; else offer chorizo/egg)
      upsellChips(hit, state, ui, root);
      return;
    }
    if (intent==='menu_price' && optNum){
      ui.typing(false);
      const hit = findOptionByNumber(idx, optNum);
      if (!hit) { ui.msg('No encontré esa opción. ¿Quieres ver la lista de opciones?', 'bot'); return; }
      ui.msg(renderPrice(hit, state), 'bot');
      return;
    }

    // BM25 search
    const hits = bm25Search(text, idx, { topK });
    ui.typing(false);
    if (!hits.length){ ui.msg('No encontré coincidencias. Prueba con “opción 2”, “huevo” o “cola”.', 'bot'); csat(ui); return; }
    const docs = hits.map(h=>({ ...idx.docs[h.doc], _conf:h.conf }));
    ui.msg(renderItems(docs, state, /*withConf*/true), 'bot');

    // learn personal synonyms if user hits certain patterns
    upsellFromQuery(text, docs, state);
    upsellChips(docs[0], state, ui, root); // nudge one best extra
    promoNudge(text, docs, state, ui);

    csat(ui);

  } catch(err){
    ui.typing(false);
    ui.msg('Ocurrió un error. Intenta de nuevo.', 'bot');
    console.error(err);
  }
}

/* =============== Rendering =============== */
function money(cents, locale='es-EC', currency='USD'){ return (cents/100).toLocaleString(locale, {style:'currency', currency}); }
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function renderItems(docs, state, withConf){
  const rows = docs.map(d=>{
    const price = money(d.priceCents, state.locale, state.currency);
    const confDot = withConf ? `<span class="mb-conf ${d._conf||'m'}" title="confianza ${d._conf||'m'}"></span>` : '';
    const img = d.img ? `<img class="mb-thumb" src="${escapeHtml(d.img)}" loading="lazy" alt="">` : `<div class="mb-thumb" style="background:#0b0f18"></div>`;
    const desc = d.desc ? ` — ${escapeHtml(d.desc)}` : '';
    return `<li class="mb-item">${img}<div><div class="mb-title">${escapeHtml(d.title)} ${confDot}</div><div class="mb-meta">${price}${desc}</div></div></li>`;
  }).join('');
  return `<ul class="mb-list">${rows}</ul>`;
}
function renderPrice(doc, state){ return `<div><strong>${escapeHtml(doc.title)}</strong> cuesta <strong>${money(doc.priceCents, state.locale, state.currency)}</strong>.</div>`; }
function csat(ui){
  const div = document.createElement('div'); div.className='mb-csat';
  div.innerHTML = `<span>¿Te ayudé?</span><button id="csat-up">👍</button><button id="csat-down">👎</button>`;
  ui.append(div);
  const save = (v)=>{ try{ const arr=JSON.parse(localStorage.getItem('marxia_csat')||'[]'); arr.push({t:Date.now(),v}); localStorage.setItem('marxia_csat', JSON.stringify(arr)); }catch{} };
  div.querySelector('#csat-up').onclick=()=>{ save(1); div.remove(); };
  div.querySelector('#csat-down').onclick=()=>{ save(0); div.remove(); };
}

/* =============== Smart Upsells & Promos =============== */
function upsellChips(doc, state, ui){
  // Heuristics: if description doesn’t mention a drink, offer cola or café; else offer chorizo/egg.
  const text = normalizeText(`${doc.title} ${doc.desc||''}`);
  const wantsDrink = /(bebida|cola|soda|refresco)/.test(text);
  const extras = state.menu.extras;
  const cola = extras.find(x=>/cola|refresco|soda/i.test(x.title));
  const cafe = extras.find(x=>/cafe|café/i.test(x.title));
  const chorizo = extras.find(x=>/chorizo|salchicha/i.test(x.title));
  const huevo = extras.find(x=>/huevo/i.test(x.title));

  const chips = [];
  if (!wantsDrink && (cola||cafe)) {
    if (cola) chips.push({label:`+ ${cola.title} ${money(cola.priceCents,state.locale,state.currency)}`, action:()=>ui.msg(`Gran elección: ${cola.title}.`, 'bot')});
    else if (cafe) chips.push({label:`+ ${cafe.title} ${money(cafe.priceCents,state.locale,state.currency)}`, action:()=>ui.msg(`Gran elección: ${cafe.title}.`, 'bot')});
  } else if (chorizo || huevo) {
    const e = chorizo || huevo;
    chips.push({label:`+ ${e.title} ${money(e.priceCents,state.locale,state.currency)}`, action:()=>ui.msg(`Perfecto, ${e.title} combina muy bien.`, 'bot')});
  }
  if (chips.length) ui.chips(chips);
}
// Promo: detect "2x opción N" or user mentions two/duo/pareja
function promoNudge(text, docs, state, ui){
  if (!/(2x|x2|dos|pareja|duo|dúo)/i.test(text)) return;
  const best = docs[0]; if (!best) return;
  const price = money(best.priceCents*2, state.locale, state.currency);
  ui.msg(`💡 Pack x2 de <strong>${escapeHtml(best.title)}</strong>: ${price} (consulta por descuentos en combos).`, 'bot');
}
// Learn personalized synonyms when user hits certain patterns (super light)
function upsellFromQuery(text, docs, state){
  try {
    const toks = tokenize(text);
    const best = docs[0]; if (!best) return;
    const canonical = tokenize(best.title)[0]; if (!canonical) return;
    const map = state.index.personalSyn || {};
    toks.forEach(t=>{
      if (t.length > 3 && t !== canonical) {
        map[t] = Array.from(new Set([...(map[t]||[]), canonical]));
      }
    });
    state.index.personalSyn = map; savePersonalSynonyms(map);
  } catch {}
}

/* =============== Time windows =============== */
function isWithin(win){
  if (!win) return true;
  const now = new Date();
  const h = (d)=>{ const [H,M]=d.split(':').map(Number); const t=new Date(); t.setHours(H, M||0, 0, 0); return t; };
  const start = h(win.start), end = h(win.end);
  return now >= start && now <= end;
}

/* =============== Utils =============== */
function norm(a,b){ for(const k in b){ if(b[k] && typeof b[k]==='object' && !Array.isArray(b[k])) a[k]=norm(a[k]||{},b[k]); else a[k]=b[k]; } return a; }

