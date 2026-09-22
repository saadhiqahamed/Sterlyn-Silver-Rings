/* ============================================================
   STERLYN Silver Rings — app.js
   All application logic: data, rendering, APIs, interactions
   ============================================================ */
'use strict';

// ─── CONFIG ─────────────────────────────────────────────────
const CONFIG = {
  phone:       '+94758600747',
  phoneDisplay:'+94 75 860 0747',
  waNumber:    '94758600747',
  brand:       'STERLYN',
  tagline:     'Wear Your Silver Story',
  email:       'hello@sterlyn.lk',
  instagram:   'sterlyn.lk',
  jsonPath:    'data/rings.json',
  fallbackRate:   305,
  fallbackSilver: 0.97,
};

// ─── STATE ──────────────────────────────────────────────────
const state = {
  rings:        [],
  currency:     localStorage.getItem('sterlyn_currency') || 'LKR',
  usdToLkr:     parseFloat(localStorage.getItem('sterlyn_rate')   || CONFIG.fallbackRate),
  silverUSD:    parseFloat(localStorage.getItem('sterlyn_silver') || CONFIG.fallbackSilver),
  wishlist:     JSON.parse(localStorage.getItem('sterlyn_wishlist') || '[]'),
  activeFilter: 'all',
  activeSort:   'default',
  selectedSize:   null,
  selectedFinish: null,
};

// ─── CURRENCY HELPERS ────────────────────────────────────────
function formatPrice(usdPrice) {
  if (state.currency === 'LKR') {
    const lkr = usdPrice * state.usdToLkr;
    return 'Rs.\u00a0' + Math.round(lkr).toLocaleString('en-LK');
  }
  return '$' + usdPrice.toFixed(2);
}

function buildWA(text) {
  return 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(text);
}

// ─── API CALLS ───────────────────────────────────────────────
async function fetchExchangeRate() {
  try {
    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.rates && data.rates.LKR) {
      state.usdToLkr = data.rates.LKR;
      localStorage.setItem('sterlyn_rate', state.usdToLkr);
    }
  } catch { /* use cached/fallback */ }
}

async function fetchSilverPrice() {
  try {
    const res  = await fetch('https://api.metals.live/v1/spot');
    const raw  = await res.json();
    let oz = null;
    if (Array.isArray(raw)) {
      const entry = raw.find(d => d.silver !== undefined);
      if (entry) oz = entry.silver;
    } else if (raw.silver) { oz = raw.silver; }
    else if (raw.XAG)    { oz = raw.XAG; }
    if (oz && oz > 0) {
      state.silverUSD = oz / 31.1035;
      localStorage.setItem('sterlyn_silver', state.silverUSD);
    }
  } catch { /* use cached/fallback */ }
}

async function fetchRings() {
  try {
    const res  = await fetch(CONFIG.jsonPath);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.rings = await res.json();
  } catch (e) {
    console.error('Could not load rings.json:', e.message);
  }
}

// ─── WISHLIST ────────────────────────────────────────────────
function toggleWishlist(id) {
  const i = state.wishlist.indexOf(id);
  if (i === -1) state.wishlist.push(id);
  else           state.wishlist.splice(i, 1);
  localStorage.setItem('sterlyn_wishlist', JSON.stringify(state.wishlist));
  updateWishlistBadge();
  document.querySelectorAll('.wishlist-btn[data-id="' + id + '"]').forEach(btn => {
    const active = state.wishlist.includes(id);
    btn.classList.toggle('active', active);
    btn.innerHTML = active ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
  });
}

function updateWishlistBadge() {
  document.querySelectorAll('.badge-count').forEach(el => {
    el.textContent = state.wishlist.length;
    el.style.display = state.wishlist.length > 0 ? 'flex' : 'none';
  });
}

function updateAllPrices() {
  document.querySelectorAll('[data-usd]').forEach(el => {
    el.textContent = formatPrice(parseFloat(el.dataset.usd));
  });
}

