# Calculator-to-Invoice Automation

This integration links the Marxia order calculator UI to Google Sheets, PDF invoices, and
email notifications for both the end consumer and the business owner. It is composed of
three layers:

1. **Apps Script webhook** – validates the payload, writes each line item to Sheets, renders
   a PDF, and emails the receipt to the customer while CCing the business owner.
2. **Cloudflare Worker** – exposes `/api/calc` (totals only) and `/api/save` (forward to the
   Apps Script webhook) with strict CORS and security headers.
3. **Order page trigger** – a secondary call-to-action button that opens the calculator UI
   served by the Worker.

Follow the steps below to deploy the workflow end-to-end.

## 1. Google Apps Script Webhook

1. Create a new Google Apps Script project.
2. Replace the default code with the following file.
3. Update the constants at the top **before** deploying.
4. Deploy as a Web App (`Publish → Deploy as web app → Execute as: Me → Access: Anyone`).

```javascript
/** Marxia — Apps Script Webhook (Sheets + PDF Email)
 * DEPLOY: Publish → Deploy as web app → Execute as: Me → Access: Anyone (or Anyone with link)
 * REQUIRED CONSTANTS — set these BEFORE deploying:
 */
const SHEET_ID    = 'AKfycbyvxgcfhRncOIvdEVL-j1iTcS8stR-mojkTQtCsagB2tRiFpQSnauwWbZcjxVl3WB_1-A';   // <-- paste ONLY the Sheet ID (not full URL)
const TAB_NAME    = 'orders_log';                   // <-- tab name to append into
const OWNER_EMAIL = 'fedemenstah.griltrocast@gmail.com';            // <-- default business owner email (can be overridden per request)

/* ==================== CONFIG ==================== */
const IVA_RATE = 0.15;     // Ecuador 15%
const CURRENCY = 'USD';
const TZ       = 'America/Guayaquil';

/* ==================== ENTRY ==================== */
function doPost(e) {
  try {
    const req = parseJson_(e.postData && e.postData.contents);
    // Expected JSON:
    // {
    //   orderId, email, whatsapp, deliveryAddress,
    //   items:[{id,name,qty,priceCents}, ...],
    //   // optional:
    //   customerName?, gpsLat?, gpsLng?, source_ip?, user_agent?, ownerEmail?
    // }

    validateReq_(req);
    const calc = calcTotals_(req.items, IVA_RATE);

    const sheetRes = appendToSheet_(req, calc);

    const pdfBlob = renderInvoicePdf_(req, calc);
    const ownerToUse = req.ownerEmail || OWNER_EMAIL;
    emailInvoice_(req.email, ownerToUse, req.orderId, pdfBlob, calc, req);

    return ok_({
      orderId: req.orderId,
      totals: {
        subtotal: +(calc.subtotal/100).toFixed(2),
        vat:      +(calc.vat/100).toFixed(2),
        total:    +(calc.total/100).toFixed(2),
        currency: CURRENCY,
        iva_rate: IVA_RATE
      },
      sheet: sheetRes
    });
  } catch (err) {
    return fail_(err && err.message || err);
  }
}

/* ==================== VALIDATION ==================== */
function validateReq_(req) {
  if (!req || typeof req !== 'object') throw new Error('invalid_request');

  if (!req.orderId || String(req.orderId).length > 64) throw new Error('invalid_order_id');

  if (!Array.isArray(req.items) || req.items.length === 0) throw new Error('empty_items');
  req.items.forEach(it => {
    it.id         = String(it.id || '').slice(0, 32);
    it.name       = String(it.name || '').slice(0, 128);
    it.qty        = Math.max(1, Math.min(100, Number(it.qty) || 0));
    it.priceCents = Math.max(0, Math.min(99999999, Number(it.priceCents) || 0));
  });

  if (!req.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email)) throw new Error('invalid_email');
  if (!req.whatsapp || !/^\+\d{7,15}$/.test(req.whatsapp)) throw new Error('invalid_whatsapp');

  req.deliveryAddress = String(req.deliveryAddress || '').slice(0, 256);
  if (!req.deliveryAddress) throw new Error('invalid_delivery_address');

  // optional fields
  req.customerName = String(req.customerName || '').slice(0, 128) || null;

  if (req.ownerEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.ownerEmail))) throw new Error('invalid_owner_email');
    req.ownerEmail = String(req.ownerEmail).slice(0, 128);
  } else req.ownerEmail = null;

  // forwarded by Worker (optional)
  req.source_ip  = String(req.source_ip  || '').slice(0, 64);
  req.user_agent = String(req.user_agent || '').slice(0, 256);

  // optional GPS
  if (req.gpsLat !== undefined && req.gpsLng !== undefined) {
    const lat = Number(req.gpsLat), lng = Number(req.gpsLng);
    if (!(isFinite(lat) && isFinite(lng))) throw new Error('invalid_gps');
    req.gpsLat = lat; req.gpsLng = lng;
  } else { req.gpsLat = null; req.gpsLng = null; }
}

/* ==================== CALCULATOR ==================== */
function calcTotals_(items, ivaRate) {
  let subtotal = 0;
  const lines = items.map(it => {
    const rowSubtotal = it.qty * it.priceCents;
    const rowVAT      = Math.round(rowSubtotal * ivaRate);
    const rowTotal    = rowSubtotal + rowVAT;
    subtotal += rowSubtotal;
    return {
      id: it.id, name: it.name, qty: it.qty,
      priceCents: it.priceCents,
      subtotal: rowSubtotal, vat: rowVAT, total: rowTotal
    };
  });
  const vat   = Math.round(subtotal * ivaRate);
  const total = subtotal + vat;
  return { subtotal, vat, total, lines };
}

/* ==================== SHEETS APPEND ==================== */
/* EXACT COLUMN ORDER (per your spec):
   timestamp\torder_id\titem_id\titem_name\tqty\tunit_price_usd\tsubtotal_usd\tvat_usd\ttotal_usd
   currency\tiva_rate\tsource_ip\tuser_agent\tstatus\twhatsapp\temail\tdelivery_address
*/
function appendToSheet_(req, calc) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);

  const HEADER = [
    'timestamp','order_id','item_id','item_name','qty',
    'unit_price_usd','subtotal_usd','vat_usd','total_usd',
    'currency','iva_rate','source_ip','user_agent','status',
    'whatsapp','email','delivery_address'
  ];

  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,HEADER.length).setValues([HEADER]);
  }

  const ts = new Date();
  const rows = calc.lines.map(L => ([
    Utilities.formatDate(ts, TZ, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    req.orderId,
    L.id,
    L.name,
    L.qty,
    +(L.priceCents/100).toFixed(2),
    +(L.subtotal/100).toFixed(2),
    +(L.vat/100).toFixed(2),
    +(L.total/100).toFixed(2),
    CURRENCY,
    IVA_RATE,
    req.source_ip,
    req.user_agent,
    'calculated',
    req.whatsapp,
    req.email,
    req.deliveryAddress
  ]));

  sh.getRange(sh.getLastRow()+1, 1, rows.length, rows[0].length).setValues(rows);

  return { sheetId: SHEET_ID, tab: TAB_NAME, appended: rows.length };
}

/* ==================== PDF RENDER (ONLY requested fields) ==================== */
/* PDF table columns (exact as requested):
   order_id | item_name | qty | unit_price_usd | subtotal_usd | vat_usd | total_usd | iva_rate | whatsapp | email | delivery_address
*/
function renderInvoicePdf_(req, calc) {
  const ts = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  const tpl = HtmlService.createTemplateFromFile('invoice');
  tpl.data = {
    orderId: req.orderId,
    whatsapp: req.whatsapp,
    email: req.email,
    deliveryAddr: req.deliveryAddress,
    ivaRate: IVA_RATE,
    timestamp: ts,
    items: calc.lines.map(L => ({
      order_id: req.orderId,
      item_name: L.name,
      qty: L.qty,
      unit_price_usd: (L.priceCents/100).toFixed(2),
      subtotal_usd: (L.subtotal/100).toFixed(2),
      vat_usd: (L.vat/100).toFixed(2),
      total_usd: (L.total/100).toFixed(2),
      iva_rate: IVA_RATE
    }))
  };
  const html = tpl.evaluate();
  const pdf  = Utilities.newBlob(html.getContent(), 'text/html', `invoice-${req.orderId}.html`)
                        .getAs('application/pdf')
                        .setName(`Marxia-Invoice-${req.orderId}.pdf`);
  return pdf;
}

/* ==================== EMAIL ==================== */
function emailInvoice_(toEmail, ownerEmail, orderId, pdfBlob, calc, req) {
  const subject = `Marxia — Factura ${orderId} — Total ${CURRENCY} ${(calc.total/100).toFixed(2)}`;
  const bodyTxt = [
    `Factura #${orderId}`,
    `WhatsApp: ${req.whatsapp}`,
    `Email: ${req.email}`,
    `Entrega: ${req.deliveryAddress}`,
    '',
    `Subtotal: ${CURRENCY} ${(calc.subtotal/100).toFixed(2)}`,
    `IVA (${(IVA_RATE*100).toFixed(0)}%): ${CURRENCY} ${(calc.vat/100).toFixed(2)}`,
    `TOTAL: ${CURRENCY} ${(calc.total/100).toFixed(2)}`
  ].join('\n');

  const opts = {
    name: 'Marxia Café',
    attachments: [pdfBlob],
    cc: ownerEmail || undefined
  };
  MailApp.sendEmail(toEmail, subject, bodyTxt, opts);
}

