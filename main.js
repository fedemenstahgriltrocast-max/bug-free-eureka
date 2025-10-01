/* CONFIG */
const VAT_RATE = 0.15; // Ecuador: set 0.12 or 0.15 as needed
const CURRENCY = "USD";

/* I18N */
const STR = {
  en:{
    /* landing */
    subtitle: "Breakfasts, pastries, and delivery throughout Guayaquil.",
    orderNow: "Order now",
    freshIngredients: "Fresh Ingredients",
    freshIngredientsDesc: "Each order is prepared with locally sourced breads, fruits, and cheeses.",
    fastDelivery: "Fast Delivery",
    fastDeliveryDesc: "We deliver to Saucés, Alborada, Guayacanes, Tarazana, and Brisas del Río.",
    celebrateMoment: "Celebrate Every Moment",
    celebrateMomentDesc: "Surprise someone special with customizable breakfast boxes and pastries.",
    contact: "Contact",

    /* app */
    title:"Place your order", menu:"Menu", tapToAdd:"Tap/click a product image to add it to your cart.",
    cart:"Order Cart", item:"Item", qty:"Qty", price:"Price", total:"Total",
    empty:"Your cart is empty.", subtotal:"Subtotal", grand:"Total",
    acceptOrder:"Accept Order", enterDelivery:"Enter delivery address & WhatsApp",
    name:"Full name", whatsapp:"WhatsApp number (+593…)", address:"Address", refs:"Reference notes",
    cancel:"Cancel", verify:"Accept & verify address", confirmMap:"Confirm location",
    edit:"Edit", send:"Send to WhatsApp"
  },
  es:{
    /* landing */
    subtitle: "Desayunos, bocaditos y entregas en todo Guayaquil.",
    orderNow: "Ordenar ahora",
    freshIngredients: "Ingredientes Frescos",
    freshIngredientsDesc: "Cada pedido se prepara con panes, frutas y quesos de origen local.",
    fastDelivery: "Entrega Rápida",
    fastDeliveryDesc: "Entregamos en Saucés, Alborada, Guayacanes, Tarazana y Brisas del Río.",
    celebrateMoment: "Celebra Cada Momento",
    celebrateMomentDesc: "Sorprende a alguien especial con cajas de desayuno y bocaditos personalizables.",
    contact: "Contacto",

    /* app */
    title:"Realiza tu pedido", menu:"Menú", tapToAdd:"Toca/clic en la imagen para añadir al carrito.",
    cart:"Carrito", item:"Artículo", qty:"Cant.", price:"Precio", total:"Total",
    empty:"Tu carrito está vacío.", subtotal:"Subtotal", grand:"Total",
    acceptOrder:"Aceptar pedido", enterDelivery:"Ingresa dirección y WhatsApp",
    name:"Nombre completo", whatsapp:"Número de WhatsApp (+593…)", address:"Dirección", refs:"Notas de referencia",
    cancel:"Cancelar", verify:"Aceptar y verificar dirección", confirmMap:"Confirmar ubicación",
    edit:"Editar", send:"Enviar a WhatsApp"
  }
};
function applyI18n(lang){
  document.documentElement.lang = lang;
  document.body.dataset.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if(STR[lang][key]) el.textContent = STR[lang][key];
  });
}

/* PRODUCTS (10) — sample data/images. Replace paths to your assets */
const PRODUCTS = [
  {id:"cafe1",   name:"Café Americano",     price:2.25, img:"img/cafe1.png"},
  {id:"cafe2",   name:"Café con Leche",     price:2.50, img:"img/cafe2.png"},
  {id:"emp1",    name:"Empanada Queso",     price:1.60, img:"img/emp_queso.png"},
  {id:"emp2",    name:"Empanada Pollo",     price:1.80, img:"img/emp_pollo.png"},
  {id:"bolon",   name:"Bolón Mixto",        price:3.25, img:"img/bolon.png"},
  {id:"tortv",   name:"Tortilla de Verde",  price:2.90, img:"img/tort_verde.png"},
  {id:"huevos",  name:"Huevos + Chorizo",   price:3.80, img:"img/huevo_chori.png"},
  {id:"sand1",   name:"Sánduche Jamón",     price:3.10, img:"img/sand_jamon.png"},
  {id:"jugo1",   name:"Jugo Naranja",       price:2.30, img:"img/jugo_naranja.png"},
  {id:"combo1",  name:"Combo Desayuno",     price:6.90, img:"img/combo1.png"},
];