// ─── ANNOUNCEMENT BAR ────────────────────────────────────────
function renderAnnouncement() {
  const bar = document.getElementById('announcement-bar');
  if (!bar) return;
  bar.innerHTML = `
    <div class="d-flex align-items-center justify-content-center gap-3 flex-wrap" style="gap:0.75rem!important">
      <span>📞 Call / WhatsApp: <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a></span>
      <span class="d-none d-sm-inline" style="color:rgba(255,255,255,0.3)">|</span>
      <span>🇱🇰 Handcrafted in Sri Lanka</span>
      <span class="d-none d-sm-inline" style="color:rgba(255,255,255,0.3)">|</span>
      <span>🚚 Free Delivery on orders over Rs.&nbsp;8,000</span>
    </div>`;
}

// ─── NAVBAR ──────────────────────────────────────────────────
function renderNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;
  const pg = document.body.dataset.page;
  const links = [
    { href:'index.html',       label:'Home',       page:'home'        },
    { href:'shop.html',        label:'All Rings',   page:'shop'        },
    { href:'collections.html', label:'Collections', page:'collections' },
    { href:'about.html',       label:'Our Story',   page:'about'       },
    { href:'contact.html',     label:'Contact',     page:'contact'     },
  ];
  container.innerHTML = `
    <nav class="navbar navbar-expand-lg sterlyn-nav">
      <div class="container">
        <a class="navbar-brand" href="index.html">
          <img src="images/logo.png" alt="${CONFIG.brand} Silver Rings"
               onerror="this.outerHTML='<span style=\\'font-family:Cormorant Garamond,serif;font-size:1.55rem;font-weight:700;letter-spacing:0.08em;\\'>${CONFIG.brand}</span>'">
        </a>
        <button class="navbar-toggler border-0 shadow-none" type="button"
                data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav mx-auto">
            ${links.map(l => `<li class="nav-item">
              <a class="nav-link${l.page===pg?' active':''}" href="${l.href}">${l.label}</a>
            </li>`).join('')}
          </ul>
          <div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <div class="nav-search-wrap d-none d-lg-block">
              <input type="search" id="navSearch" placeholder="Search rings\u2026" autocomplete="off">
              <i class="fas fa-search search-icon"></i>
            </div>
            <button class="currency-toggle" id="currencyToggle">
              ${state.currency === 'LKR' ? 'LKR \u21c4 USD' : 'USD \u21c4 LKR'}
            </button>
            <a href="shop.html?wishlist=1" class="wishlist-badge" title="Wishlist">
              <i class="far fa-heart"></i>
              <span class="badge-count" style="display:none">0</span>
            </a>
          </div>
        </div>
      </div>
    </nav>`;

  document.getElementById('currencyToggle').addEventListener('click', () => {
    state.currency = state.currency === 'LKR' ? 'USD' : 'LKR';
    localStorage.setItem('sterlyn_currency', state.currency);
    document.getElementById('currencyToggle').textContent =
      state.currency === 'LKR' ? 'LKR \u21c4 USD' : 'USD \u21c4 LKR';
    updateAllPrices();
    renderSilverWidget();
    updateFooterSilver();
  });

  const searchInput = document.getElementById('navSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const grid = document.getElementById('products-grid') || document.getElementById('featured-grid');
      if (!grid) return;
      if (!q) { refreshProductGrid(); return; }
      const hits = state.rings.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
      renderGrid(hits, grid, '6 col-md-4 col-lg-3');
    });
  }
  updateWishlistBadge();
}

