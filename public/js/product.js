/* ── product.html ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'shop.html'; return; }

  const main = document.getElementById('product-main');

  const renderProduct = (p) => {
    const dp     = discountedPrice(p.price, p.discountPercentage);
    const hasDis = (p.discountPercentage || 0) >= 1;
    const inStock = p.stock > 0;

    document.title = `${p.title} — TechVault`;

    main.innerHTML = `
      <div class="product-detail-grid">
        <!-- Gallery -->
        <div>
          <div class="gallery-main">
            <img id="gallery-main-img"
              src="${p.images?.[0] || p.thumbnail || 'https://via.placeholder.com/600'}"
              alt="${p.title}"
              onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
          </div>
          <div class="gallery-thumbs" id="gallery-thumbs">
            ${(p.images || [p.thumbnail]).filter(Boolean).slice(0, 6).map((img, i) => `
              <div class="gallery-thumb${i === 0 ? ' active' : ''}" data-img="${img}">
                <img src="${img}" alt="thumb ${i+1}" loading="lazy"
                  onerror="this.src='https://via.placeholder.com/80x80?text=?'">
              </div>`).join('')}
          </div>
        </div>

        <!-- Info -->
        <div>
          <div class="product-info-brand">${p.brand || 'Generic'} · ${p.category}</div>
          <h1 class="product-info-title">${p.title}</h1>

          <div class="product-info-meta">
            <span class="stars">${renderStars(p.rating)}</span>
            <span style="color:var(--text-secondary);font-size:14px">${Number(p.rating).toFixed(1)} (${p.numReviews || 0} reviews)</span>
          </div>

          <div class="product-info-price">
            <span class="price-current">${fmt(hasDis ? dp : p.price)}</span>
            ${hasDis ? `
              <span class="price-original">${fmt(p.price)}</span>
              <span class="price-discount">-${Math.round(p.discountPercentage)}%</span>` : ''}
          </div>

          <div class="product-info-stock">
            ${inStock
              ? p.stock < 10
                ? `<span class="badge badge-orange">⚠ Only ${p.stock} left</span>`
                : `<span class="badge badge-green">✓ In Stock</span>`
              : `<span class="badge badge-gray">✗ Out of Stock</span>`}
          </div>

          <div class="add-cart-row">
            <div class="qty-control">
              <button class="qty-btn" id="qty-minus">−</button>
              <input class="qty-value" id="qty-input" type="number" value="1" min="1" max="${p.stock || 1}" readonly>
              <button class="qty-btn" id="qty-plus">+</button>
            </div>
            <button class="btn btn-primary btn-lg" id="add-cart-btn" ${!inStock ? 'disabled' : ''}>
              ${inStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          <div class="product-info-desc">${p.description || ''}</div>

          ${p.tags?.length ? `
            <div class="product-tags">
              ${p.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
            </div>` : ''}

          <div class="divider"></div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:var(--text-secondary)">
            <div>🚚 <strong>Free shipping</strong> on orders over $50</div>
            <div>↩️ <strong>30-day</strong> easy returns</div>
            <div>🔒 <strong>Secure</strong> checkout</div>
          </div>
        </div>
      </div>`;

    // Gallery click
    document.getElementById('gallery-thumbs')?.addEventListener('click', (e) => {
      const thumb = e.target.closest('.gallery-thumb');
      if (!thumb) return;
      const img = document.getElementById('gallery-main-img');
      img.classList.add('swapping');
      setTimeout(() => {
        img.src = thumb.dataset.img;
        img.classList.remove('swapping');
      }, 200);
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });

    // Qty controls
    let qty = 1;
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
      if (qty > 1) { qty--; qtyInput.value = qty; }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      if (qty < (p.stock || 1)) { qty++; qtyInput.value = qty; }
    });

    // Add to cart
    document.getElementById('add-cart-btn')?.addEventListener('click', () => {
      Cart.add(p, qty);
    });
  };

  // ── Render reviews ────────────────────────────────────────────
  const loadReviews = async () => {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    container.innerHTML = '<div class="spinner spinner-lg" style="margin:20px auto;display:block"></div>';

    try {
      const reviews = await apiFetch(`/reviews/${id}`);
      container.innerHTML = '';

      if (reviews.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">No reviews yet. Be the first!</p>';
      } else {
        reviews.forEach(r => {
          const el = document.createElement('div');
          el.className = 'review-card fade-in';
          el.innerHTML = `
            <div class="review-header">
              <div>
                <div class="reviewer-name">${r.userName}</div>
                <div class="stars stars-sm">${renderStars(r.rating)}</div>
              </div>
              <div class="review-date">${new Date(r.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</div>
            </div>
            <div class="review-comment">${r.comment}</div>`;
          container.appendChild(el);
        });
      }

      // Write-a-review box
      const writeBox = document.getElementById('write-review-box');
      if (writeBox) {
        if (isLoggedIn()) {
          writeBox.classList.remove('hidden');
          initReviewForm();
        } else {
          writeBox.innerHTML = `<p style="color:var(--text-secondary);font-size:14px">
            <a href="login.html?redirect=product.html%3Fid%3D${id}" style="color:var(--accent)">Login</a> to write a review.</p>`;
          writeBox.classList.remove('hidden');
        }
      }
    } catch {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">Could not load reviews.</p>';
    }
  };

  const initReviewForm = () => {
    const form = document.getElementById('review-form');
    if (!form) return;

    const stars = form.querySelectorAll('.star-pick');
    let chosenRating = 0;

    stars.forEach((star, i) => {
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, j) => s.classList.toggle('on', j <= i));
      });
      star.addEventListener('mouseleave', () => {
        stars.forEach((s, j) => s.classList.toggle('on', j < chosenRating));
      });
      star.addEventListener('click', () => {
        chosenRating = i + 1;
        stars.forEach((s, j) => s.classList.toggle('on', j < chosenRating));
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!chosenRating) { showToast('Please select a star rating', 'error'); return; }
      const comment = form.comment.value.trim();
      if (!comment) { showToast('Please write a comment', 'error'); return; }

      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';

      try {
        await apiFetch(`/reviews/${id}`, {
          method: 'POST',
          body: JSON.stringify({ rating: chosenRating, comment })
        });
        showToast('Review submitted!', 'success');
        form.reset();
        chosenRating = 0;
        stars.forEach(s => s.classList.remove('on'));
        loadReviews();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Review';
      }
    });
  };

  // ── Load related products ─────────────────────────────────────
  const loadRelated = async (category) => {
    const grid = document.getElementById('related-grid');
    if (!grid) return;

    try {
      const data = await apiFetch(`/products?category=${encodeURIComponent(category)}&limit=5`);
      const others = (data.products || []).filter(p => p._id !== id).slice(0, 4);
      grid.innerHTML = '';
      if (!others.length) { grid.closest('section')?.classList.add('hidden'); return; }
      others.forEach(p => grid.appendChild(buildProductCard(p)));
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(grid.querySelectorAll('.product-card'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 });
      } else {
        grid.querySelectorAll('.product-card').forEach(c => { c.style.opacity='1'; c.style.transform='none'; });
      }
    } catch { /* silent */ }
  };

  // ── Main load ─────────────────────────────────────────────────
  main.innerHTML = '<div style="display:flex;justify-content:center;padding:80px"><div class="spinner spinner-lg"></div></div>';

  try {
    const product = await apiFetch(`/products/${id}`);
    renderProduct(product);
    loadReviews();
    loadRelated(product.category);
  } catch (err) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Product Not Found</h3>
        <p>${err.message}</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:20px">Browse Shop</a>
      </div>`;
  }
});