/* STATE */
const cart = new Map(); // id -> {product, qty}

/* ELEMENTS */
const track = document.getElementById("productTrack");
const cartBody = document.getElementById("cartBody");
const subtotalEl = document.getElementById("subtotal");
const vatEl = document.getElementById("vat");
const vatPctEl = document.getElementById("vatPct");
const grandEl = document.getElementById("grand");
const acceptBtn = document.getElementById("acceptOrderBtn");
const addressModal = document.getElementById("addressModal");
const addressForm  = document.getElementById("addressForm");
const mapWrap      = addressModal.querySelector(".mapWrap");
const mapFrame     = document.getElementById("mapFrame");
const verifyMapBtn = document.getElementById("verifyMapBtn");
const editAddressBtn = document.getElementById("editAddressBtn");
const sendWABtn      = document.getElementById("sendWhatsappBtn");

/* INIT */
applyI18n("en");
vatPctEl.textContent = `${Math.round(VAT_RATE*100)}%`;
renderProducts();
renderCart();

/* ——— Carousel ——— */
let slideIndex = 0;
function renderProducts(){
  track.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const li = document.createElement("li");
    li.className = "slide";
    li.innerHTML = `
      <div class="imgWrap" role="button" tabindex="0" aria-label="${p.name}">
        <img src="${p.img}" alt="${p.name}" />
      </div>
      <div class="meta">
        <div class="name">${p.name}</div>
        <div class="price">$${p.price.toFixed(2)}</div>
        <div class="qtyRow">
          <button class="btn" data-act="dec" data-id="${p.id}">−</button>
          <button class="btn primary" data-act="add" data-id="${p.id}">+ Add</button>
        </div>
      </div>`;
    li.querySelector(".imgWrap").addEventListener("click", ()=>addToCart(p.id));
    li.querySelector('[data-act="add"]').addEventListener("click", ()=>addToCart(p.id));
    li.querySelector('[data-act="dec"]').addEventListener("click", ()=>removeFromCart(p.id));
    track.appendChild(li);
  });
}
function shiftSlides(dir){
  const cardW = track.querySelector(".slide")?.getBoundingClientRect().width ?? 220;
  track.scrollBy({left: dir* (cardW + 12), behavior:"smooth"});
}
document.querySelector(".prev").addEventListener("click", ()=>shiftSlides(-1));
document.querySelector(".next").addEventListener("click", ()=>shiftSlides(1));