/* ==================== UTILS ==================== */
function parseJson_(s) {
  if (!s) throw new Error('empty_body');
  try { return JSON.parse(s); } catch { throw new Error('bad_json'); }
}

// Apps Script Web Apps always return HTTP 200; include status in JSON.
function json_(status, obj) {
  obj = obj || {};
  obj.code = status;
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function ok_(obj){ return json_(200, Object.assign({ok:true}, obj)); }
function fail_(msg){ return json_(400, {ok:false, error:String(msg)}); }
```

## 2. Cloudflare Worker (API Gateway)

1. Set the following environment variables in `wrangler.toml` or via the Cloudflare
   dashboard:
   - `APPS_SCRIPT_URL` – deployment URL from the previous step.
   - `ALLOWED_ORIGINS` – comma-separated list of sites allowed to call the API.
   - `DEV` (optional) – `true` to disable caching when testing.
2. Deploy the Worker and verify the `/health` endpoint returns `status: "ok"`.

```javascript
// worker.js — Cloudflare Worker (SAFE & SELF)
// API-only: strict headers, no inline/external scripts, no assets.
// Endpoints:
//   POST /api/calc  -> returns totals (no persistence)
//   POST /api/save  -> forwards payload to Apps Script (Sheet + PDF email to End Consumer, CC Business Owner)

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // ======== Env Vars (set via wrangler.toml) ========
    const APPS_SCRIPT_URL = env.APPS_SCRIPT_URL; // e.g., https://script.google.com/macros/s/xxx/exec
    const DEV             = (env.DEV || "false").toLowerCase() === "true";
    const ALLOWED_ORIGINS = String(env.ALLOWED_ORIGINS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);     // e.g. "https://www.marxia.com, https://marxia.com"

    // ======== CORS (SAFE) ========
    const origin  = req.headers.get("Origin") || "";
    const isCors  = !!origin && origin !== url.origin;
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const CORS_BASE = {
      ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
      "Vary": "Origin",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "600",
      "Access-Control-Allow-Credentials": "false"
    };

    // ======== Preflight ========
    if (req.method === "OPTIONS") {
      return new Response(null, { status: allowed ? 204 : 403, headers: { ...CORS_BASE, ...securityHeaders() } });
    }

    // ======== Routes ========
    if (url.pathname === "/api/calc" && req.method === "POST") {
      if (isCors && !allowed) return secureJson(403, { ok:false, error:"origin_not_allowed" }, CORS_BASE);
      const body = await readJson(req);
      if (!body.ok) return secureJson(400, { ok:false, error: body.error }, CORS_BASE);

      // Minimal payload validation
      const v = validateCalcPayload(body.data);
      if (!v.ok) return secureJson(400, { ok:false, error: v.error }, CORS_BASE);

      const result = calculateTotals(v.data.items, 0.15); // IVA 15%
      return secureJson(200, { ok:true, ...result }, CORS_BASE);
    }

    if (url.pathname === "/api/save" && req.method === "POST") {
      if (isCors && !allowed) return secureJson(403, { ok:false, error:"origin_not_allowed" }, CORS_BASE);
      const body = await readJson(req);
      if (!body.ok) return secureJson(400, { ok:false, error: body.error }, CORS_BASE);

      // Required fields to forward PDF + Sheet:
      // orderId, items, email (End Consumer), whatsapp (End Consumer), deliveryAddress
      // Optional: ownerEmail (Business Owner), customerName, gpsLat, gpsLng
      const v = validateSavePayload(body.data);
      if (!v.ok) return secureJson(400, { ok:false, error: v.error }, CORS_BASE);

      // Inject source IP + UA
      v.data.source_ip  = req.headers.get("CF-Connecting-IP") || "";
      v.data.user_agent = req.headers.get("User-Agent") || "";

      // Forward to Apps Script (Apps Script performs calc, writes Sheet, emails PDF)
      const aps = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v.data)
      });

      const text = await aps.text(); // Apps Script returns JSON (HTTP 200)
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...CORS_BASE,
          ...securityHeaders()
        }
      });
    }

    // Fallback (API-only)
    return new Response("Not Found", { status: 404, headers: securityHeaders(DEV) });
  }
};

