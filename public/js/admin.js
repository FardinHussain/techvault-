document.addEventListener('DOMContentLoaded', async () => {
  const loginWall = document.getElementById('admin-login-wall');
  const dashboard = document.getElementById('admin-dashboard');

  if (!isLoggedIn() || !isAdmin()) {
    loginWall?.classList.remove('hidden');
    dashboard?.classList.add('hidden');

    // Handle admin login form on the login wall
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
          method: 'POST',
          body: JSON.stringify({ email, password: pass }),
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

  dashboard?.classList.remove('hidden');
  loginWall?.classList.add('hidden');

  const user = getUser();
  const adminNameEl = document.getElementById('admin-user-name');
  if (adminNameEl) adminNameEl.textContent = user?.name || 'Admin';

  document.getElementById('admin-logout')?.addEventListener('click', () => {
    clearAuth();
    location.reload();
  });

  // ── Load Stats ────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      // /orders/stats is now a registered route (fixed in orderRoutes.js)
      const stats = await apiFetch('/orders/stats');
      const el = (id) => document.getElementById(id);
      if (el('stat-orders'))   el('stat-orders').textContent   = stats.totalOrders ?? '—';
      if (el('stat-revenue'))  el('stat-revenue').textContent  = fmt(stats.totalRevenue ?? 0);
      if (el('stat-products')) el('stat-products').textContent = stats.totalProducts ?? '—';
      if (el('stat-users'))    el('stat-users').textContent    = stats.totalUsers ?? '—';
    } catch (err) {
      showToast('Stats failed: ' + err.message, 'error');
    }
  };

  // ── Load Orders ───────────────────────────────────────────────
  // This function was MISSING — caused ReferenceError when clicking Orders tab
  const loadOrders = async () => {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px">
      <div class="spinner" style="margin:0 auto"></div></td></tr>`;

    try {
      // Uses /orders/all (fixed route — avoids /:id conflict)
      const orders = await apiFetch('/orders/all');

      if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;
          color:var(--text-muted)">No orders yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      orders.forEach(order => {
        const date    = new Date(order.createdAt).toLocaleDateString();
        const shortId = order._id.slice(-8).toUpperCase();
        const tr      = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="font-family:monospace;font-size:12px">#${shortId}</span></td>
          <td>
            ${order.user?.name || 'Deleted'}
            <br><span style="font-size:11px;color:var(--text-muted)">${order.user?.email || ''}</span>
          </td>
          <td>${date}</td>
          <td>${order.items?.length || 0} item(s)</td>
          <td><strong>${fmt(order.total)}</strong></td>
          <td>
            <select class="admin-status-select" data-id="${order._id}">
              ${['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s =>
                `<option${s === order.status ? ' selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </td>`;
        tbody.appendChild(tr);
      });

      // Status change listeners
      tbody.querySelectorAll('.admin-status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            await apiFetch(`/orders/${sel.dataset.id}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: sel.value }),
            });
            showToast(`Status updated to "${sel.value}"`, 'success');
          } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:20px">
        Error: ${err.message}</td></tr>`;
    }
  };

  // ── Load Products ─────────────────────────────────────────────
  const loadProducts = async () => {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px">
      <div class="spinner" style="margin:0 auto"></div></td></tr>`;

    try {
      const data = await apiFetch('/products?limit=100');
      if (!data?.products?.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;
          color:var(--text-muted)">No products.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      data.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display:flex;gap:10px;align-items:center">
              <img src="${p.thumbnail || ''}" alt="${p.title}"
                style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"
                onerror="this.src='https://via.placeholder.com/40?text=?'">
              <span style="font-size:13px;font-weight:600">${p.title}</span>
            </div>
          </td>
          <td style="text-transform:capitalize;font-size:13px">${p.category}</td>
          <td style="font-size:13px">${fmt(p.price)}</td>
          <td>
            <span class="badge ${p.stock === 0 ? 'badge-gray' : p.stock < 10 ? 'badge-orange' : 'badge-green'}">
              ${p.stock === 0 ? 'Out of Stock' : 'In Stock'} (${p.stock})
            </span>
          </td>
          <td>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${p._id}" data-title="${p.title}">
              Delete
            </button>
          </td>`;
        tbody.appendChild(tr);
      });

      // Delete listeners
      tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Delete "${btn.dataset.title}"? This cannot be undone.`)) return;
          btn.disabled = true;
          btn.textContent = 'Deleting…';
          try {
            // DELETE /api/products/:id — now registered in productRoutes.js
            await apiFetch(`/products/${btn.dataset.id}`, { method: 'DELETE' });
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
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:20px">
        Error: ${err.message}</td></tr>`;
    }
  };

  // ── Sidebar navigation ────────────────────────────────────────
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const sec = link.dataset.section;
      document.querySelectorAll('.admin-section').forEach(s =>
        s.classList.toggle('active', s.id === sec)
      );
      if (sec === 'section-orders')   loadOrders();
      if (sec === 'section-products') loadProducts();
    });
  });

  // ── Initial load ──────────────────────────────────────────────
  loadStats();
});