/* ——— Cart logic ——— */
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const item = cart.get(id) || {product:p, qty:0};
  item.qty++;
  cart.set(id,item);
  renderCart();
}
function removeFromCart(id){
  if(!cart.has(id)) return;
  const item = cart.get(id);
  item.qty = Math.max(0, item.qty-1);
  if(item.qty===0) cart.delete(id);
  renderCart();
}
function renderCart(){
  cartBody.innerHTML = "";
  if(cart.size===0){
    cartBody.innerHTML = `<tr class="empty"><td colspan="4" data-i18n="empty">${STR[document.body.dataset.lang].empty}</td></tr>`;
    acceptBtn.disabled = true;
    updateTotals();
    return;
  }
  let subtotal = 0;
  cart.forEach(({product, qty})=>{
    const line = qty * product.price;
    subtotal += line;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.name}</td>
      <td class="qty">${qty}</td>
      <td class="price">$${product.price.toFixed(2)}</td>
      <td class="line">
        $${line.toFixed(2)}
        <span class="rowBtns">
          <button class="btn" data-row-dec="${product.id}">−</button>
          <button class="btn" data-row-add="${product.id}">+</button>
        </span>
      </td>`;
    tr.querySelector(`[data-row-dec="${product.id}"]`).addEventListener("click", ()=>removeFromCart(product.id));
    tr.querySelector(`[data-row-add="${product.id}"]`).addEventListener("click", ()=>addToCart(product.id));
    cartBody.appendChild(tr);
  });
  updateTotals(subtotal);
  acceptBtn.disabled = false;
}
function updateTotals(subtotal=0){
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const grand = +(subtotal + vat).toFixed(2);
  subtotalEl.textContent = money(subtotal);
  vatEl.textContent = money(vat);
  grandEl.textContent = money(grand);
}
function money(n){ return (CURRENCY==="USD" ? "$":"") + n.toFixed(2); }

/* ——— Accept Order flow ——— */
acceptBtn.addEventListener("click", ()=>{
  mapWrap.hidden = true;
  addressForm.classList.remove("hidden");
  addressModal.showModal();
});
verifyMapBtn.addEventListener("click", (e)=>{
  e.preventDefault();
  if(!addressForm.reportValidity()) return;

  // Build Google Maps query (no API key)
  const addr = encodeURIComponent(document.getElementById("address").value);
  const q = `${addr}, Guayaquil`;
  const url = `https://www.google.com/maps?q=${q}&output=embed`;
  mapFrame.src = url;

  addressForm.classList.add("hidden");
  mapWrap.hidden = false;
});
editAddressBtn.addEventListener("click", ()=>{
  mapWrap.hidden = true;
  addressForm.classList.remove("hidden");
});

sendWABtn.addEventListener("click", ()=>{
  const lang = document.body.dataset.lang;
  const name = document.getElementById("custName").value.trim();
  const wa   = document.getElementById("waNumber").value.replace(/\s+/g,"");
  const addr = document.getElementById("address").value.trim();
  const refs = document.getElementById("refs").value.trim();

  // Compose order summary
  let lines = [];
  cart.forEach(({product, qty})=>{
    lines.push(`• ${product.name} × ${qty} = $${(qty*product.price).toFixed(2)}`);
  });
  const subtotal = parseFloat(subtotalEl.textContent.replace(/[^0-9.]/g,"")) || 0;
  const vat = parseFloat(vatEl.textContent.replace(/[^0-9.]/g,"")) || 0;
  const total = parseFloat(grandEl.textContent.replace(/[^0-9.]/g,"")) || 0;

  const mapLink = mapFrame.src.replace("&output=embed",""); // normal Maps link
  const msg =
`${lang==="en"?"New order":"Nuevo pedido"} — Marxia Café
${lines.join("\n")}
${STR[lang].subtotal}: $${subtotal.toFixed(2)}
VAT (${Math.round(VAT_RATE*100)}%): $${vat.toFixed(2)}
${STR[lang].grand}: $${total.toFixed(2)}

${STR[lang].name}: ${name}
WhatsApp: ${wa}
${STR[lang].address}: ${addr}
${STR[lang].refs}: ${refs}
Google Maps: ${mapLink}`;

  const waText = encodeURIComponent(msg);
  // If customer number provided, create a chat to OUR business number with the message.
  // Replace BUSINESS_WA with your number in international format without '+'.
  const BUSINESS_WA = "593987654321";
  const waUrl = `https://wa.me/${BUSINESS_WA}?text=${waText}`;

  window.open(waUrl, "_blank", "noopener");
  addressModal.close();
});

/* ——— FABS ——— */
document.getElementById("themeBtn").addEventListener("click", ()=>{
  const dark = document.body.classList.toggle("theme-dark");
  if(dark){ document.body.classList.remove("theme-light"); }
  else { document.body.classList.add("theme-light"); }
});
const palettes = ["palette-summer","palette-spring"];
let pIdx = 0;
document.getElementById("paletteBtn").addEventListener("click", ()=>{
  document.body.classList.remove(...palettes);
  pIdx = (pIdx+1) % palettes.length;
  document.body.classList.add(palettes[pIdx]);
});
document.getElementById("langBtn").addEventListener("click", ()=>{
  const next = document.body.dataset.lang === "en" ? "es" : "en";
  applyI18n(next);
  // refresh dynamic empty-row label if empty
  if(cart.size===0) renderCart();
});

/* ——— Utilities ——— */
