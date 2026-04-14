/* ── shop.html ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const grid       = document.getElementById('products-grid');
  const pagination = document.getElementById('pagination');
  const countEl    = document.getElementById('shop-count');
  const searchInp  = document.getElementById('shop-search');
  const sortSel    = document.getElementById('shop-sort');
  const catList    = document.getElementById('category-list');
  const priceRange = document.getElementById('price-range');
  const priceLabel = document.getElementById('price-label');
  const ratingBtns = document.querySelectorAll('.rating-option input');
  const clearBtn   = document.getElementById('clear-filters');

  let currentPage = 1;
  let currentCat  = '';
  let currentSort = '';
  let currentSearch = '';
  let currentRating = 0;
  let maxPrice = 1500;
  let searchTimer;

  // ── Load categories ──────────────────────────────────────────
  const loadCategories = async () => {
    try {
      const cats = await apiFetch('/products/categories');
      catList.innerHTML = '';

      // "All" button
      const allBtn = document.createElement('button');
      allBtn.className = 'filter-category-btn active';
      allBtn.textContent = 'All Categories';
      allBtn.dataset.cat = '';
      catList.appendChild(allBtn);

      cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-category-btn';
        btn.textContent = cat;
        btn.dataset.cat = cat;
        catList.appendChild(btn);
      });

      catList.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-category-btn');
        if (!btn) return;
        catList.querySelectorAll('.filter-category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat  = btn.dataset.cat;
        currentPage = 1;
        loadProducts();
      });
    } catch (err) {
      catList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:8px">Failed to load categories</p>';
    }
  };

  // ── Price range ──────────────────────────────────────────────
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      maxPrice = parseInt(priceRange.value);
      priceLabel.textContent = `$0 — $${maxPrice}`;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { currentPage = 1; loadProducts(); }, 400);
    });
  }

  // ── Rating filter ────────────────────────────────────────────
  ratingBtns.forEach(radio => {
    radio.addEventListener('change', () => {
      currentRating = parseInt(radio.value) || 0;
      currentPage   = 1;
      loadProducts();
    });
  });

  // ── Search ───────────────────────────────────────────────────
  searchInp?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInp.value.trim();
      currentPage   = 1;
      loadProducts();
    }, 350);
  });

  // ── Sort ─────────────────────────────────────────────────────
  sortSel?.addEventListener('change', () => {
    currentSort = sortSel.value;
    currentPage = 1;
    loadProducts();
  });

  // ── Clear filters ────────────────────────────────────────────
  clearBtn?.addEventListener('click', () => {
    currentCat    = '';
    currentSort   = '';
    currentSearch = '';
    currentRating = 0;
    currentPage   = 1;
    maxPrice      = 1500;
    if (searchInp) searchInp.value = '';
    if (sortSel)   sortSel.value = '';
    if (priceRange) { priceRange.value = 1500; priceLabel.textContent = '$0 — $1500'; }
    catList?.querySelectorAll('.filter-category-btn').forEach(b => b.classList.remove('active'));
    catList?.querySelector('[data-cat=""]')?.classList.add('active');
    ratingBtns.forEach(r => r.checked = false);
    loadProducts();
  });

  // ── Load products ────────────────────────────────────────────
  const loadProducts = async () => {
    grid.innerHTML = '';
    grid.appendChild(buildSkeletons(20));

    try {
      const params = new URLSearchParams({
        page: currentPage, limit: 20,
        ...(currentCat    && { category: currentCat }),
        ...(currentSearch && { search: currentSearch }),
        ...(currentSort   && { sort: currentSort }),
      });

      const data = await apiFetch(`/products?${params}`);
      grid.innerHTML = '';

      let products = data.products || [];

      // Client-side rating + price filter
      if (currentRating > 0) products = products.filter(p => p.rating >= currentRating);
      products = products.filter(p => p.price <= maxPrice);

      if (countEl) countEl.textContent = `${data.total} products`;

      if (products.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search term.</p>
          </div>`;
        pagination.innerHTML = '';
        return;
      }

      products.forEach(p => grid.appendChild(buildProductCard(p)));

      // Re-run GSAP
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(grid.querySelectorAll('.product-card'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' });
      } else {
        grid.querySelectorAll('.product-card').forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
      }

      renderPagination(data.page, data.pages);
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">⚠️</div>
          <h3>Failed to load products</h3>
          <p>${err.message}</p>
        </div>`;
      pagination.innerHTML = '';
    }
  };

  // ── Pagination ───────────────────────────────────────────────
  const renderPagination = (page, pages) => {
    pagination.innerHTML = '';
    if (pages <= 1) return;

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '‹';
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => { currentPage--; loadProducts(); window.scrollTo(0,0); });
    pagination.appendChild(prev);

    const range = pagRange(page, pages);
    range.forEach(p => {
      if (p === '…') {
        const el = document.createElement('span');
        el.textContent = '…'; el.style.padding = '0 6px'; el.style.color = 'var(--text-muted)';
        pagination.appendChild(el);
        return;
      }
      const btn = document.createElement('button');
      btn.className = `page-btn${p === page ? ' active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => { currentPage = p; loadProducts(); window.scrollTo(0,0); });
      pagination.appendChild(btn);
    });

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '›';
    next.disabled = page >= pages;
    next.addEventListener('click', () => { currentPage++; loadProducts(); window.scrollTo(0,0); });
    pagination.appendChild(next);
  };

  const pagRange = (cur, total) => {
    if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
    if (cur <= 4)  return [1,2,3,4,5,'…',total];
    if (cur >= total-3) return [1,'…',total-4,total-3,total-2,total-1,total];
    return [1,'…',cur-1,cur,cur+1,'…',total];
  };

  // ── Check URL for pre-selected category ─────────────────────
  const urlCat = new URLSearchParams(location.search).get('category');
  if (urlCat) {
    currentCat = urlCat;
  }

  await loadCategories();

  // Highlight preselected cat after DOM update
  if (urlCat) {
    catList?.querySelectorAll('.filter-category-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat.toLowerCase() === urlCat.toLowerCase());
    });
  }

  loadProducts();
});
