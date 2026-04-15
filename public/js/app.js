/* ── Auth helpers ────────────────────────────────────────────── */
const getToken = () => localStorage.getItem('tvToken');
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('tvUser')); } catch { return null; }
};
const clearAuth = () => {
  localStorage.removeItem('tvToken');
  localStorage.removeItem('tvUser');
};

/* ── API fetch wrapper ───────────────────────────────────────── */
const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
};

/* ── Toast ───────────────────────────────────────────────────── */
const showToast = (message, type = 'info', duration = 3500) => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/* ── Cart Helpers ────────────────────────────────────────────── */
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('tvCart')) || []; } catch { return []; } },
  save(items) {
    localStorage.setItem('tvCart', JSON.stringify(items));
    Cart.updateBadge();
  },
  count() { return Cart.get().reduce((a, i) => a + i.qty, 0); },
  updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(el => {
      const c = Cart.count();
      el.textContent = c > 99 ? '99+' : c;
      el.classList.toggle('hidden', c === 0);
    });
  }
};

/* ── UI Builders ─────────────────────────────────────────────── */
const renderStars = (rating) => {
  const full = Math.round(rating || 0);
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '☆';
  return s;
};

const buildProductCard = (p) => {
  const id = p._id;
  const price = p.price || 0;
  const disc = p.discountPercentage || 0;
  const dp = price * (1 - disc / 100);

  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-card-img" onclick="location.href='product.html?id=${id}'">
      ${disc >= 1 ? `<div class="product-card-discount">-${Math.round(disc)}%</div>` : ''}
      <img src="${p.thumbnail || 'https://via.placeholder.com/300x300?text=No+Image'}" alt="${p.title}">
    </div>
    <div class="product-card-body">
      <div class="product-card-brand">${p.brand || 'Generic'}</div>
      <div class="product-card-title">${p.title}</div>
      <div class="product-card-price">
        <span class="current">$${dp.toFixed(2)}</span>
      </div>
    </div>`;
  return card;
};

const buildSkeletons = (n = 8) => {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML = `<div class="skeleton skeleton-img"></div><div class="skeleton-body"><div class="skeleton skeleton-line"></div></div>`;
    frag.appendChild(el);
  }
  return frag;
};

/* ── Navbar Logic ────────────────────────────────────────────── */
const hydrateNavbar = () => {
  Cart.updateBadge();
  const ham = document.getElementById('hamburger');
  const mMenu = document.getElementById('mobile-menu');
  if (ham && mMenu) {
    ham.onclick = () => {
      ham.classList.toggle('open');
      mMenu.classList.toggle('open');
    };
  }
};

document.addEventListener('DOMContentLoaded', hydrateNavbar);
