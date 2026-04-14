/* ── orders.html ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (!isLoggedIn()) {
    location.href = 'login.html?redirect=orders.html';
    return;
  }

  // Show success banner if coming from checkout
  if (sessionStorage.getItem('orderSuccess')) {
    sessionStorage.removeItem('orderSuccess');
    showToast('🎉 Order placed successfully! Thank you for shopping with TechVault.', 'success', 5000);
  }

  const container = document.getElementById('orders-container');
  const emptyEl   = document.getElementById('orders-empty');

  container.innerHTML = '<div style="display:flex;justify-content:center;padding:60px"><div class="spinner spinner-lg"></div></div>';

  try {
    const orders = await apiFetch('/orders/myorders');

    if (orders.length === 0) {
      container.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      return;
    }

    emptyEl?.classList.add('hidden');
    container.innerHTML = '';

    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const shortId = order._id.slice(-8).toUpperCase();
      const statusCls = `badge status-${order.status}`;

      const thumbsHtml = () => {
        const shown = order.items.slice(0, 4);
        const extra = order.items.length - shown.length;
        return shown.map(item => `
          <div class="order-item-thumb">
            <img src="${item.thumbnail || 'https://via.placeholder.com/54'}" alt="${item.title}"
              onerror="this.src='https://via.placeholder.com/54?text=?'">
          </div>`).join('') +
          (extra > 0 ? `<div class="order-item-more">+${extra}</div>` : '');
      };

      const el = document.createElement('div');
      el.className = 'order-card fade-in';
      el.innerHTML = `
        <div class="order-card-header">
          <div>
            <div style="font-size:13px;font-weight:700;margin-bottom:4px">Order #${shortId}</div>
            <div class="order-date">${date}</div>
          </div>
          <span class="badge ${statusCls}">${order.status}</span>
        </div>

        <div class="order-items-preview">${thumbsHtml()}</div>

        <div class="divider" style="margin:16px 0"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">
              ${order.items.length} item${order.items.length !== 1 ? 's' : ''} ·
              ${order.paymentMethod}
            </div>
            <div style="font-size:12px;color:var(--text-muted)">
              Ship to: ${order.shippingAddress?.fullName}, ${order.shippingAddress?.city}, ${order.shippingAddress?.country}
            </div>
          </div>
          <div class="order-total">${fmt(order.total)}</div>
        </div>

        <details style="margin-top:16px">
          <summary style="font-size:13px;color:var(--text-secondary);cursor:pointer">View items</summary>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            ${order.items.map(item => `
              <div style="display:flex;gap:10px;align-items:center">
                <img src="${item.thumbnail||'https://via.placeholder.com/40'}" alt="${item.title}"
                  style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid var(--border)"
                  onerror="this.src='https://via.placeholder.com/40?text=?'">
                <div style="flex:1;font-size:13px">${item.title}</div>
                <div style="font-size:13px;color:var(--text-secondary)">×${item.quantity}</div>
                <div style="font-size:13px;font-weight:700">${fmt(item.price * item.quantity)}</div>
              </div>`).join('')}
          </div>
        </details>`;

      container.appendChild(el);
    });

    // Animate
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.order-card',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 });
    } else {
      document.querySelectorAll('.order-card').forEach(c => { c.style.opacity='1'; c.style.transform='none'; });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Failed to load orders</h3>
        <p>${err.message}</p>
      </div>`;
  }
});
