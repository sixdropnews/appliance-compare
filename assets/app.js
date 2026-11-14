{
const GC = ['#00a651', '#8cc63f', '#ffd400', '#f7941d', '#e5322d'];
const BLURB = {
  'Cooling': 'Fridges, freezers, minibars and water dispensers.',
  'Laundry': 'Washers, washer-dryers, dryers and wash towers.',
  'Kitchen': 'Ovens, hobs, hoods, cookers, dishwashers, microwaves.',
  'TV & climate': 'TVs, air conditioners, water heaters and fans.',
  'Small appliances': 'Vacuums, coffee machines, kettles and more.'
};
const $ = id => document.getElementById(id);
const app = $('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-US');
const fmtK = n => n >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const disc = p => p.o && p.p && p.o > p.p ? Math.round((p.o - p.p) / p.o * 100) : 0;
const plural = t => /s$|&|care$|Other$/.test(t) ? t : t + 's';
const unit = k => { const m = k.match(/\(([^)]+)\)/); return m ? m[1] : k; };
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

let P = [], byId = {}, byType = {}, GROUPS = {}, KEY = {}, TSLUG = {}, GSLUG = {}, BRANDS = [];
let CMP = store.get('ac-cmp', []);
const groupOf = t => Object.keys(GROUPS).find(g => GROUPS[g].includes(t));
const gIndex = g => Object.keys(GROUPS).indexOf(g);
const img = p => `img/${p.id}.webp`;

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- shared pieces ---------- */
function specChips(p, n = 4) {
  return Object.entries(p.f).filter(([k, v]) => k !== 'Colour' && v !== 'No').slice(0, n)
    .map(([k, v]) => `<span>${esc(v === 'Yes' ? k.replace(/ \(.*\)/, '') : (typeof v === 'number' ? v + ' ' + unit(k) : v))}</span>`).join('');
}
function card(p) {
  const on = CMP.includes(p.id), d = disc(p);
  return `<article class="card${on ? ' sel' : ''}">
   <a class="pic" href="#/p/${p.id}" aria-label="${esc(p.n)}"><img src="${img(p)}" alt="" loading="lazy" width="160" height="160">${d >= 1 ? `<span class="off">−${d}%</span>` : ''}${p.fd ? '<span class="fdl">Free delivery</span>' : ''}</a>
   <div class="cb"><div class="brand">${esc(p.b)}</div><a class="nm" href="#/p/${p.id}">${esc(p.n)}</a>
   <div class="price"><strong>${p.p ? fmt(p.p) + '<small>EGP</small>' : 'Price on request'}</strong>${p.o && p.o > p.p ? `<s>${fmt(p.o)}</s>` : ''}</div>
   <div class="specs">${specChips(p)}</div>
   <div class="ca"><a href="${esc(p.u)}" target="_blank" rel="noopener">Buy on azmyco.com</a><button class="cmpb${on ? ' on' : ''}" data-cmp="${p.id}">${on ? '✓ Added' : '+ Compare'}</button></div></div></article>`;
}
function pageHead({ crumbs = [], title, sub = '', sibs = '' }) {
  return `<section class="night ph1"><div class="wrap"><div class="crumbs"><a href="#/">Home</a>${crumbs.map(([h, l]) => `<span>›</span>${h ? `<a href="${h}">${esc(l)}</a>` : `<span>${esc(l)}</span>`}`).join('')}</div>
   <h1 class="display">${title}</h1>${sub ? `<p>${sub}</p>` : ''}${sibs}</div></section>`;
}
function deptTiles() {
  return `<div class="depts">${Object.entries(GROUPS).map(([g, ts], i) => {
    const items = ts.flatMap(t => byType[t] || []);
    const pics = ['Refrigerator', 'Washing machine', 'Built-in oven', 'TV', 'Coffee machine'];
    const cand = items.filter(p => p.p).sort((a, b) => disc(b) - disc(a));
    const picks = [cand[2], cand[0], cand[5]].filter(Boolean);
    return `<article class="dept rv"><a class="dimg" href="#/d/${GSLUG[g]}" style="--c:${GC[i]}" aria-label="${esc(g)}">${picks.map(p => `<img src="${img(p)}" alt="" loading="lazy">`).join('')}</a>
     <div class="dbody"><h3><a href="#/d/${GSLUG[g]}">${esc(g)}</a><small>${items.length} products</small></h3><div class="tl">${ts.filter(t => byType[t]).map(t => `<a href="#/c/${TSLUG[t]}">${esc(t)}<small>${byType[t].length}</small></a>`).join('')}</div></div></article>`;
  }).join('')}</div>`;
}

/* ---------- compare tray ---------- */
function saveCmp() { store.set('ac-cmp', CMP); renderTray(); }
function toggleCmp(id) {
  const p = byId[id]; const i = CMP.indexOf(id);
  if (i >= 0) { CMP.splice(i, 1); saveCmp(); return; }
  if (CMP.length && byId[CMP[0]].t !== p.t) { CMP = []; toast(`Started a new ${p.t === 'TV' ? 'TV' : p.t.toLowerCase()} comparison (only the same type can be compared).`); }
  if (CMP.length >= 4) { toast('You can compare up to 4 products. Remove one first.'); return; }
  CMP.push(id); saveCmp();
}
function renderTray() {
  $('ccount').textContent = CMP.length;
  const onCompare = location.hash.startsWith('#/compare');
  $('tray').classList.toggle('show', CMP.length > 0 && !onCompare);
  $('tits').innerHTML = CMP.map(id => byId[id]).map(p => `<span class="ti"><img src="${img(p)}" alt="">${esc(p.b)} · ${p.p ? fmt(p.p) : '—'}<button data-rm="${p.id}" aria-label="Remove ${esc(p.b)}">×</button></span>`).join('') + (CMP.length < 4 ? `<span class="ti" style="opacity:.6">Add up to ${4 - CMP.length} more</span>` : '');
  $('tgo').style.opacity = CMP.length < 2 ? .5 : 1;
  document.querySelectorAll('[data-cmp]').forEach(b => { const on = CMP.includes(+b.dataset.cmp); b.classList.toggle('on', on); b.textContent = on ? '✓ Added' : (b.dataset.big ? 'Add to compare' : '+ Compare'); b.closest('.card')?.classList.toggle('sel', on); });
}

