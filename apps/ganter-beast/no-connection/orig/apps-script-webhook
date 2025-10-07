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