/* =================== Core Helpers =================== */

// Strict security headers (API-only; no inline scripts/styles; self only)
function securityHeaders(DEV = false) {
  const csp = [
    "default-src 'none'",        // block everything by default
    "connect-src 'self' https://script.google.com https://script.googleusercontent.com", // allow only self + Apps Script
    "img-src 'none'",
    "font-src 'none'",
    "style-src 'none'",
    "script-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join("; ");

  const h = {
    "Content-Security-Policy": csp,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), interest-cohort=()",
    "Cache-Control": DEV ? "no-store" : "no-store" // APIs: avoid caching responses
  };
  return h;
}

async function readJson(req) {
  try {
    const data = await req.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: "bad_json" };
  }
}

/* =================== Validation =================== */

// For /api/calc
function validateCalcPayload(p) {
  if (!p || typeof p !== "object") return { ok:false, error:"invalid_request" };
  if (!Array.isArray(p.items) || p.items.length === 0) return { ok:false, error:"empty_items" };
  for (const it of p.items) {
    if (!it || typeof it !== "object") return { ok:false, error:"bad_item" };
    if (typeof it.id === "undefined") return { ok:false, error:"item_id_required" };
    if (typeof it.name === "undefined") return { ok:false, error:"item_name_required" };
    if (!Number.isFinite(Number(it.qty)) || Number(it.qty) <= 0) return { ok:false, error:"qty_invalid" };
    if (!Number.isFinite(Number(it.priceCents)) || Number(it.priceCents) < 0) return { ok:false, error:"price_invalid" };
  }
  return { ok:true, data: { items: p.items } };
}

