const $ = (id) => document.getElementById(id);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const rs = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled"
];

let token = localStorage.getItem("gd_admin_token") || "";

let state = {
  status: "All",
  q: "",
  page: 1
};

let timer;


/* =========================
   TOAST
========================= */

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(timer);

  timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}


/* =========================
   API
========================= */

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const response = await fetch("/api/admin" + path, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}


/* =========================
   LOGIN SCREEN
========================= */

function showLogin() {
  $("loginView").hidden = false;
  $("dashView").hidden = true;

  if ($("username")) $("username").focus();
}


/* =========================
   DASHBOARD
========================= */

function showDash() {
  const loginView = document.getElementById("loginView");
  const dashView = document.getElementById("dashView");

  loginView.style.display = "none";
  dashView.hidden = false;
  dashView.style.display = "block";

  loadOrders();
}


/* =========================
   LOGOUT
========================= */

function logout() {
  sessionStorage.removeItem("gd_admin_token");
  token = "";

  showLogin();

  toast("Logged out.");
}


/* =========================
   LOGIN
========================= */

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;

  const errorBox = $("loginErr");

  errorBox.textContent = "";

  try {
    const data = await api("/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password
      })
    });

    token = data.token;

    sessionStorage.setItem("gd_admin_token", token);

    

    showDash();

  } catch (error) {
    errorBox.textContent = error.message;
  }
});


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {
  $("info").textContent = "Loading orders...";
  $("orders").innerHTML = "";
  $("pager").innerHTML = "";

  try {
    const params = new URLSearchParams();

    params.set("page", state.page);

    if (state.status !== "All") {
      params.set("status", state.status);
    }

    if (state.q) {
      params.set("q", state.q);
    }

    const data = await api("/orders?" + params.toString());

    renderTabs(data.counts);
    renderOrders(data);

  } catch (error) {
    if (error.message.includes("login")) {
      logout();
      return;
    }

    $("info").textContent = error.message;
  }
}


/* =========================
   TABS
========================= */

function renderTabs(counts) {
  const tabs = $("tabs");

  const allCount =
    Object.values(counts).reduce((a, b) => a + b, 0);

  const items = [
    ["All", allCount],
    ...STATUSES.map((status) => [
      status,
      counts[status] || 0
    ])
  ];

  tabs.innerHTML = items
    .map(([status, count]) => {
      const active =
        state.status === status ? "active" : "";

      return `
        <button
          class="tab ${active}"
          data-status="${esc(status)}"
        >
          ${esc(status)}
          <span>${count}</span>
        </button>
      `;
    })
    .join("");

  tabs.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      state.page = 1;

      loadOrders();
    });
  });
}


/* =========================
   RENDER ORDERS
========================= */

function renderOrders(data) {
  const orders = data.orders || [];

  $("info").textContent =
    `${data.total} order${data.total === 1 ? "" : "s"} found`;

  if (!orders.length) {
    $("orders").innerHTML = `
      <div class="empty">
        <h2>No orders found</h2>
        <p>New customer orders will appear here.</p>
      </div>
    `;

    $("pager").innerHTML = "";
    return;
  }

  $("orders").innerHTML = orders
    .map((order) => {
      const items = (order.items || [])
        .map(
          (item) => `
            <div class="item">
              <span>
                ${esc(item.name)}
                × ${item.qty}
              </span>

              <strong>
                ${rs(item.price * item.qty)}
              </strong>
            </div>
          `
        )
        .join("");

      const created = order.createdAt
        ? new Date(order.createdAt).toLocaleString("en-IN")
        : "";

      return `
        <article class="order-card">

          <div class="order-top">

            <div>
              <h2>${esc(order.orderId)}</h2>
              <p class="muted">${created}</p>
            </div>

            <select
              class="status-select"
              data-order="${esc(order.orderId)}"
            >
              ${STATUSES.map(
                (status) => `
                  <option
                    value="${esc(status)}"
                    ${order.status === status ? "selected" : ""}
                  >
                    ${esc(status)}
                  </option>
                `
              ).join("")}
            </select>

          </div>

          <div class="customer">

            <h3>Customer</h3>

            <p>
              <strong>Name:</strong>
              ${esc(order.customer?.name)}
            </p>

            <p>
              <strong>Mobile:</strong>
              ${esc(order.customer?.mobile)}
            </p>

            <p>
              <strong>Email:</strong>
              ${esc(order.customer?.email)}
            </p>

          </div>

          <div class="address">

            <h3>Delivery Address</h3>

            <p>
              ${esc(order.address?.house)},
              ${esc(order.address?.street)},
              ${esc(order.address?.city)},
              ${esc(order.address?.state)}
              - ${esc(order.address?.pincode)}
            </p>

            ${
              order.address?.landmark
                ? `<p><strong>Landmark:</strong> ${esc(order.address.landmark)}</p>`
                : ""
            }

          </div>

          <div class="items">

            <h3>Products</h3>

            ${items}

          </div>

          <div class="total-box">

            <div>
              <span>Subtotal</span>
              <strong>${rs(order.subtotal)}</strong>
            </div>

            <div>
              <span>Delivery</span>
              <strong>${rs(order.deliveryCharge)}</strong>
            </div>

            <div class="grand-total">
              <span>Total</span>
              <strong>${rs(order.total)}</strong>
            </div>

          </div>

          <div class="payment">

            <strong>Payment:</strong>
            ${esc(order.paymentMethod)}

          </div>

        </article>
      `;
    })
    .join("");

  document
    .querySelectorAll(".status-select")
    .forEach((select) => {

      select.addEventListener("change", async () => {

        const orderId = select.dataset.order;
        const status = select.value;

        try {

          await api(
            `/orders/${encodeURIComponent(orderId)}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status })
            }
          );

          toast("Order status updated.");

          loadOrders();

        } catch (error) {

          toast(error.message);

          loadOrders();
        }
      });
    });

  renderPager(data);
}


/* =========================
   PAGINATION
========================= */

function renderPager(data) {

  if (!data.pages || data.pages <= 1) {
    $("pager").innerHTML = "";
    return;
  }

  $("pager").innerHTML = `
    <button
      class="btn light"
      id="prevPage"
      ${data.page <= 1 ? "disabled" : ""}
    >
      ← Previous
    </button>

    <span>
      Page ${data.page} of ${data.pages}
    </span>

    <button
      class="btn light"
      id="nextPage"
      ${data.page >= data.pages ? "disabled" : ""}
    >
      Next →
    </button>
  `;

  $("prevPage").onclick = () => {
    if (state.page > 1) {
      state.page--;
      loadOrders();
    }
  };

  $("nextPage").onclick = () => {
    if (state.page < data.pages) {
      state.page++;
      loadOrders();
    }
  };
}


/* =========================
   SEARCH
========================= */

$("search").addEventListener("input", (e) => {

  clearTimeout(timer);

  state.q = e.target.value.trim();
  state.page = 1;

  timer = setTimeout(() => {
    loadOrders();
  }, 400);
});


/* =========================
   BUTTONS
========================= */

$("refreshBtn").onclick = () => {
  loadOrders();
};

$("logoutBtn").onclick = () => {
  logout();
};


/* =========================
   START
========================= */

if (token) {
  showDash();
} else {
  showLogin();
}