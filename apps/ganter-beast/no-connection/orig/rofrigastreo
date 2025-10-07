"use strict";

// Forward sanitized PII to Cloudflare worker when Pay button is clicked
(function(){
  // Public key metadata for verifying worker challenge or encryption schemes
  const KEY_ID = "kid-94805fe6-4500-4d5c-8272-e9d38be05123";
  const FINGERPRINT_SHA256 = "6BA0CAB3E2EBE4CB4D2B23397FC40E4622484C79CC9C74110EC2460F54EFB779";
  const FINGERPRINT_SHA384 = "886D32528D1A05DAE20CD795E6D0CE99D2B763FC707A33419B22DEFDC46336EA0E9849A41DCB45BC07227565AACBC18C";
  const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmYzFeqcbdqBg1vzYkIOPNBRlfRm/
Q+ituK2zUqToU1nuEocfWv4jcQW9St1RO7mIQY5G7n/reYSRHP9Jnm1XOg==
-----END PUBLIC KEY-----`;
  const PUBLIC_JWK = {
    "crv": "P-256",
    "ext": true,
    "key_ops": ["verify"],
    "kty": "EC",
    "x": "mYzFeqcbdqBg1vzYkIOPNBRlfRm_Q-ituK2zUqToU1k",
    "y": "7hKHH1r-I3EFvUrdUTu5iEGORu5_63mEkRz_SZ5tVzo"
  };

  const workerUrl = window.CLOUDFLARE_WORKER_URL;
  if(!workerUrl){
    console.warn("CLOUDFLARE_WORKER_URL not configured");
    return;
  }

  function sanitizeString(s){
    return typeof s === "string" ? s.normalize("NFKC").trim().replace(/\p{C}/gu, "") : "";
  }

  function collectPII(){
    return {
      firstName: sanitizeString(document.getElementById("firstName")?.value || ""),
      lastName: sanitizeString(document.getElementById("lastName")?.value || ""),
      idNumber: sanitizeString(document.getElementById("idNumber")?.value || ""),
      phone: sanitizeString(document.getElementById("phone")?.value || ""),
      email: sanitizeString(document.getElementById("email")?.value || "").toLowerCase(),
      address: sanitizeString(document.getElementById("address")?.value || "")
    };
  }

  function collectOrder(){
    const order = { items: [], totals: {}, deliveryMinutes: window.deliveryMinutes || 0 };
    try{
      const lang = window.lang || "en";
      if(Array.isArray(window.PRODUCTS) && window.cart instanceof Map){
        window.PRODUCTS.forEach(p => {
          const qty = window.cart.get(p.id);
          if(qty > 0){
            order.items.push({
              id: p.id,
              name: sanitizeString(lang === "en" ? p.name_en : p.name_es),
              qty: qty,
              price: p.price
            });
          }
        });
      }
      if(typeof window.totals === "function"){
        order.totals = window.totals();
      }
    }catch(e){
      console.error("order collection failed", e);
    }
    return order;
  }

  async function forwardPII(){
    try{
      const payload = { pii: collectPII(), order: collectOrder() };
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          "X-Key-Id": KEY_ID
        },
        body: JSON.stringify(payload),
        credentials: "omit"
      });
      if(res.ok){
        const data = await res.json().catch(()=>({}));
        if(data.payUrl){
          window.open(data.payUrl, "_blank", "noopener");
        }
      } else {
        console.error("Worker responded with", res.status);
      }
    }catch(err){
      console.error("PII forward failed", err);
    }
  }

  document.getElementById("confirmBtn")?.addEventListener("click", forwardPII);
})();