/* ---------- home ---------- */
function renderHome() {
  const gs = Object.entries(GROUPS);
  const priced = P.filter(p => p.p);
  const avgD = Math.round(priced.filter(p => disc(p)).reduce((a, p) => a + disc(p), 0) / priced.filter(p => disc(p)).length);
  const deals = priced.filter(p => disc(p) >= 20).sort((a, b) => disc(b) - disc(a) || a.p - b.p);
  const seen = new Set(), topDeals = deals.filter(p => { const k = p.t; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);
  const quick = ['Refrigerator', 'Washing machine', 'TV', 'Air conditioner', 'Dishwasher', 'Built-in oven'];
  app.innerHTML = `
  <section class="night hero"><div class="wrap hwrap">
   <div>
    <p class="eyebrow">The full Azmy Co catalogue, made comparable</p>
    <h1 class="display">Every appliance, <em>side by side.</em></h1>
    <p class="lead">${P.length} products across ${Object.keys(byType).length} appliance types and ${BRANDS.length} brands. Filter by the specs that matter, then compare up to four models line by line.</p>
    <form class="big" id="bsearch" role="search"><input name="q" type="search" placeholder="Try “side by side fridge”, “OLED 65”, “Bosch dishwasher”" aria-label="Search"><button>Search</button></form>
    <div class="quick">${quick.map(t => `<a href="#/c/${TSLUG[t]}">${esc(plural(t))}</a>`).join('')}</div>
   </div>
   <div class="label" aria-label="Departments">
    <span class="lstamp">Up to<br>${Math.max(...priced.map(disc))}%<br>off</span>
    <div class="lh"><b>What's in stock</b><span>${P.length} products</span></div>
    ${gs.map(([g, ts], i) => { const n = ts.reduce((a, t) => a + (byType[t] || []).length, 0); return `<a class="lb" href="#/d/${GSLUG[g]}"><span class="bar" data-w="${48 + i * 9}%" style="background:${GC[i]};${i == 2 ? 'color:#111' : ''}">${esc(g)}</span><span class="n">${n}</span></a>`; }).join('')}
    <div class="lf"><span>Choose a department to start</span><span>Prices as of 14 Nov 2026</span></div>
   </div>
  </div>
  <div class="wrap"><div class="figs"><div><strong>${P.length}</strong><span>products</span></div><div><strong>${BRANDS.length}</strong><span>brands, from Bosch to Miele</span></div><div><strong>${Object.keys(byType).length}</strong><span>appliance types</span></div><div><strong>${avgD}%</strong><span>average discount on sale items</span></div></div></div>
  </section>
  <section class="sec"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Shop by department</h2><p>Each type has its own filters: doors and layout for fridges, panel type for TVs, load and capacity for washers.</p></div><a class="more" href="#/departments">All departments →</a></div>
   ${deptTiles()}
  </div></section>
  <section class="sec" style="padding-top:0"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Biggest price drops</h2><p>The deepest discount in each appliance type right now.</p></div><a class="more" href="#/deals">See all ${deals.length} deals →</a></div>
   <div class="rail rv">${topDeals.map(card).join('')}</div>
  </div></section>
  <section class="sec night"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">How to find the right one</h2><p style="color:var(--nightmute)">Three steps, no spreadsheets.</p></div></div>
   <div class="steps">${[['Pick a type', 'Start from a department or search. Every type, from side-by-side fridges to wash towers, has its own page.'], ['Filter by real specs', 'Capacity, doors, panel, burners, inverter, smart features, brand and price. Counts update as you go.'], ['Compare and decide', 'Add up to four models. Differences are highlighted and the best price and capacity are marked.']].map(([h, t], i) => `<div class="step rv" style="--c:${GC[i * 2]};background:#171b20;border-color:#262b32;color:var(--nightink)"><i></i><h3>${h}</h3><p style="color:var(--nightmute)">${t}</p></div>`).join('')}</div>
  </div></section>
  <section class="sec"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Popular brands</h2><p>See every model a brand has in the catalogue, across all appliance types.</p></div><a class="more" href="#/brands">All ${BRANDS.length} brands →</a></div>
   <div class="brands">${BRANDS.slice(0, 12).map(brandCard).join('')}</div>
  </div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta night rv"><h2 class="display">Not sure where to start? Try the fridges.</h2><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/c/${TSLUG['Refrigerator']}">Compare fridges</a><a class="btn ghost" href="#/c/${TSLUG['TV']}">Compare TVs</a></div></div></div></section>`;
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.lb .bar').forEach(b => b.style.width = b.dataset.w), 60));
}
function brandCard([b, n]) {
  const from = Math.min(...P.filter(p => p.b === b && p.p).map(p => p.p));
  return `<a class="bcard rv" href="#/b/${slug(b)}"><b>${esc(b)}</b><span>${n} products${isFinite(from) ? ` · from ${fmt(from)} EGP` : ''}</span></a>`;
}

/* ---------- departments, group, brands, deals ---------- */
function renderDepartments() {
  app.innerHTML = pageHead({ crumbs: [[null, 'Departments']], title: 'All departments', sub: `${P.length} products in ${Object.keys(byType).length} appliance types.` }) + `<section class="sec" style="padding-top:36px"><div class="wrap">${deptTiles()}</div></section>`;
}
function renderGroup(g) {
  const i = gIndex(g), ts = GROUPS[g].filter(t => byType[t]);
  app.innerHTML = pageHead({ crumbs: [['#/departments', 'Departments'], [null, g]], title: esc(g), sub: BLURB[g] }) +
  `<section class="sec" style="padding-top:36px"><div class="wrap"><div class="depts">${ts.map(t => {
    const rows = byType[t], pr = rows.filter(p => p.p).map(p => p.p);
    const picks = rows.filter(p => p.p).sort((a, b) => disc(b) - disc(a)).slice(0, 3);
    return `<article class="dept rv" style="grid-column:span 2"><a class="dimg" href="#/c/${TSLUG[t]}" style="--c:${GC[i]}">${[picks[1], picks[0], picks[2]].filter(Boolean).map(p => `<img src="${img(p)}" alt="" loading="lazy">`).join('')}</a>
     <div class="dbody"><h3><a href="#/c/${TSLUG[t]}">${esc(plural(t))}</a><small>${rows.length}</small></h3><p style="margin:4px 0 0;color:var(--mute)">${pr.length ? `From ${fmt(Math.min(...pr))} to ${fmt(Math.max(...pr))} EGP` : ''} · ${new Set(rows.map(p => p.b)).size} brands</p></div></article>`;
  }).join('')}</div></div></section>`;
}
function renderBrands() {
  app.innerHTML = pageHead({ crumbs: [[null, 'Brands']], title: 'All brands', sub: `${BRANDS.length} brands in the catalogue, by number of products.` }) +
    `<section class="sec" style="padding-top:36px"><div class="wrap"><div class="brands">${BRANDS.map(brandCard).join('')}</div></div></section>`;
}
function renderBrand(b) {
  const rows = P.filter(p => p.b === b).sort((a, c) => a.t.localeCompare(c.t) || (a.p ?? 1e12) - (c.p ?? 1e12));
  const types = {}; rows.forEach(p => types[p.t] = (types[p.t] || 0) + 1);
  app.innerHTML = pageHead({ crumbs: [['#/brands', 'Brands'], [null, b]], title: esc(b), sub: `${rows.length} products across ${Object.keys(types).length} appliance types.`,
    sibs: `<div class="sibs">${Object.entries(types).sort((a, c) => c[1] - a[1]).map(([t, n]) => `<a class="sib" href="#/c/${TSLUG[t]}?b=${encodeURIComponent(b)}">${esc(plural(t))}<small>${n}</small></a>`).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap"><p class="note" style="margin:0 0 16px">Tap a type above to filter and compare ${esc(b)} models with the type's own specs.</p><div class="grid">${rows.map(card).join('')}</div></div></section>`;
}
function renderDeals(q) {
  const g = q.get('d');
  const all = P.filter(p => p.p && disc(p) >= 20);
  const rows = all.filter(p => !g || groupOf(p.t) === g).sort((a, b) => disc(b) - disc(a) || a.p - b.p);
  app.innerHTML = pageHead({ crumbs: [[null, 'Deals']], title: 'Best deals', sub: `Every product at least 20% below its listed old price: ${all.length} in total.`,
    sibs: `<div class="sibs"><a class="sib${!g ? ' on' : ''}" href="#/deals">All<small>${all.length}</small></a>${Object.keys(GROUPS).map(x => { const n = all.filter(p => groupOf(p.t) === x).length; return n ? `<a class="sib${g === x ? ' on' : ''}" href="#/deals?d=${encodeURIComponent(x)}">${esc(x)}<small>${n}</small></a>` : ''; }).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap"><div class="grid">${rows.map(card).join('')}</div></div></section>`;
}
function renderSearch(qs) {
  const q = (qs || '').trim();
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean).map(t => t.replace(/s$/, ''));
  const syn = { fridge: 'refrigerat', freezer: 'freezer', tv: 'tv', vacuum: 'vacuum', washer: 'wash', ac: 'air condition' };
  const rows = toks.length ? P.filter(p => { const h = (p.n + ' ' + p.b + ' ' + p.t + ' ' + Object.values(p.f).join(' ')).toLowerCase(); return toks.every(t => h.includes(syn[t] || t)); }) : [];
  const types = {}; rows.forEach(p => types[p.t] = (types[p.t] || 0) + 1);
  app.innerHTML = pageHead({ crumbs: [[null, 'Search']], title: rows.length ? `${rows.length} results for “${esc(q)}”` : `No results for “${esc(q)}”`, sub: rows.length ? 'Open a type to filter these with its own specs and compare.' : 'Try a brand, a type or a model number, such as “Bosch”, “dishwasher” or “KGN56”.',
    sibs: `<div class="sibs">${Object.entries(types).sort((a, c) => c[1] - a[1]).map(([t, n]) => `<a class="sib" href="#/c/${TSLUG[t]}?q=${encodeURIComponent(q)}">${esc(plural(t))}<small>${n}</small></a>`).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap">${rows.length ? `<div class="grid">${rows.slice(0, 120).map(card).join('')}</div>${rows.length > 120 ? '<p class="note">Showing the first 120. Pick a type above to see the rest.</p>' : ''}` : deptTiles()}</div></section>`;
}

/* ---------- catalogue ---------- */
const C = { type: null, brands: new Set(), f: {}, pmin: null, pmax: null, fd: false, q: '', sort: 'pa', meta: [] };
function buildMeta() {
  const rows = byType[C.type]; const keys = [];
  rows.forEach(p => Object.keys(p.f).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
  C.meta = keys.map(k => {
    const vals = rows.map(p => p.f[k]).filter(v => v != null); if (!vals.length) return null;
    const uniq = [...new Set(vals)];
    if (uniq.every(v => v === 'Yes' || v === 'No')) return uniq.length === 2 ? { k, kind: 'bool' } : null;
    if (uniq.every(v => typeof v === 'number')) { uniq.sort((a, b) => a - b); return uniq.length <= 9 ? { k, kind: 'cat', vals: uniq } : { k, kind: 'range', vals: uniq }; }
    if (uniq.length < 2) return null;
    return { k, kind: 'cat', vals: uniq.sort((a, b) => vals.filter(v => v === b).length - vals.filter(v => v === a).length) };
  }).filter(Boolean);
}
function match(p, skip) {
  if (skip !== 'brand' && C.brands.size && !C.brands.has(p.b)) return false;
  if (C.pmin != null && (p.p == null || p.p < C.pmin)) return false;
  if (C.pmax != null && (p.p == null || p.p > C.pmax)) return false;
  if (C.fd && !p.fd) return false;
  if (C.q) { const h = (p.n + ' ' + p.b).toLowerCase(); if (!C.q.toLowerCase().split(/\s+/).every(t => h.includes(t))) return false; }
  for (const m of C.meta) {
    if (m.k === skip) continue; const sel = C.f[m.k]; if (sel == null) continue; const v = p.f[m.k];
    if (m.kind === 'bool') { if (sel && v !== 'Yes') return false; }
    else if (m.kind === 'range') { if (sel.min != null && (v == null || v < sel.min)) return false; if (sel.max != null && (v == null || v > sel.max)) return false; }
    else if (sel.size && !sel.has(v)) return false;
  }
  return true;
}
function renderCatalog(t, q) {
  if (C.type !== t) { Object.assign(C, { type: t, brands: new Set(), f: {}, pmin: null, pmax: null, fd: false, q: '', sort: 'pa' }); buildMeta(); }
  if (q.get('b')) C.brands = new Set([q.get('b')]);
  if (q.get('q') != null) C.q = q.get('q');
  const g = groupOf(t), gi = gIndex(g), rows = byType[t];
  app.innerHTML = pageHead({ crumbs: [['#/departments', 'Departments'], ['#/d/' + GSLUG[g], g], [null, plural(t)]], title: esc(plural(t)), sub: `${rows.length} models from ${new Set(rows.map(p => p.b)).size} brands. Narrow them down, then add up to 4 to compare.`,
    sibs: `<div class="sibs">${GROUPS[g].filter(x => byType[x]).map(x => `<a class="sib${x === t ? ' on' : ''}" href="#/c/${TSLUG[x]}">${esc(x)}<small>${byType[x].length}</small></a>`).join('')}</div>` }) +
  `<div class="wrap"><div class="cat"><aside class="flt" id="filters" aria-label="Filters"></aside><section>
   <div class="stats" id="stats"></div><div class="strip" id="strip"></div>
   <div class="tools"><span class="cnt" id="cnt"></span><button class="fbtn" id="fbtn">Filters</button>
   <input class="sel" id="cq" type="search" placeholder="Search in ${esc(t==='TV'?'TVs':plural(t).toLowerCase())}" value="${esc(C.q)}" style="width:min(240px,100%)" aria-label="Search in this type">
   <select class="sel" id="sort" aria-label="Sort">${[['pa', 'Price: low to high'], ['pd', 'Price: high to low'], ['da', 'Biggest discount'], ['ka', KEY[t] ? 'Largest ' + KEY[t].replace(/ \(.*\)/, '').toLowerCase() : 'Key spec'], ['br', 'Brand A–Z']].map(([v, l]) => `<option value="${v}"${C.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
   <div class="grid" id="grid"></div></section></div></div>`;
  renderFilters(); renderResults();
}
function renderFilters() {
  const rows = byType[C.type];
  const bc = {}; rows.filter(p => match(p, 'brand')).forEach(p => bc[p.b] = (bc[p.b] || 0) + 1);
  const allB = [...new Set(rows.map(p => p.b))].sort((a, b) => (bc[b] || 0) - (bc[a] || 0) || a.localeCompare(b));
  const pr = rows.map(p => p.p).filter(v => v != null).sort((a, b) => a - b);
  const steps = [0, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 150000, 200000, 300000, 500000, 1000000].filter(v => v >= pr[0] * 0.6 && v <= pr[pr.length - 1] * 1.4);
  let h = `<div class="fh"><h2>Filters</h2><button class="link" id="reset">Reset all</button></div>
  <div class="fs"><h3>Brand</h3><div class="opts">${allB.map(b => `<button class="opt${C.brands.has(b) ? ' on' : ''}" data-brand="${esc(b)}" ${!bc[b] && !C.brands.has(b) ? 'disabled' : ''}>${esc(b)} <small>${bc[b] || 0}</small></button>`).join('')}</div></div>
  <div class="fs"><h3>Price (EGP)</h3><div class="rng"><select id="pmin" aria-label="Minimum price"><option value="">Any</option>${steps.map(v => `<option value="${v}" ${C.pmin === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select>–<select id="pmax" aria-label="Maximum price"><option value="">Any</option>${steps.map(v => `<option value="${v}" ${C.pmax === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select></div>
  <label class="tog"><input type="checkbox" id="fd" ${C.fd ? 'checked' : ''}> Free delivery only</label></div>`;
  for (const m of C.meta) {
    if (m.kind === 'bool') { const n = rows.filter(p => match(p, m.k) && p.f[m.k] === 'Yes').length; h += `<div class="fs"><label class="tog"><input type="checkbox" data-bool="${esc(m.k)}" ${C.f[m.k] ? 'checked' : ''} ${!n && !C.f[m.k] ? 'disabled' : ''}> ${esc(m.k)} <small>${n}</small></label></div>`; }
    else if (m.kind === 'range') { const s = C.f[m.k] || {}; h += `<div class="fs"><h3>${esc(m.k)}</h3><div class="rng"><select data-rmin="${esc(m.k)}" aria-label="${esc(m.k)} minimum"><option value="">Min</option>${m.vals.map(v => `<option value="${v}" ${s.min === v ? 'selected' : ''}>${v}</option>`).join('')}</select>–<select data-rmax="${esc(m.k)}" aria-label="${esc(m.k)} maximum"><option value="">Max</option>${m.vals.map(v => `<option value="${v}" ${s.max === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`; }
    else { const s = C.f[m.k] || new Set(), cnt = {}; rows.filter(p => match(p, m.k)).forEach(p => { const v = p.f[m.k]; if (v != null) cnt[v] = (cnt[v] || 0) + 1; });
      h += `<div class="fs"><h3>${esc(m.k)}</h3><div class="opts">${m.vals.map(v => `<button class="opt${s.has(v) ? ' on' : ''}" data-cat="${esc(m.k)}" data-v="${esc(v)}" data-num="${typeof v === 'number' ? 1 : 0}" ${!cnt[v] && !s.has(v) ? 'disabled' : ''}>${esc(v)} <small>${cnt[v] || 0}</small></button>`).join('')}</div></div>`; }
  }
  $('filters').innerHTML = h;
}
function renderResults() {
  const kv = p => KEY[C.type] ? p.f[KEY[C.type]] : null, s = C.sort;
  const rows = byType[C.type].filter(p => match(p)).sort((a, b) => s === 'pa' ? (a.p ?? 1e12) - (b.p ?? 1e12) : s === 'pd' ? (b.p ?? -1) - (a.p ?? -1) : s === 'da' ? disc(b) - disc(a) : s === 'ka' ? (kv(b) ?? -1) - (kv(a) ?? -1) : a.b.localeCompare(b.b));
  const pr = rows.map(p => p.p).filter(v => v != null).sort((a, b) => a - b), med = pr.length ? pr[Math.floor(pr.length / 2)] : null;
  $('stats').innerHTML = `<div style="--c:${GC[0]}"><span>Matching</span><strong>${rows.length}</strong></div><div style="--c:${GC[1]}"><span>Brands</span><strong>${new Set(rows.map(p => p.b)).size}</strong></div><div style="--c:${GC[2]}"><span>Price range (EGP)</span><strong>${pr.length ? fmtK(pr[0]) + '–' + fmtK(pr[pr.length - 1]) : '—'}</strong></div><div style="--c:${GC[3]}"><span>Median price (EGP)</span><strong>${med ? fmt(med) : '—'}</strong></div>`;
  renderStrip(rows);
  $('cnt').textContent = `${rows.length} of ${byType[C.type].length} shown`;
  $('grid').innerHTML = rows.length ? rows.map(card).join('') : `<div class="empty">Nothing matches these filters. <button class="link" id="reset2">Reset filters</button></div>`;
}
function renderStrip(rows) {
  const by = {}; rows.forEach(p => { if (p.p != null) (by[p.b] = by[p.b] || []).push(p.p); });
  const ent = Object.entries(by).map(([b, v]) => { v.sort((a, c) => a - c); return { b, min: v[0], max: v[v.length - 1], med: v[Math.floor(v.length / 2)], n: v.length }; }).sort((a, c) => a.med - c.med);
  if (!ent.length) { $('strip').innerHTML = '<h2>Price range by brand</h2><p>No priced products match.</p>'; return; }
  const lo = Math.min(...ent.map(e => e.min)), hi = Math.max(...ent.map(e => e.max)), L = Math.log, sp = L(hi) - L(lo) || 1, x = v => (L(v) - L(lo)) / sp * 100;
  $('strip').innerHTML = `<h2>Price range by brand</h2><p>Bar runs from each brand's cheapest to dearest matching model; the tick is the median. Click a brand to filter.</p>` +
    ent.map(e => `<button class="br${C.brands.has(e.b) ? ' on' : ''}" data-brand="${esc(e.b)}" title="${esc(e.b)}: ${fmt(e.min)}–${fmt(e.max)} EGP, median ${fmt(e.med)}"><span class="bn">${esc(e.b)}</span><span class="track"><i></i><em style="left:${x(e.min)}%;width:${Math.max(x(e.max) - x(e.min), 1.5)}%"></em><u style="left:calc(${x(e.med)}% - 1px)"></u></span><span class="bc">${e.n}</span></button>`).join('') +
    `<div class="axis"><span></span><div><span>${fmt(lo)}</span><span>${fmt(Math.round(Math.exp((L(lo) + L(hi)) / 2)))}</span><span>${fmt(hi)}</span></div><span style="text-align:right">count</span></div>`;
}

/* ---------- product ---------- */
function renderProduct(id) {
  const p = byId[id]; if (!p) return renderNotFound();
  const g = groupOf(p.t), d = disc(p), on = CMP.includes(p.id);
  const sim = byType[p.t].filter(x => x.id !== p.id && x.p).sort((a, b) => Math.abs(a.p - (p.p || 0)) - Math.abs(b.p - (p.p || 0))).slice(0, 8);
  app.innerHTML = `<div class="wrap"><div class="crumbs" style="color:var(--mute);padding-top:22px;margin:0"><a href="#/">Home</a> › <a href="#/d/${GSLUG[g]}">${esc(g)}</a> › <a href="#/c/${TSLUG[p.t]}">${esc(plural(p.t))}</a></div>
  <div class="pp"><div class="gal"><img id="gimg" src="${img(p)}" alt="${esc(p.n)}">${d ? `<span class="off" style="font-size:15px;top:16px;left:16px">−${d}%</span>` : ''}${p.fd ? '<span class="fdl" style="font-size:13px;top:16px;right:16px">Free delivery</span>' : ''}</div>
  <div><div class="brand" style="font-size:15px">${esc(p.b)} · ${esc(p.t)}</div><h1>${esc(p.n)}</h1>
   <div class="pbox"><div class="price"><strong>${p.p ? fmt(p.p) + '<small>EGP</small>' : 'Price on request'}</strong>${p.o && p.o > p.p ? `<s>${fmt(p.o)} EGP</s>` : ''}</div>${d ? `<span class="save">You save ${fmt(p.o - p.p)} EGP</span>` : ''}
    <div class="acts"><a class="btn green" href="${esc(p.u)}" target="_blank" rel="noopener">View &amp; buy on azmyco.com ↗</a><button class="btn ghost cmpb${on ? ' on' : ''}" data-cmp="${p.id}" data-big="1" style="border-radius:12px;min-height:48px;font-size:15px">${on ? '✓ Added' : 'Add to compare'}</button></div></div>
   <table class="spec"><tbody>${Object.entries(p.f).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}<tr><th>Free delivery</th><td>${p.fd ? 'Yes' : 'No'}</td></tr></tbody></table>
   <p class="note">Specs are read from the product's listed name; check the full details on azmyco.com.</p></div></div>
  <div class="sh"><div><h2 class="display" style="font-size:clamp(24px,2.6vw,32px)">Similar ${esc(p.t==='TV'?'TVs':plural(p.t).toLowerCase())} at a similar price</h2></div><a class="more" href="#/c/${TSLUG[p.t]}">See all ${byType[p.t].length} →</a></div>
  <div class="rail" style="margin-bottom:40px">${sim.map(card).join('')}</div></div>`;
  const hi = new Image(); hi.onload = () => { const g2 = $('gimg'); if (g2) g2.src = hi.src; }; hi.src = p.im;
}

/* ---------- compare ---------- */
function renderCompare(ids) {
  const fromUrl = ids && ids.length;
  const list = (fromUrl ? ids : CMP).map(Number).filter(i => byId[i]).slice(0, 4);
  if (fromUrl && list.length) { CMP = list.slice(); store.set('ac-cmp', CMP); }
  const its = list.map(i => byId[i]);
  if (its.length < 2) {
    app.innerHTML = pageHead({ crumbs: [[null, 'Compare']], title: 'Compare products', sub: its.length ? `You've added 1 ${esc(its[0].t.toLowerCase())}. Add at least one more of the same type.` : 'Add 2 to 4 products of the same type with the “+ Compare” button on any product.' }) +
      `<section class="sec" style="padding-top:36px"><div class="wrap">${its.length ? `<div class="grid" style="margin-bottom:28px">${its.map(card).join('')}</div><a class="btn green" href="#/c/${TSLUG[its[0].t]}">Choose more ${esc((its[0].t==='TV'?'TVs':plural(its[0].t).toLowerCase()))}</a>` : deptTiles()}</div></section>`;
    return;
  }
  const t = its[0].t;
  const keys = []; its.forEach(p => Object.keys(p.f).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
  const bi = (arr, dir) => { const ok = arr.map((v, i) => [v, i]).filter(([v]) => typeof v === 'number' && v); if (ok.length < 2) return -1; ok.sort((a, b) => dir * (a[0] - b[0])); return ok[0][0] === ok[1][0] ? -1 : ok[0][1]; };
  const row = (lab, vals, best, raw) => `<tr class="${new Set(raw.map(String)).size > 1 ? 'diff' : ''}"><th>${esc(lab)}</th>${vals.map((v, i) => `<td class="num${best === i ? ' best' : ''}">${v}</td>`).join('')}</tr>`;
  let h = `<table class="ct"><thead><tr><th class="chead" style="vertical-align:bottom">${its.length} ${esc(t==='TV'?'TVs':plural(t).toLowerCase())}</th>${its.map(p => `<td class="chead"><a href="#/p/${p.id}"><img src="${img(p)}" alt=""></a><div class="brand">${esc(p.b)}</div><a href="#/p/${p.id}" style="text-decoration:none">${esc(p.n)}</a><br><button class="rm" data-rm="${p.id}">Remove</button></td>`).join('')}</tr></thead><tbody>`;
  const pr = its.map(p => p.p); h += row('Price (EGP)', pr.map(v => v ? fmt(v) : '—'), bi(pr, 1), pr);
  const ol = its.map(p => p.o); h += row('Old price (EGP)', ol.map(v => v ? fmt(v) : '—'), -1, ol);
  const ds = its.map(disc); h += row('Discount', ds.map(v => v ? v + '%' : '—'), bi(ds, -1), ds);
  const fd = its.map(p => p.fd ? 'Yes' : 'No'); h += row('Free delivery', fd, -1, fd);
  keys.forEach(k => { const raw = its.map(p => p.f[k] ?? null); if (raw.every(v => v == null)) return; const better = /capacity|screen|place|burners|rpm|airflow|drawers|power|programs|hp|taps/i.test(k) ? bi(raw, -1) : -1; h += row(k, raw.map(v => v == null ? '—' : esc(v)), better, raw); });
  h += `<tr><th>Buy</th>${its.map(p => `<td><a class="btn green" style="min-height:40px;padding:8px 14px;font-size:14px" href="${esc(p.u)}" target="_blank" rel="noopener">azmyco.com ↗</a></td>`).join('')}</tr></tbody></table>`;
  const share = location.href.split('#')[0] + '#/compare/' + list.join(',');
  app.innerHTML = pageHead({ crumbs: [['#/c/' + TSLUG[t], plural(t)], [null, 'Compare']], title: `Comparing ${its.length} ${esc(t==='TV'?'TVs':plural(t).toLowerCase())}`, sub: 'Bold row labels mark the specs that differ. A green dot marks the best price, discount or capacity in a row.' }) +
    `<section class="sec" style="padding-top:28px"><div class="wrap"><div class="toolbar"><button class="btn" id="share" data-url="${esc(share)}">Copy link to this comparison</button><a class="btn ghost" href="#/c/${TSLUG[t]}">Add another</a><button class="link" id="cclear" style="margin-left:auto">Clear comparison</button></div><div class="scroll">${h}</div></div></section>`;
}

/* ---------- about, 404 ---------- */
function renderAbout() {
  app.innerHTML = pageHead({ crumbs: [[null, 'How it works']], title: 'How this site works', sub: 'What the numbers mean, where they come from, and what to double-check.' }) +
  `<section class="sec" style="padding-top:36px"><div class="wrap prose">
   <h2>Where the data comes from</h2><p>Every product, price, old price, photo and link was collected from the public catalogue on <a href="https://azmyco.com/" target="_blank" rel="noopener">azmyco.com</a> on <strong>14 November 2026</strong>: <strong>${P.length} products</strong> in all. Prices are in Egyptian pounds. To buy, follow the link on any product to its page on azmyco.com.</p>
   <h2>How specs are worked out</h2><p>Azmy Co lists specs in each product's name, such as “Bosch Refrigerator 522 Liter No Frost Stainless”. This site reads the capacity, doors, layout, panel type, burners and so on from those names. If a name doesn't mention something, that spec is left blank, or counted as “No” for yes/no filters. So a product may have a feature its name doesn't state.</p>
   <p>Some fridge names don't say their layout. For those, the layout comes from the maker's model series: for example Bosch <strong>KDN</strong> models are top-freezer, <strong>KGN</strong> models are bottom-freezer, and LG <strong>GC-B257</strong> models are side-by-side.</p>
   <h2>Discounts</h2><p>The discount is the gap between the current price and the old price shown on azmyco.com. Products with no old price show no discount.</p>
   <h2>Comparing</h2><ul><li>You can compare 2 to 4 products of the same type.</li><li>Rows where the products differ are in bold.</li><li>The green dot marks the lowest price, the biggest discount, and the largest capacity, screen or power in a row.</li><li>Use “Copy link to this comparison” to send it to someone.</li></ul>
   <h2>Before you buy</h2><p>Prices and stock change. Always confirm the price, specs and warranty on the product's page on azmyco.com.</p></div></section>`;
}
function renderNotFound() { app.innerHTML = pageHead({ title: 'Page not found', sub: 'That page doesn\'t exist. Pick a department instead.' }) + `<section class="sec"><div class="wrap">${deptTiles()}</div></section>`; }

/* ---------- router ---------- */
function route() {
  const h = location.hash;
  if (h && !h.startsWith('#/')) return;
  const [path, qs] = (h.slice(2) || '').split('?'); const seg = path.split('/').map(decodeURIComponent); const q = new URLSearchParams(qs || '');
  const typeBySlug = s => Object.keys(TSLUG).find(t => TSLUG[t] === s);
  const grpBySlug = s => Object.keys(GSLUG).find(g => GSLUG[g] === s);
  const brandBySlug = s => BRANDS.map(b => b[0]).find(b => slug(b) === s);
  const [a, b] = seg;
  if (!a) renderHome();
  else if (a === 'departments') renderDepartments();
  else if (a === 'd' && grpBySlug(b)) renderGroup(grpBySlug(b));
  else if (a === 'c' && typeBySlug(b)) renderCatalog(typeBySlug(b), q);
  else if (a === 'p') renderProduct(+b);
  else if (a === 'brands') renderBrands();
  else if (a === 'b' && brandBySlug(b)) renderBrand(brandBySlug(b));
  else if (a === 'deals') renderDeals(q);
  else if (a === 's') renderSearch(b);
  else if (a === 'compare') renderCompare(b ? b.split(',') : null);
  else if (a === 'about') renderAbout();
  else renderNotFound();
  document.querySelectorAll('[data-nav]').forEach(n => n.classList.toggle('on', n.dataset.nav === a || (a === 'd' || a === 'c') && n.dataset.nav === 'departments' || a === 'b' && n.dataset.nav === 'brands'));
  $('top').classList.remove('open');
  const keepScroll = a === 'c' && route._last === 'c:' + b;
  route._last = a + ':' + b;
  if (!keepScroll) window.scrollTo(0, 0);
  renderTray(); reveal();
  const titles = { '': 'Every appliance, side by side', departments: 'Departments', deals: 'Best deals', brands: 'Brands', about: 'How it works', compare: 'Compare' };
  document.title = (a === 'c' && typeBySlug(b) ? plural(typeBySlug(b)) : a === 'd' && grpBySlug(b) ? grpBySlug(b) : a === 's' ? 'Search: ' + (b || '') : a === 'p' && byId[+b] ? byId[+b].n : a === 'b' && brandBySlug(b) ? brandBySlug(b) : titles[a] || 'Appliance Compare') + ' · Appliance Compare';
}
let io;
function reveal() {
  const els = document.querySelectorAll('.rv:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px 0px' });
  els.forEach(e => io.observe(e));
  clearTimeout(reveal._t); reveal._t = setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach(e => e.classList.add('in')), 1800);
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.cmp) { toggleCmp(+t.dataset.cmp); return; }
  if (t.dataset.rm) { CMP = CMP.filter(x => x !== +t.dataset.rm); saveCmp(); if (location.hash.startsWith('#/compare')) { location.hash = '#/compare' + (CMP.length ? '/' + CMP.join(',') : ''); } return; }
  if (t.dataset.brand && $('filters')) { const b = t.dataset.brand; C.brands.has(b) ? C.brands.delete(b) : C.brands.add(b); renderFilters(); renderResults(); return; }
  if (t.dataset.cat) { const k = t.dataset.cat, v = t.dataset.num === '1' ? Number(t.dataset.v) : t.dataset.v; const s = C.f[k] || (C.f[k] = new Set()); s.has(v) ? s.delete(v) : s.add(v); renderFilters(); renderResults(); return; }
  if (t.id === 'reset' || t.id === 'reset2') { Object.assign(C, { brands: new Set(), f: {}, pmin: null, pmax: null, fd: false, q: '' }); const i = $('cq'); if (i) i.value = ''; renderFilters(); renderResults(); return; }
  if (t.id === 'fbtn') { $('filters').classList.toggle('open'); return; }
  if (t.id === 'tclr' || t.id === 'cclear') { CMP = []; saveCmp(); if (t.id === 'cclear') location.hash = '#/compare'; return; }
  if (t.id === 'burger') { const o = $('top').classList.toggle('open'); t.setAttribute('aria-expanded', o); return; }
  if (t.id === 'share') { const u = t.dataset.url; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Link copied. Anyone with it sees this comparison.'), () => toast('Copy this link: ' + u)); return; }
});
document.addEventListener('change', e => {
  const t = e.target; if (!$('filters') || !t.closest('.cat')) return;
  if (t.id === 'pmin') C.pmin = t.value ? +t.value : null;
  else if (t.id === 'pmax') C.pmax = t.value ? +t.value : null;
  else if (t.id === 'fd') C.fd = t.checked;
  else if (t.dataset.bool) C.f[t.dataset.bool] = t.checked || null;
  else if (t.dataset.rmin || t.dataset.rmax) { const k = t.dataset.rmin || t.dataset.rmax; const s = C.f[k] || (C.f[k] = {}); s[t.dataset.rmin ? 'min' : 'max'] = t.value ? +t.value : null; }
  else if (t.id === 'sort') { C.sort = t.value; renderResults(); return; }
  else return;
  renderFilters(); renderResults();
});
document.addEventListener('input', e => { if (e.target.id === 'cq') { C.q = e.target.value.trim(); renderFilters(); renderResults(); } });
document.addEventListener('submit', e => { const f = e.target; if (f.id === 'hsearch' || f.id === 'bsearch') { e.preventDefault(); const q = f.q.value.trim(); if (q) location.hash = '#/s/' + encodeURIComponent(q); f.q.blur(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('filters')?.classList.remove('open'); $('top').classList.remove('open'); } });
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
fetch('data/products.json').then(r => r.json()).then(D => {
  P = D.products; GROUPS = D.groups; KEY = D.key;
  P.forEach(p => { byId[p.id] = p; (byType[p.t] = byType[p.t] || []).push(p); });
  Object.keys(byType).forEach(t => TSLUG[t] = slug(t)); Object.keys(GROUPS).forEach(g => GSLUG[g] = slug(g));
  const bc = {}; P.forEach(p => bc[p.b] = (bc[p.b] || 0) + 1); BRANDS = Object.entries(bc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  CMP = CMP.filter(i => byId[i]);
  $('fdepts').innerHTML = Object.keys(GROUPS).map(g => `<a href="#/d/${GSLUG[g]}">${esc(g)}</a>`).join('');
  route();
}).catch(() => { app.innerHTML = '<div class="wrap" style="padding:80px 0">The catalogue could not load. Please refresh the page.</div>'; });
}
