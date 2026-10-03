/* ============================================
   STEP 1: APNA WHATSAPP NUMBER (optional contact button)
   Format: 91 + 10 digit number (no + , no space)
   ============================================ */
const WHATSAPP_NUMBER = "918368803181";

/* ============================================
   STEP 2: DELIVERY CHARGE (rupees)
   0 = abhi charge fix nahi hai (checkout par "Confirmed on call" dikhega)
   Apna charge fix karein to yahan number likhein, jaise 60
   ============================================ */
const DELIVERY_CHARGE = 0;

/* ============================================
   STEP 3: PRODUCTS — naam, price, photo, etc.
   Price hamesha 399 se 1450 ke beech rakhein.
   ============================================ */
const products = [
  { id: 1, name: "Royal Blue & Red Gopi Dress", price: 750, image: "images/product-01.jpg",
    description: "Elegant traditional Gopi dress for festive occasions.", colour: "Blue & Red",
    sizes: "S,M,L,XL", fabric: "rayon", care: "Hand wash gently with mild detergent." },
  { id: 2, name: "Sunset Pink Gopi Dress", price: 850, image: "images/product-02.jpg",
    description: "Beautiful ethnic design with a graceful festive look.", colour: "Orange & Pink",
    sizes: "S,M,L,XL", fabric: "silk", care: "Do not use bleach or harsh chemicals." },
  { id: 3, name: "Magenta Floral Gopi Dress", price: 550, image: "images/product-03.jpg",
    description: "Comfortable festive wear with a lovely floral print.", colour: "Magenta Pink",
    sizes: "S,M,L,XL", fabric: "cotton", care: "Wash dark and light colours separately." },
  { id: 4, name: "Green Gopi Dress", price:600, image: "images/product-05.jpg",
    description: "Elegant traditional Gopi dress in a fresh shade.", colour: "Green",
    sizes: "S,M", fabric: "rayon", care: "Dry in shade; avoid direct sunlight." },
  { id: 5, name: "Golden Yellow Gopi Dress", price: 450, image: "images/product-04.jpg",
    description: "Beautiful ethnic print, comfortable for every occasion.", colour: "Yellow",
    sizes: "S,M,L,XL", fabric: "cotton", care: " Iron on low heat from the reverse side." }
];

/* ---------- Isse neeche code badalne ki zaroorat nahi ---------- */
const $ = id => document.getElementById(id);
const rs = n => "₹" + Number(n).toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let cart = load("gopi_cart", []); // [{id, qty}]

const waLink = text => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
const orderLink = p => waLink("Hello Gopi Dress,\nI am interested in:\nProduct: " + p.name + "\nPrice: ₹" + p.price + "\nPlease share availability and ordering details.");

/* ---------- Views ---------- */
function showView(v) {
  ["shopView", "checkoutView", "confirmView"].forEach(id => ($(id).hidden = id !== v));
  window.scrollTo(0, 0);
}

/* ---------- Product grid ---------- */
function renderProducts(min, max) {
  const list = products.filter(p => p.price >= min && p.price <= max);
  $("productGrid").innerHTML = list.map(p => `
    <article class="pcard">
      <div class="pimg" onclick="openDetails(${p.id})"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="pinfo">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <div class="price">${rs(p.price)}</div>
        <div class="pbtns">
          <button class="btn ghost" onclick="openDetails(${p.id})">View Details</button>
          <button class="btn primary" onclick="addToCart(${p.id})">Add to Cart</button>
          <a class="wa-opt" href="${orderLink(p)}" target="_blank" rel="noopener">or Order on WhatsApp</a>
        </div>
      </div>
    </article>`).join("");
  $("emptyMsg").hidden = list.length > 0;
}

function openDetails(id) {
  const p = products.find(x => x.id === id);
  $("modalBody").innerHTML = `
    <img src="${p.image}" alt="${esc(p.name)}">
    <div class="mtext">
      <h3>${esc(p.name)}</h3>
      <div class="price">${rs(p.price)}</div>
      <p>${esc(p.description)}</p>
      <p><b>Available sizes:</b> ${esc(p.sizes)}</p>
      <p><b>Fabric:</b> ${esc(p.fabric)}</p>
      <p><b>Colour:</b> ${esc(p.colour)}</p>
      <p><b>Care:</b> ${esc(p.care)}</p>
      <button class="btn primary" onclick="addToCart(${p.id});closeModal();openDrawer()">Add to Cart</button>
      <a class="wa-opt" href="${orderLink(p)}" target="_blank" rel="noopener">or Order on WhatsApp (optional)</a>
    </div>`;
  $("modal").hidden = false;
}
function closeModal() { $("modal").hidden = true; }

