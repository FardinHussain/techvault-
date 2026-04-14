/* ── admin.html ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const loginWall   = document.getElementById('admin-login-wall');
  const dashboard   = document.getElementById('admin-dashboard');

  if (!isLoggedIn() || !isAdmin()) {
    if (loginWall) loginWall.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');

    // Handle admin login form on login wall
    const adminLoginForm = document.getElementById('admin-login-form');
    adminLoginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = adminLoginForm.querySelector('button[type=submit]');
      const email = adminLoginForm.email.value.trim();
      const pass  = adminLoginForm.password.value;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';
      try {
        const data = await apiFetch('/users/login', {
          method: 'POST', body: JSON.stringify({ email, password: pass })
        });
        if (!data.isAdmin) throw new Error('Not an admin account');
        setAuth(data);
        location.reload();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
    return;
  }

  // User is admin
  if (loginWall) loginWall.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');

  const user = getUser();
  const adminNameEl = document.getElementById('admin-user-name');
  if (adminNameEl) adminNameEl.textContent = user?.name || 'Admin';

  // ── Sidebar navigation ────────────────────────────────────────
  const sections = document.querySelectorAll('.admin-section');
  const navLinks = document.querySelectorAll('.admin-nav-link');

  const showSection = (id) => {
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
  };

  navLinks.forEach(link => {
    link.addEventListener('click', () => showSection(link.dataset.section));
  });
  showSection('section-stats');

  // Logout
  document.getElementById('admin-logout')?.addEventListener('click', () => {
    clearAuth();
    location.reload();
  });

  // ── Stats ──────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      const stats = await apiFetch('/admin/stats');
      document.getElementById('stat-orders').textContent    = stats.totalOrders.toLocaleString();
      document.getElementById('stat-revenue').textContent   = fmt(stats.totalRevenue);
      document.getElementById('stat-products').textContent  = stats.totalProducts.toLocaleString();
      document.getElementById('stat-users').textContent     = stats.totalUsers.toLocaleString();

      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.stat-card', { opacity:0, y:16 }, { opacity:1, y:0, duration:0.4, stagger:0.07 });
      } else {
        document.querySelectorAll('.stat-card').forEach(c => { c.style.opacity='1'; c.style.transform='none'; });
      }
    } catch (err) {
      showToast('Could not load stats: ' + err.message, 'error');
    }
  };

  // ── Orders table ──────────────────────────────────────────────
  const loadOrders = async () => {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

    try {
      const orders = await apiFetch('/admin/orders');
      tbody.innerHTML = '';

      if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No orders yet.</td></tr>';
        return;
      }

      orders.forEach(order => {
        const date    = new Date(order.createdAt).toLocaleDateString();
        const shortId = order._id.slice(-8).toUpperCase();
        const tr      = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="font-family:monospace;font-size:12px">#${shortId}</span></td>
          <td>${order.user?.name || 'Deleted'}<br><span style="font-size:11px;color:var(--text-muted)">${order.user?.email || ''}</span></td>
          <td>${date}</td>
          <td>${order.items?.length || 0} items</td>
          <td><strong>${fmt(order.total)}</strong></td>
          <td>
            <select class="admin-status-select" data-id="${order._id}">
              ${['Processing','Shipped','Delivered','Cancelled'].map(s =>
                `<option${s === order.status ? ' selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.admin-status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            await apiFetch(`/admin/orders/${sel.dataset.id}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: sel.value })
            });
            showToast(`Order status updated to "${sel.value}"`, 'success');
          } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:20px">${err.message}</td></tr>`;
    }
  };

  // ── Products table ────────────────────────────────────────────
  const loadProducts = async () => {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

    try {
      const data = await apiFetch('/products?limit=100');
      tbody.innerHTML = '';

      if (!data.products?.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted)">No products.</td></tr>';
        return;
      }

      data.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display:flex;gap:10px;align-items:center">
              <img src="${p.thumbnail||'https://via.placeholder.com/40'}" alt="${p.title}"
                style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"
                onerror="this.src='https://via.placeholder.com/40?text=?'">
              <span style="font-size:13px;font-weight:600">${p.title}</span>
            </div>
          </td>
          <td style="text-transform:capitalize;font-size:13px">${p.category}</td>
          <td style="font-size:13px">${p.brand||'—'}</td>
          <td><strong>${fmt(p.price)}</strong></td>
          <td>
            <span class="badge ${p.stock===0?'badge-gray':p.stock<10?'badge-orange':'badge-green'}">
              ${p.stock===0?'Out':'In Stock'} (${p.stock})
            </span>
          </td>
          <td>
            <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p._id}" data-title="${p.title}">
              Delete
            </button>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Delete "${btn.dataset.title}"? This cannot be undone.`)) return;
          btn.disabled = true;
          btn.textContent = 'Deleting…';
          try {
            await apiFetch(`/admin/products/${btn.dataset.id}`, { method: 'DELETE' });
            showToast('Product deleted', 'success');
            btn.closest('tr').remove();
            loadStats();
          } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Delete';
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:20px">${err.message}</td></tr>`;
    }
  };

  // Load nav section data on click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.section === 'section-orders')   loadOrders();
      if (link.dataset.section === 'section-products') loadProducts();
    });
  });

  // Initial load
  await loadStats();
});
