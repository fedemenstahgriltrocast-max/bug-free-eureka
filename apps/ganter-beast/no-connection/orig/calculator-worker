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
    "Permissions-Policy": "geolocation=(), camera=(), microphone=(), interest-cohort()",
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