// ─── FOOTER ──────────────────────────────────────────────────
function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;
  container.innerHTML = `
    <footer class="sterlyn-footer">
      <div class="container">
        <div class="row g-5">
          <div class="col-lg-4">
            <div class="footer-logo mb-3">
              <img src="images/logo.png" alt="${CONFIG.brand}"
                   onerror="this.outerHTML='<span style=\\'font-family:Cormorant Garamond,serif;font-size:1.4rem;font-weight:700;color:#fff;\\'>${CONFIG.brand}</span>'">
            </div>
            <p class="fst-italic" style="font-size:0.84rem;color:rgba(255,255,255,0.5);line-height:1.8">
              "${CONFIG.tagline}"
            </p>
            <p style="font-size:0.74rem;color:rgba(255,255,255,0.35)">
              Pure 925 Sterling Silver &middot; Handcrafted in Sri Lanka &#127474;&#127472;
            </p>
            <div class="mt-3">
              <a class="footer-social-link" href="https://instagram.com/${CONFIG.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>
              <a class="footer-social-link" href="https://facebook.com/sterlyn" target="_blank"><i class="fab fa-facebook-f"></i></a>
              <a class="footer-social-link" href="https://tiktok.com/@sterlyn" target="_blank"><i class="fab fa-tiktok"></i></a>
              <a class="footer-social-link" href="${buildWA('Hello STERLYN! I came from your website.')}" target="_blank"><i class="fab fa-whatsapp"></i></a>
            </div>
            <div class="footer-silver-mini mt-3">
              <p style="font-size:0.68rem;color:rgba(255,255,255,0.4)">&#129350; Today\u2019s Silver Rate</p>
              <p id="footer-silver" style="font-size:0.92rem;font-weight:600;color:#C0C0C0;font-family:Cormorant Garamond,serif">Loading&hellip;</p>
            </div>
          </div>
          <div class="col-lg-2 col-6">
            <h6>Navigate</h6>
            <a href="index.html">Home</a>
            <a href="shop.html">All Rings</a>
            <a href="collections.html">Collections</a>
            <a href="about.html">Our Story</a>
            <a href="contact.html">Contact</a>
          </div>
          <div class="col-lg-2 col-6">
            <h6>Collections</h6>
            <a href="collections.html?category=minimalist">Minimalist</a>
            <a href="collections.html?category=statement">Statement</a>
            <a href="collections.html?category=stackable">Stackable</a>
            <a href="collections.html?category=gemstone">Gemstone</a>
          </div>
          <div class="col-lg-4">
            <h6>Get In Touch</h6>
            <div class="footer-contact-item">
              <i class="fas fa-phone"></i>
              <a href="tel:${CONFIG.phone}">${CONFIG.phoneDisplay}</a>
            </div>
            <div class="footer-contact-item">
              <i class="fab fa-whatsapp"></i>
              <a href="${buildWA('Hello STERLYN! I have an enquiry.')}" target="_blank">Chat on WhatsApp</a>
            </div>
            <div class="footer-contact-item">
              <i class="fas fa-envelope"></i>
              <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>
            </div>
            <div class="footer-contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Sri Lanka &#127474;&#127472;</span>
            </div>
          </div>
        </div>
        <div class="footer-divider">
          <p class="footer-copy">
            &copy; ${new Date().getFullYear()} ${CONFIG.brand} Silver Rings. All rights reserved. 
            Handcrafted with &#10084;&#65039; in Sri Lanka.
          </p>
        </div>
      </div>
    </footer>`;
  updateFooterSilver();
}

function updateFooterSilver() {
  const el = document.getElementById('footer-silver');
  if (!el) return;
  const perGram = state.silverUSD;
  el.textContent = state.currency === 'LKR'
    ? 'Rs.\u00a0' + (perGram * state.usdToLkr).toFixed(2) + ' / gram'
    : '$' + perGram.toFixed(4) + ' / gram';
}

function renderFloatingWA() {
  const a = document.createElement('a');
  a.href    = buildWA('Hello STERLYN! I\u2019d like to enquire about your silver rings.');
  a.className = 'floating-wa';
  a.target  = '_blank';
  a.rel     = 'noopener noreferrer';
  a.title   = 'Chat on WhatsApp';
  a.innerHTML = '<i class="fab fa-whatsapp"></i>';
  document.body.appendChild(a);
}