// For /api/save (adds required contact fields)
function validateSavePayload(p) {
  const base = validateCalcPayload(p);
  if (!base.ok) return base;

  if (!p.orderId || String(p.orderId).length > 64) return { ok:false, error:"invalid_order_id" };

  if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email))) return { ok:false, error:"invalid_email" };
  if (!p.whatsapp || !/^\+\d{7,15}$/.test(String(p.whatsapp))) return { ok:false, error:"invalid_whatsapp" };
  if (!p.deliveryAddress || !String(p.deliveryAddress).trim()) return { ok:false, error:"invalid_delivery_address" };

  if (p.ownerEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.ownerEmail))) return { ok:false, error:"invalid_owner_email" };
  }

  // Optional coords
  if ((p.gpsLat !== undefined && p.gpsLat !== null) || (p.gpsLng !== undefined && p.gpsLng !== null)) {
    const lat = Number(p.gpsLat), lng = Number(p.gpsLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok:false, error:"invalid_gps" };
  }

  // Optional customerName
  if (p.customerName !== undefined && p.customerName !== null) {
    if (!String(p.customerName).trim()) p.customerName = null;
  }

  return { ok:true, data: p };
}

/* =================== Calculator =================== */
function calculateTotals(items, ivaRate = 0.15) {
  let subtotal = 0;
  const lines = items.map((it) => {
    const qty   = Math.max(1, Math.min(100, Number(it.qty)));
    const price = Math.max(0, Math.min(99999999, Number(it.priceCents)));
    const rowSubtotal = qty * price;
    const rowVAT      = Math.round(rowSubtotal * ivaRate);
    const rowTotal    = rowSubtotal + rowVAT;
    subtotal += rowSubtotal;
    return {
      id: String(it.id).slice(0, 32),
      name: String(it.name).slice(0, 128),
      qty,
      priceCents: price,
      subtotal: rowSubtotal,
      vat: rowVAT,
      total: rowTotal
    };
  });
  const vat   = Math.round(subtotal * ivaRate);
  const total = subtotal + vat;
  return {
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: total,
    subtotal: +(subtotal / 100).toFixed(2),
    vat: +(vat / 100).toFixed(2),
    total: +(total / 100).toFixed(2),
    currency: "USD",
    iva_rate: ivaRate,
    lines
  };
}

/* =================== JSON Response =================== */
function secureJson(status, obj, cors, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(cors || {}),
      ...(extraHeaders || {}),
      ...securityHeaders()
    }
  });
}
```

## 3. Front-end Trigger

The order page now exposes a secondary button that launches the calculator UI served from
your Cloudflare Worker. The markup is already present in `order.html` and reads the Worker
base URL from `data-worker-base`.

```html
<!-- Simple trigger button (put this anywhere in your order page) -->
<button id="openCalc" type="button">Abrir Calculadora</button>

<script>
  // 👉 Set your Worker base once:
  const WORKER_BASE = "https://cthrough-woodypecker-265a.meeka-monsta-dooku.workers.dev"; // replace if you deploy a new subdomain

  document.getElementById('openCalc').addEventListener('click', () => {
    const url = WORKER_BASE + "/calc";
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
      // Popup blocked? Navigate current tab.
      window.location.href = url;
      return;
    }
    try {
      w.opener = null;
    } catch (err) {
      // Ignore when the browser disallows adjusting the opener.
    }
  });
</script>
```

When the worker URL changes, update the `data-worker-base` attribute in `order.html` so
the front-end button opens the right endpoint.
