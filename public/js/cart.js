/* ── cart.html ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const container   = document.getElementById('cart-items');
  const summaryBox  = document.getElementById('order-summary');
  const checkoutBtn = document.getElementById('checkout-btn');
  const emptyState  = document.getElementById('cart-empty');

  const render = () => {
    const items = Cart.get();

    if (items.length === 0) {
      container.innerHTML  = '';
      summaryBox.innerHTML = '';
      if (emptyState)  emptyState.classList.remove('hidden');
      if (checkoutBtn) checkoutBtn.classList.add('hidden');
      return;
    }

    if (emptyState)  emptyState.classList.add('hidden');
    if (checkoutBtn) checkoutBtn.classList.remove('hidden');

    container.innerHTML = '';
    items.forEach(item => {
      const dp     = discountedPrice(item.price, item.discountPercentage);
      const hasDis = (item.discountPercentage || 0) >= 1;

      const el = document.createElement('div');
      el.className = 'cart-item fade-in';
      el.innerHTML = `
        <div class="cart-item-img">
          <img src="${item.thumbnail || 'https://via.placeholder.com/90'}" alt="${item.title}"
            onerror="this.src='https://via.placeholder.com/90x90?text=?'">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${item.brand || ''}</div>
          <div class="cart-item-name">${item.title}</div>
          <div class="cart-item-price">${fmt(hasDis ? dp : item.price)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-remove" data-id="${item._id}">✕ Remove</button>
          <div class="qty-control">
            <button class="qty-btn" data-id="${item._id}" data-action="dec">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-id="${item._id}" data-action="inc">+</button>
          </div>
          <div style="font-size:15px;font-weight:700;min-width:72px;text-align:right">
            ${fmt((hasDis ? dp : item.price) * item.qty)}
          </div>
        </div>`;
      container.appendChild(el);
    });

    // Qty events
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.id;
        const act = btn.dataset.action;
        const item = Cart.get().find(i => i._id === id);
        if (!item) return;
        if (act === 'inc') Cart.updateQty(id, item.qty + 1);
        else if (act === 'dec' && item.qty > 1) Cart.updateQty(id, item.qty - 1);
        else if (act === 'dec' && item.qty === 1) Cart.remove(id);
        render();
      });
    });

    // Remove events
    container.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        Cart.remove(btn.dataset.id);
        showToast('Item removed', 'info');
        render();
      });
    });

    renderSummary(items);
  };

  const renderSummary = (items) => {
    let subtotal = 0;
    let discount = 0;

    items.forEach(item => {
      const orig = item.price;
      const dp   = discountedPrice(orig, item.discountPercentage);
      subtotal += orig * item.qty;
      discount += (orig - dp) * item.qty;
    });

    const shipping = (subtotal - discount) >= 50 ? 0 : 5.99;
    const total    = subtotal - discount + shipping;

    summaryBox.innerHTML = `
      <div class="order-summary-title">Order Summary</div>
      <div class="summary-row"><span>Subtotal (${Cart.count()} items)</span><span>${fmt(subtotal)}</span></div>
      ${discount > 0 ? `<div class="summary-row" style="color:var(--green)"><span>Discount</span><span>-${fmt(discount)}</span></div>` : ''}
      <div class="summary-row">
        <span>Shipping</span>
        <span class="${shipping === 0 ? 'summary-free' : ''}">${shipping === 0 ? 'FREE' : fmt(shipping)}</span>
      </div>
      <div class="divider"></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
      ${shipping > 0 ? `<p style="font-size:12px;color:var(--text-muted);margin-top:10px">Add ${fmt(50 - (subtotal - discount))} more for free shipping</p>` : ''}`;
  };

  // Checkout button
  checkoutBtn?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please login to checkout', 'info');
      setTimeout(() => location.href = 'login.html?redirect=checkout.html', 900);
    } else {
      location.href = 'checkout.html';
    }
  });

  render();
});