/* ---------- Cart ---------- */
function cartItems() {
  return cart.map(c => ({ p: products.find(x => x.id === c.id), qty: c.qty })).filter(i => i.p && i.qty > 0);
}
function totals() {
  const sub = cartItems().reduce((s, i) => s + i.p.price * i.qty, 0);
  return { sub, del: DELIVERY_CHARGE, total: sub + DELIVERY_CHARGE };
}
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}
function addToCart(id) {
  const c = cart.find(x => x.id === id);
  if (c) c.qty++; else cart.push({ id, qty: 1 });
  renderCart(); toast("Added to cart ✓");
}
function changeQty(id, d) {
  const c = cart.find(x => x.id === id); if (!c) return;
  c.qty += d;
  if (c.qty < 1) cart = cart.filter(x => x.id !== id);
  renderCart();
}
function removeItem(id) { cart = cart.filter(x => x.id !== id); renderCart(); }

function renderCart() {
  const items = cartItems();
  cart = items.map(i => ({ id: i.p.id, qty: i.qty }));
  save("gopi_cart", cart);
  $("cartCount").textContent = items.reduce((s, i) => s + i.qty, 0);
  if (!items.length) {
    $("cartItems").innerHTML = '<p class="empty">Your cart is empty.<br>Add a beautiful Gopi dress!</p>';
    $("cartFoot").hidden = true;
  } else {
    $("cartItems").innerHTML = items.map(({ p, qty }) => `
      <div class="citem">
        <img src="${p.image}" alt="${esc(p.name)}">
        <div>
          <b>${esc(p.name)}</b>
          <div class="p">${rs(p.price)}</div>
          <div class="qrow">
            <div class="qty"><button onclick="changeQty(${p.id},-1)" aria-label="Decrease">−</button><span>${qty}</span><button onclick="changeQty(${p.id},1)" aria-label="Increase">+</button></div>
            <button class="rm" onclick="removeItem(${p.id})">Remove</button>
            <span class="lt">${rs(p.price * qty)}</span>
          </div>
        </div>
      </div>`).join("");
    const t = totals();
    $("cartSub").textContent = rs(t.sub);
    $("cartTotal").textContent = rs(t.sub);
    $("cartFoot").hidden = false;
  }
  renderSummary();
}

function openDrawer() { $("drawer").classList.add("open"); $("overlay").hidden = false; }
function closeDrawer() { $("drawer").classList.remove("open"); $("overlay").hidden = true; }

/* ---------- Checkout ---------- */
const delText = () => (DELIVERY_CHARGE > 0 ? rs(DELIVERY_CHARGE) : "Confirmed on call");
function renderSummary() {
  const items = cartItems(), t = totals();
  $("summaryItems").innerHTML = items.map(({ p, qty }) => `
    <div class="sitem"><img src="${p.image}" alt="${esc(p.name)}">
      <div><b>${esc(p.name)}</b><br>Qty ${qty} × ${rs(p.price)}</div><b>${rs(p.price * qty)}</b></div>`).join("");
  $("sumSub").textContent = rs(t.sub);
  $("sumDel").textContent = delText();
  $("sumTotal").textContent = rs(t.total);
}
function goCheckout() {
  if (!cartItems().length) return toast("Your cart is empty");
  closeDrawer(); renderSummary(); showView("checkoutView");
}

const rules = {
  name: v => v.trim().length >= 3 || "Please enter your full name",
  mobile: v => /^[6-9]\d{9}$/.test(v) || "Enter a valid 10-digit mobile number",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Enter a valid email address",
  house: v => v.trim().length >= 1 || "Please enter house / flat number",
  street: v => v.trim().length >= 3 || "Please enter street / area",
  city: v => v.trim().length >= 2 || "Please enter your city",
  state: v => v.trim().length >= 2 || "Please enter your state",
  pincode: v => /^[1-9]\d{5}$/.test(v) || "Enter a valid 6-digit pincode"
};
function validateField(id) {
  const el = $(id), r = rules[id] ? rules[id](el.value) : true;
  const box = el.closest(".field");
  box.classList.toggle("bad", r !== true);
  box.querySelector(".err").textContent = r === true ? "" : r;
  return r === true;
}

