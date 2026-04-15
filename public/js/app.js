/* ── Configuration ───────────────────────────────────────────── */
// Fixed: Added /api to the end so fetch('/products') hits the right route
const API_URL = 'https://techvault-acl4.onrender.com/api';

/* ── Auth helpers ────────────────────────────────────────────── */
const getToken = () => localStorage.getItem('tvToken');
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('tvUser')); } catch { return null; }
};
const isLoggedIn = () => !!getToken();
const isAdmin    = () => { const u = getUser(); return u && u.isAdmin; };

const setAuth = (data) => {
  localStorage.setItem('tvToken', data.token);
  localStorage.setItem('tvUser', JSON.stringify({
    _id: data._id, name: data.name, email: data.email, isAdmin: data.isAdmin
  }));
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

/* ── Helpers ─────────────────────────────────────────────────── */
const renderStars = (rating, max = 5) => {
  const full = Math.round(rating || 0);
  let s = '';
  for (let i = 1; i <= max; i++) s += i <= full ? '★' : '☆';
  return s;
};
const fmt = (n) => '$' + Number(n || 0).toFixed(2);
const discountedPrice = (price, pct) => price * (1 - (pct || 0) / 100);

/* ── Cart Logic ──────────────────────────────────────────────── */
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('tvCart')) || []; } catch { return []; } },
  save(items) {
    localStorage.setItem('tvCart', JSON.stringify(items));
    Cart.updateBadge();
  },
  add(product, qty = 1) {
    const items = Cart.get();
    const id = String(product._id);
    const existing = items.find(i => i._id === id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock || 999);
    } else {
      items.push({
        _id: id, title: product.title, brand: product.brand,
        price: product.price, discountPercentage: product.discountPercentage || 0,
        thumbnail: product.thumbnail, stock: product.stock || 999, qty,
      });
    }
    Cart.save(items);
    showToast(`"${product.title}" added to cart`, 'success');
  },
  remove(id) { Cart.save(Cart.get().filter(i => i._id !== String(id))); },
  clear() { Cart.save([]); },
  count() { return Cart.get().reduce((a, i) => a + i.qty, 0); },
  updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(el => {
      const c = Cart.count();
      el.textContent = c > 99 ? '99+' : c;
      el.classList.toggle('hidden', c === 0);
    });
  }
};

/* ── Product Card Builder ────────────────────────────────────── */
const buildProductCard = (p) => {
  const id = p._id;
  const dp = discountedPrice(p.price, p.discountPercentage);
  const hasDis = (p.discountPercentage || 0) >= 1;

  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-card-img" onclick="location.href='product.html?id=${id}'">
      ${hasDis ? `<div class="product-card-discount">-${Math.round(p.discountPercentage)}%</div>` : ''}
      <img src="${p.thumbnail || 'https://via.placeholder.com/300x300?text=No+Image'}" alt="${p.title}">
    </div>
    <div class="product-card-body" onclick="location.href='product.html?id=${id}'">
      <div class="product-card-brand">${p.brand || 'Generic'}</div>
      <div class="product-card-title">${p.title}</div>
      <div class="product-card-rating">
        <span class="stars stars-sm">${renderStars(p.rating)}</span>
        <span>${Number(p.rating || 0).toFixed(1)}</span>
      </div>
      <div class="product-card-price">
        <span class="current">${fmt(hasDis ? dp : p.price)}</span>
        ${hasDis ? `<span class="original">${fmt(p.price)}</span>` : ''}
      </div>
    </div>
    <div class="product-card-footer">
      <button class="btn btn-primary btn-sm btn-full add-to-cart-btn" data-id="${id}" ${p.stock === 0 ? 'disabled' : ''}>
        ${p.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
      </button>
    </div>`;

  card.querySelector('.add-to-cart-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    Cart.add(p);
  });
  return card;
};

/* ── Skeleton Builder ────────────────────────────────────────── */
const buildSkeletons = (n = 8) => {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>`;
    frag.appendChild(el);
  }
  return frag;
};

/* ── Navbar Logic ────────────────────────────────────────────── */
const hydrateNavbar = () => {
  Cart.updateBadge();
  const user = getUser();
  const loginLink = document.getElementById('nav-login-link');
  const userMenu  = document.getElementById('nav-user-menu');
  const userNameEl= document.getElementById('nav-user-name');

  if (loginLink && user) {
    loginLink.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
  }

  // Logout Listener
  document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
    clearAuth();
    location.href = 'index.html';
  });

  // Hamburger
  const ham = document.getElementById('hamburger');
  const mMenu = document.getElementById('mobile-menu');
  if (ham && mMenu) {
    ham.onclick = () => {
      ham.classList.toggle('open');
      mMenu.classList.toggle('open');
    };
  }
};

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', hydrateNavbar);