// ─── SILVER PRICE WIDGET ─────────────────────────────────────
function renderSilverWidget() {
  const w = document.getElementById('silver-price-widget');
  if (!w) return;
  const perGram   = state.silverUSD;
  const perGramLK = perGram * state.usdToLkr;
  const perOz     = perGram * 31.1035;
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const dateStr   = now.toLocaleDateString('en-LK', { day:'numeric', month:'long', year:'numeric' });

  w.innerHTML = `
    <div class="row g-3 align-items-start">
      <div class="col-12 mb-1">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span class="silver-live-dot"></span>
          <span class="silver-label">Today\u2019s Silver Price &mdash; ${dateStr}</span>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="price-box">
          <div class="silver-label">Per Gram (LKR)</div>
          <div class="silver-price-value">Rs.${perGramLK.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="price-box">
          <div class="silver-label">Per Gram (USD)</div>
          <div class="silver-price-value">$${perGram.toFixed(4)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="price-box">
          <div class="silver-label">Per Troy Oz (USD)</div>
          <div class="silver-price-value">$${perOz.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="price-box">
          <div class="silver-label">USD &rarr; LKR Rate</div>
          <div class="silver-price-value">${state.usdToLkr.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-12">
        <div class="silver-updated">
          <i class="far fa-clock me-1"></i>
          Last updated: ${timeStr} &nbsp;&middot;&nbsp; Source: Metals Market &nbsp;&middot;&nbsp;
          Live spot rates &nbsp;&middot;&nbsp;
          <a href="shop.html" style="color:var(--accent)">Shop our rings &rarr;</a>
        </div>
      </div>
    </div>`;
}

// ─── PRODUCT CARD ─────────────────────────────────────────────
function cardHTML(ring) {
  const inWL   = state.wishlist.includes(ring.id);
  const badge  = ring.badge
    ? `<span class="product-badge badge-${ring.badge.toLowerCase()}">${ring.badge}</span>` : '';
  const stock  = ring.stock <= 3
    ? `<span class="stock-label">Only ${ring.stock} left!</span>` : '';
  const waMsg  = `Hello STERLYN! \ud83e\udd0d\n\nI\u2019m interested in the *${ring.name}*.\nPrice: ${formatPrice(ring.price)}\n\nCan you share availability and delivery details?`;

  return `<div class="product-card reveal h-100" data-category="${ring.category}">
    <div class="product-card-img" onclick="location='product.html?id=${ring.id}'">
      ${badge}${stock}
      <button class="wishlist-btn${inWL?' active':''}" data-id="${ring.id}"
              onclick="event.stopPropagation();toggleWishlist('${ring.id}')">
        <i class="${inWL?'fas':'far'} fa-heart"></i>
      </button>
      <img src="${ring.images[0]}" alt="${ring.name}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/400x400/efefef/8A9BAE?text=${encodeURIComponent(ring.name)}'">
    </div>
    <div class="product-card-body">
      <div class="product-card-category">${ring.category}</div>
      <div class="product-card-name" onclick="location='product.html?id=${ring.id}'">${ring.name}</div>
      <div class="product-card-price" data-usd="${ring.price}">${formatPrice(ring.price)}</div>
      <div class="d-flex gap-2">
        <a href="tel:${CONFIG.phone}" class="btn-call">
          <i class="fas fa-phone me-1"></i>Call
        </a>
        <a href="${buildWA(waMsg)}" target="_blank" rel="noopener" class="btn-wa">
          <i class="fab fa-whatsapp me-1"></i>WhatsApp
        </a>
      </div>
    </div>
  </div>`;
}

function skeletonHTML() {
  return `<div class="skeleton-card">
    <div class="skeleton" style="aspect-ratio:1"></div>
    <div style="padding:1rem">
      <div class="skeleton mb-2" style="height:11px;width:38%"></div>
      <div class="skeleton mb-2" style="height:18px;width:80%"></div>
      <div class="skeleton mb-3" style="height:22px;width:50%"></div>
      <div class="d-flex gap-2">
        <div class="skeleton" style="height:32px;flex:1"></div>
        <div class="skeleton" style="height:32px;flex:1"></div>
      </div>
    </div>
  </div>`;
}

