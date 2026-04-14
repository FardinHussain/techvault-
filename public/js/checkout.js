/* ── checkout.html ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    location.href = 'login.html?redirect=checkout.html';
    return;
  }

  const items = Cart.get();
  if (items.length === 0) { location.href = 'cart.html'; return; }

  // ── Render summary sidebar ────────────────────────────────────
  const summaryEl = document.getElementById('checkout-summary');
  const renderSummary = () => {
    let subtotal = 0, discount = 0;
    items.forEach(item => {
      const dp = discountedPrice(item.price, item.discountPercentage);
      subtotal += item.price * item.qty;
      discount += (item.price - dp) * item.qty;
    });
    const shipping = (subtotal - discount) >= 50 ? 0 : 5.99;
    const total    = subtotal - discount + shipping;

    summaryEl.innerHTML = `
      <div class="order-summary-title">Order Summary</div>
      ${items.map(item => {
        const dp = discountedPrice(item.price, item.discountPercentage);
        return `
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
          <img src="${item.thumbnail||'https://via.placeholder.com/50'}" alt="${item.title}"
            style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"
            onerror="this.src='https://via.placeholder.com/50?text=?'">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.title}</div>
            <div style="font-size:12px;color:var(--text-muted)">Qty: ${item.qty}</div>
          </div>
          <div style="font-size:14px;font-weight:700;flex-shrink:0">${fmt(dp * item.qty)}</div>
        </div>`;
      }).join('')}
      <div class="divider"></div>
      <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
      ${discount > 0 ? `<div class="summary-row" style="color:var(--green)"><span>Discount</span><span>-${fmt(discount)}</span></div>` : ''}
      <div class="summary-row">
        <span>Shipping</span>
        <span class="${shipping===0?'summary-free':''}">${shipping===0?'FREE':fmt(shipping)}</span>
      </div>
      <div class="divider"></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(total)}</span></div>`;
  };
  renderSummary();

  // ── Payment method toggle ─────────────────────────────────────
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input[type=radio]').checked = true;
    });
  });

  // ── Place order ───────────────────────────────────────────────
  const form      = document.getElementById('checkout-form');
  const placeBtn  = document.getElementById('place-order-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = form.fullname.value.trim();
    const address  = form.address.value.trim();
    const city     = form.city.value.trim();
    const state    = form.state.value.trim();
    const pincode  = form.pincode.value.trim();
    const country  = form.country.value.trim();

    if (!fullName || !address || !city || !state || !pincode || !country) {
      showToast('Please fill all shipping fields', 'error'); return;
    }

    placeBtn.disabled = true;
    placeBtn.innerHTML = '<span class="spinner"></span> Placing Order…';

    const paymentMethod = form.querySelector('input[name=payment]:checked')?.value || 'Cash on Delivery';

    const orderItems = items.map(item => ({
      product:   item._id,
      title:     item.title,
      thumbnail: item.thumbnail,
      price:     discountedPrice(item.price, item.discountPercentage),
      quantity:  item.qty,
    }));

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: { fullName, address, city, state, pincode, country },
          paymentMethod,
        })
      });

      Cart.clear();
      sessionStorage.setItem('orderSuccess', '1');
      showToast('Order placed! 🎉', 'success');
      setTimeout(() => location.href = 'orders.html', 1000);
    } catch (err) {
      showToast(err.message, 'error');
      placeBtn.disabled = false;
      placeBtn.textContent = 'Place Order';
    }
  });
});