const form = $("checkoutForm");
const fields = ["name", "mobile", "email", "house", "street", "city", "state", "pincode", "landmark"];

// Save typed details temporarily in this browser (draft)
const draft = load("gopi_draft", {});
fields.forEach(f => {
  if (draft[f]) $(f).value = draft[f];
  $(f).addEventListener("input", () => {
    if (f === "mobile" || f === "pincode") $(f).value = $(f).value.replace(/\D/g, "");
    draft[f] = $(f).value; save("gopi_draft", draft);
    if ($(f).closest(".field").classList.contains("bad")) validateField(f);
  });
  $(f).addEventListener("blur", () => rules[f] && validateField(f));
});


  form.addEventListener("submit", async e => {
  e.preventDefault();

  const items = cartItems();

  if (!items.length) {
    return toast("Your cart is empty");
  }

  let firstBad = null;

  Object.keys(rules).forEach(f => {
    if (!validateField(f) && !firstBad) {
      firstBad = $(f);
    }
  });

  if (firstBad) {
    firstBad.focus();
    return;
  }

  const t = totals();

  const order = {
    customer: {
      name: $("name").value.trim(),
      mobile: $("mobile").value,
      email: $("email").value.trim()
    },

    address: {
      house: $("house").value.trim(),
      street: $("street").value.trim(),
      city: $("city").value.trim(),
      state: $("state").value.trim(),
      pincode: $("pincode").value,
      landmark: $("landmark").value.trim()
    },

    items: items.map(i => ({
      productId: i.p.id,
      name: i.p.name,
      price: i.p.price,
      qty: i.qty
    })),

    subtotal: t.sub,

    deliveryCharge: t.del,

    total: t.total,

    paymentMethod: "Cash on Delivery"
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not place order.");
    }

    const savedOrder = {
      ...order,
      orderId: data.orderId,
      placedAt: data.createdAt || new Date().toISOString()
    };

    save("gopi_last_order", savedOrder);

    cart = [];
    renderCart();

    showConfirmation(savedOrder);

  } catch (error) {
    console.error("Order error:", error);
    toast(error.message);
  }
});

function showConfirmation(o) {
  $("cName").textContent = o.customer.name;
  $("cId").textContent = o.orderId;
  $("cItems").innerHTML = o.items.map(i => `<div class="line"><span>${esc(i.name)} × ${i.qty}</span><span>${rs(i.price * i.qty)}</span></div>`).join("") +
    `<div class="line"><span>Delivery charge</span><span>${o.delivery > 0 ? rs(o.delivery) : "Confirmed on call"}</span></div>`;
  $("cTotal").textContent = rs(o.total);
  $("cPay").textContent = "Payment method: " + o.payment;
  const lines = o.items.map(i => "- " + i.name + " x" + i.qty + " (₹" + i.price * i.qty + ")").join("\n");
  $("cWa").href = waLink("Hello Gopi Dress,\nI placed an order.\nOrder ID: " + o.orderId + "\nName: " + o.customer.name + "\n" + lines + "\nTotal: ₹" + o.total);
  showView("confirmView");
}

/* ---------- Events ---------- */
document.querySelectorAll(".price-card").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".price-card").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(+btn.dataset.min, +btn.dataset.max);
    $("shop").scrollIntoView();
  };
});
document.querySelectorAll(".wa-link").forEach(a => {
  a.href = waLink("Hello Gopi Dress, I would like to know more about your dresses.");
  a.target = "_blank"; a.rel = "noopener";
});
$("closeModal").onclick = closeModal;
$("modal").onclick = e => { if (e.target === $("modal")) closeModal(); };
$("cartBtn").onclick = openDrawer;
$("closeDrawer").onclick = closeDrawer;
$("overlay").onclick = closeDrawer;
$("toCheckout").onclick = goCheckout;
$("backToShop").onclick = () => showView("shopView");
$("cShop").onclick = () => showView("shopView");
$("burger").onclick = () => $("menu").classList.toggle("open");
document.querySelectorAll("a[href^='#']:not(.wa-link)").forEach(a => a.addEventListener("click", () => {
  $("menu").classList.remove("open");
  if ($("shopView").hidden) showView("shopView");
}));
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeDrawer(); } });

renderProducts(0, 9999);
renderCart();