function showSkeletons(container, count) {
  if (!container) return;
  container.innerHTML = Array(count).fill('')
    .map(() => '<div class="col-6 col-md-4 col-lg-3">' + skeletonHTML() + '</div>').join('');
}

function renderGrid(rings, container, colCls) {
  if (!container) return;
  if (rings.length === 0) {
    container.innerHTML = `<div class="col-12 no-results">
      <i class="far fa-gem"></i>
      <p>No rings found. <a href="shop.html">Browse all rings &rarr;</a></p>
    </div>`;
    return;
  }
  const cls = colCls || '6 col-md-4 col-lg-3';
  container.innerHTML = rings.map(r =>
    `<div class="col-${cls}">${cardHTML(r)}</div>`).join('');
  initReveal();
}

// ─── HOME PAGE ────────────────────────────────────────────────
function initHome() {
  renderSilverWidget();
  const grid = document.getElementById('featured-grid');
  if (grid) {
    showSkeletons(grid, 4);
    setTimeout(() => {
      const featured = state.rings.filter(r => r.isFeatured);
      renderGrid(featured, grid, '6 col-md-6 col-lg-3');
    }, 400);
  }
}

// ─── SHOP PAGE ────────────────────────────────────────────────
function initShop() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  showSkeletons(grid, 6);

  const params = new URLSearchParams(window.location.search);
  const catP   = params.get('category');
  const wlP    = params.get('wishlist');

  if (wlP) {
    state.activeFilter = 'wishlist';
    const title = document.getElementById('shop-page-title');
    if (title) title.textContent = 'Your Wishlist';
  }
  if (catP) {
    state.activeFilter = catP;
    document.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === catP));
  }

  setTimeout(refreshProductGrid, 400);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      refreshProductGrid();
    });
  });

  document.getElementById('sortSelect')?.addEventListener('change', e => {
    state.activeSort = e.target.value;
    refreshProductGrid();
  });
}

function refreshProductGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  let rings = [...state.rings];

  if (state.activeFilter === 'wishlist') rings = rings.filter(r => state.wishlist.includes(r.id));
  else if (state.activeFilter !== 'all')  rings = rings.filter(r => r.category === state.activeFilter);

  if (state.activeSort === 'price-asc')  rings.sort((a,b) => a.price - b.price);
  else if (state.activeSort === 'price-desc') rings.sort((a,b) => b.price - a.price);
  else if (state.activeSort === 'name')  rings.sort((a,b) => a.name.localeCompare(b.name));

  const countEl = document.getElementById('ring-count');
  if (countEl) countEl.textContent = rings.length + ' ring' + (rings.length !== 1 ? 's' : '');
  renderGrid(rings, grid, '6 col-md-4 col-lg-4');
}

// ─── PRODUCT DETAIL PAGE ──────────────────────────────────────
function initProduct() {
  const id   = new URLSearchParams(window.location.search).get('id');
  const ring = id ? state.rings.find(r => r.id === id) : null;
  if (!ring) {
    const wrap = document.getElementById('pdp-content');
    if (wrap) wrap.innerHTML = `
      <div class="text-center py-5 my-5">
        <i class="far fa-gem fa-3x text-muted mb-3"></i>
        <h3 style="font-family:Cormorant Garamond,serif">Ring not found</h3>
        <a href="shop.html" class="btn-call d-inline-block mt-3 px-5 py-2">Browse All Rings</a>
      </div>`;
    return;
  }
  document.title = ring.name + ' \u2014 ' + CONFIG.brand;
  renderPDP(ring);
  renderRelated(ring);
  document.body.classList.add('pdp-page');
}

function buildWAOrderMsg(ring) {
  const sz = state.selectedSize   ? 'US ' + state.selectedSize : 'Please confirm size';
  const fn = state.selectedFinish || (ring.finishes[0]);
  return `Hello STERLYN! \ud83e\udd0d\n\nI\u2019d like to order:\n*Ring:* ${ring.name}\n*Price:* ${formatPrice(ring.price)}\n*Size:* ${sz}\n*Finish:* ${fn}\n\nPlease confirm availability and delivery. Thank you!`;
}

function renderPDP(ring) {
  const wrap = document.getElementById('pdp-content');
  if (!wrap) return;

  const thumbs = ring.images.map((img, i) => `
    <div class="product-gallery-thumb${i===0?' active':''}"
         onclick="switchGallery(${i},'${img}',this)">
      <img src="${img}" alt="${ring.name} view ${i+1}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/100/efefef/8A9BAE?text=Ring'">
    </div>`).join('');

  const sizesBtns = ring.sizes.map(s => `
    <button class="size-btn" data-size="${s}"
            onclick="selectSize(this,${s})">${s}</button>`).join('');

  const finishOpts = ring.finishes.map(f =>
    `<option value="${f}">${f}</option>`).join('');

  state.selectedFinish = ring.finishes[0];

  wrap.innerHTML = `
    <div class="row g-5">
      <!-- Gallery -->
      <div class="col-lg-6">
        <div class="product-gallery-main">
          <img id="gallery-main" src="${ring.images[0]}" alt="${ring.name}"
               onerror="this.src='https://via.placeholder.com/800/efefef/8A9BAE?text=${encodeURIComponent(ring.name)}'">
        </div>
        <div class="thumb-wrap">${thumbs}</div>
      </div>

      <!-- Info -->
      <div class="col-lg-6">
        <nav class="sterlyn-breadcrumb mb-3" aria-label="Breadcrumb">
          <a href="index.html">Home</a> <span class="mx-1">/</span>
          <a href="shop.html">Rings</a> <span class="mx-1">/</span>
          <span>${ring.name}</span>
        </nav>

        ${ring.badge ? `<span class="product-badge badge-${ring.badge.toLowerCase()} mb-2 d-inline-block">${ring.badge}</span>` : ''}
        ${ring.stock<=3 ? `<p class="mb-1" style="font-size:0.78rem;color:var(--danger)"><i class="fas fa-exclamation-circle me-1"></i>Only ${ring.stock} left in stock!</p>` : ''}

        <h1 class="product-title">${ring.name}</h1>
        <div class="product-material mb-2">${ring.material}</div>
        <div class="product-price mb-1" id="pdp-price" data-usd="${ring.price}">${formatPrice(ring.price)}</div>

        <p style="font-size:0.88rem;color:var(--muted);line-height:1.85;margin:1.1rem 0 1.4rem">${ring.description}</p>
        <hr style="border-color:var(--border)">

        <!-- Size -->
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="size-label">Ring Size (US)</span>
            <button class="size-guide-link" data-bs-toggle="modal" data-bs-target="#sizeGuideModal">
              <i class="fas fa-ruler me-1"></i>Size Guide
            </button>
          </div>
          <div class="d-flex flex-wrap gap-2" id="size-buttons">${sizesBtns}</div>
          <p style="font-size:0.72rem;color:var(--muted);margin-top:6px">
            Select your size then WhatsApp us to confirm availability.
          </p>
        </div>

        <!-- Finish -->
        <div class="mb-4">
          <div class="size-label mb-2">Finish</div>
          <select class="finish-select" id="finish-select"
                  onchange="state.selectedFinish=this.value;updateOrderLinks()">
            ${finishOpts}
          </select>
        </div>

        <!-- CTAs -->
        <a href="tel:${CONFIG.phone}" class="btn-order-call">
          <i class="fas fa-phone me-2"></i>Order via Call
        </a>
        <a href="${buildWA(buildWAOrderMsg(ring))}" target="_blank" rel="noopener"
           id="wa-order-btn" class="btn-order-wa">
          <i class="fab fa-whatsapp me-2"></i>Order via WhatsApp
        </a>

        <!-- Concierge -->
        <div class="concierge-box mt-4">
          <h5><i class="fas fa-headset me-2"></i>Personalised Help</h5>
          <p class="mb-3">Not sure about your size or finish? Our artisan team is here to guide you.</p>
          <div class="d-flex gap-2 flex-wrap">
            <a href="tel:${CONFIG.phone}" class="btn-call-outline">
              <i class="fas fa-phone me-1"></i>${CONFIG.phoneDisplay}
            </a>
            <a href="${buildWA('Hello STERLYN! I need help choosing the right size for the ' + ring.name + '.')}"
               target="_blank" rel="noopener" class="btn-wa-outline">
              <i class="fab fa-whatsapp me-1"></i>Chat Now
            </a>
          </div>
        </div>
      </div>
    </div>`;

  // Mobile CTA bar
  let bar = document.getElementById('mobile-cta-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'mobile-cta-bar';
    bar.className = 'mobile-cta-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <a href="tel:${CONFIG.phone}" class="btn-call flex-fill text-center py-2">
      <i class="fas fa-phone me-1"></i>Call to Order
    </a>
    <a id="mobile-wa-btn" href="${buildWA(buildWAOrderMsg(ring))}"
       target="_blank" rel="noopener" class="btn-wa flex-fill text-center py-2">
      <i class="fab fa-whatsapp me-1"></i>WhatsApp Order
    </a>`;

  // Store ring id for link updates
  wrap.dataset.ringId = ring.id;
}

function switchGallery(i, src, thumbEl) {
  const main = document.getElementById('gallery-main');
  if (main) main.src = src;
  document.querySelectorAll('.product-gallery-thumb').forEach((t, idx) =>
    t.classList.toggle('active', idx === i));
}

function selectSize(btn, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedSize = size;
  updateOrderLinks();
}

function updateOrderLinks() {
  const wrap = document.getElementById('pdp-content');
  if (!wrap || !wrap.dataset.ringId) return;
  const ring = state.rings.find(r => r.id === wrap.dataset.ringId);
  if (!ring) return;
  const msg = buildWAOrderMsg(ring);
  const waBtn = document.getElementById('wa-order-btn');
  if (waBtn) waBtn.href = buildWA(msg);
  const mobileWA = document.getElementById('mobile-wa-btn');
  if (mobileWA) mobileWA.href = buildWA(msg);
}

function renderRelated(ring) {
  const sec  = document.getElementById('related-section');
  const grid = document.getElementById('related-grid');
  if (!sec || !grid) return;
  const related = state.rings.filter(r => r.category === ring.category && r.id !== ring.id).slice(0, 4);
  if (related.length === 0) { sec.style.display = 'none'; return; }
  renderGrid(related, grid, '6 col-md-3');
}

// ─── COLLECTIONS PAGE ─────────────────────────────────────────
function initCollections() {
  document.querySelectorAll('[data-collection]').forEach(grid => {
    const cat   = grid.dataset.collection;
    const rings = state.rings.filter(r => r.category === cat);
    if (rings.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-4" style="font-size:0.85rem">Coming soon&hellip;</div>';
    } else {
      renderGrid(rings, grid, '6 col-md-4');
    }
  });
  const cat = new URLSearchParams(window.location.search).get('category');
  if (cat) {
    setTimeout(() => {
      const el = document.getElementById('col-' + cat);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 600);
  }
}

// ─── SCROLL REVEAL ────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

// ─── MAIN ─────────────────────────────────────────────────────
async function init() {
  renderAnnouncement();
  renderNavbar();
  renderFloatingWA();

  await Promise.all([fetchExchangeRate(), fetchSilverPrice()]);
  await fetchRings();

  renderFooter();

  const page = document.body.dataset.page;
  if (page === 'home')        initHome();
  else if (page === 'shop')   initShop();
  else if (page === 'product') initProduct();
  else if (page === 'collections') initCollections();

  initReveal();
}

document.addEventListener('DOMContentLoaded', init);
