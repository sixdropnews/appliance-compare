{
const GC = ['#00a651', '#8cc63f', '#ffd400', '#f7941d', '#e5322d'];
const BLURB = {
  'Cooling': 'Fridges, freezers, minibars and water dispensers.',
  'Laundry': 'Washers, washer-dryers, dryers and wash towers.',
  'Kitchen': 'Ovens, hobs, hoods, cookers, dishwashers, microwaves.',
  'TV & climate': 'TVs, air conditioners, water heaters, fans and heaters.',
  'Small appliances': 'Vacuums, coffee machines, air fryers, irons and kitchen helpers.'
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

let ST = {}, UPD = '';
let P = [], byId = {}, byType = {}, GROUPS = {}, KEY = {}, TSLUG = {}, GSLUG = {}, BRANDS = [];
let CMP = store.get('ac-cmp', []);
let PLAN = store.get('ac-plan', []);
const R_ = (a, b) => ({ r: [a, b] });
const PRESETS = {
  'Refrigerator': [['Top freezer', { Layout: ['Top freezer'] }], ['Bottom freezer', { Layout: ['Bottom freezer (combi)'] }], ['Side-by-side', { Layout: ['Side-by-side'] }], ['French door', { Layout: ['French door / multi-door'] }], ['Single door', { Layout: ['Single door'] }],
    ['Under 350 L', { 'Capacity (L)': R_(null, 349) }], ['350–450 L', { 'Capacity (L)': R_(350, 450) }], ['450–550 L', { 'Capacity (L)': R_(451, 550) }], ['550 L+', { 'Capacity (L)': R_(551, null) }], ['No frost + inverter', { 'No frost': true, Inverter: true }], ['Water dispenser', { 'Water dispenser': true }]],
  'Freezer': [['Upright (drawers)', { Type: ['Upright'] }], ['Chest', { Type: ['Chest'] }], ['No frost', { 'No frost': true }], ['Under 200 L', { 'Capacity (L)': R_(null, 199) }], ['200–300 L', { 'Capacity (L)': R_(200, 300) }], ['300 L+', { 'Capacity (L)': R_(301, null) }]],
  'Washing machine': [['Front load', { Loading: ['Front load'] }], ['Top load', { Loading: ['Top load'] }], ['Fully automatic', { Automation: ['Fully automatic'] }], ['Half automatic (twin tub)', { Automation: ['Half automatic (twin tub)'] }],
    ['Up to 7 kg', { 'Wash capacity (kg)': R_(null, 7.5) }], ['8 kg', { 'Wash capacity (kg)': R_(8, 8.5) }], ['9–10.5 kg', { 'Wash capacity (kg)': R_(9, 10.5) }], ['11 kg+', { 'Wash capacity (kg)': R_(11, null) }], ['Inverter / direct drive', { 'Direct drive / inverter': true }], ['Steam', { Steam: true }]],
  'Washer-dryer': [['Up to 8 kg wash', { 'Wash capacity (kg)': R_(null, 8.5) }], ['9–10.5 kg wash', { 'Wash capacity (kg)': R_(9, 10.5) }], ['11 kg+ wash', { 'Wash capacity (kg)': R_(11, null) }], ['Steam', { Steam: true }]],
  'Dryer': [['Heat pump', { 'Dryer type': ['Heat pump'] }], ['Condenser', { 'Dryer type': ['Condenser'] }], ['8–9 kg', { 'Dry capacity (kg)': R_(8, 9) }], ['10 kg+', { 'Dry capacity (kg)': R_(10, null) }]],
  'Dishwasher': [['Freestanding', { Installation: ['Freestanding'] }], ['Built-in', { Installation: ['Built-in', 'Semi-integrated'] }], ['Table-top', { Installation: ['Table-top'] }], ['Slim 45 cm', { 'Width (cm)': [45] }], ['12+ place settings', { 'Place settings': R_(12, null) }], ['Inverter', { Inverter: true }]],
  'TV': [['32"', { 'Screen (inch)': R_(32, 32) }], ['40–43"', { 'Screen (inch)': R_(40, 43) }], ['50"', { 'Screen (inch)': R_(48, 50) }], ['55"', { 'Screen (inch)': R_(55, 55) }], ['65"', { 'Screen (inch)': R_(65, 65) }], ['75–77"', { 'Screen (inch)': R_(75, 77) }], ['80–86"', { 'Screen (inch)': R_(80, 86) }], ['98"+', { 'Screen (inch)': R_(98, null) }],
    ['OLED', { Panel: ['OLED'] }], ['QLED / Mini LED', { Panel: ['QLED', 'Neo QLED', 'Mini LED', 'The Frame (QLED)', 'Micro RGB'] }], ['Built-in receiver', { 'Built-in receiver': true }]],
  'Air conditioner': [['1.5 HP', { 'Capacity (HP)': R_(1.25, 1.5) }], ['2.25 HP', { 'Capacity (HP)': R_(2, 2.25) }], ['3 HP', { 'Capacity (HP)': R_(2.75, 3) }], ['4 HP+', { 'Capacity (HP)': R_(4, null) }], ['Cooling & heating', { Mode: ['Cooling & heating'] }], ['Cooling only', { Mode: ['Cooling only'] }], ['Inverter', { Inverter: true }]],
  'Water heater': [['Electric tank', { Type: ['Electric tank'] }], ['Gas', { Type: ['Gas'] }], ['Instant electric', { Type: ['Instant electric'] }], ['Up to 30 L', { 'Tank / flow (L)': R_(null, 30) }], ['40–60 L', { 'Tank / flow (L)': R_(35, 60) }], ['80 L+', { 'Tank / flow (L)': R_(80, null) }], ['Digital display', { 'Digital display': true }]],
  'Cooker': [['90 cm', { 'Width (cm)': [90] }], ['60 cm', { 'Width (cm)': [60] }], ['5 burners', { Burners: [5] }], ['4 burners', { Burners: [4] }], ['Full safety', { 'Full safety': true }], ['With fan', { Fan: true }]],
  'Hob': [['Gas', { Type: ['Gas'] }], ['Electric / ceramic', { Type: ['Electric / ceramic'] }], ['Induction', { Type: ['Induction'] }], ['60 cm', { 'Width (cm)': [60] }], ['90 cm', { 'Width (cm)': [90] }], ['5 burners', { 'Burners / zones': [5] }]],
  'Hood': [['60 cm', { 'Width (cm)': [60] }], ['90 cm', { 'Width (cm)': [90] }], ['Chimney / wall', { Type: ['Chimney / wall'] }], ['T-shape', { Type: ['T-shape wall'] }], ['Island', { Type: ['Island'] }]],
  'Built-in oven': [['Gas', { Fuel: ['Gas'] }], ['Electric', { Fuel: ['Electric'] }], ['60 cm', { 'Width (cm)': [60] }], ['90 cm', { 'Width (cm)': [90] }], ['With fan', { Fan: true }], ['Digital display', { 'Digital display': true }]],
  'Microwave': [['Up to 25 L', { 'Capacity (L)': R_(null, 25) }], ['26–35 L', { 'Capacity (L)': R_(26, 35) }], ['36 L+', { 'Capacity (L)': R_(36, null) }], ['With grill', { Grill: true }], ['Built-in', { 'Built-in': true }]],
  'Vacuum & floor care': [['Canister', { Type: ['Canister', 'Wet & dry canister'] }], ['Cordless stick', { Type: ['Cordless stick'] }], ['Robot', { Type: ['Robot'] }], ['Steam / wet floor', { Type: ['Steam cleaner', 'Wet floor cleaner'] }], ['Carpet washer', { Type: ['Carpet / upholstery washer'] }]],
  'Fan': [['Stand', { Type: ['Stand'] }], ['Ceiling', { Type: ['Ceiling'] }], ['Wall', { Type: ['Wall'] }], ['Desk / box / tower', { Type: ['Desk / table', 'Box', 'Tower'] }], ['Exhaust', { Type: ['Exhaust / ventilation'] }], ['With remote', { Remote: true }]],
  'Air fryer': [['Up to 4 L', { 'Capacity (L)': R_(null, 4) }], ['4.5–6 L', { 'Capacity (L)': R_(4.1, 6.5) }], ['7 L+', { 'Capacity (L)': R_(6.6, null) }], ['Dual basket', { 'Dual basket': true }], ['Digital', { Digital: true }], ['Oven style', { 'Oven style': true }]],
  'Water dispenser': [['Bottom loading', { 'Bottom loading': true }], ['2 taps', { Taps: [2] }], ['3 taps', { Taps: [3] }], ['With fridge cabinet', { 'Fridge cabinet': true }]],
  'Coffee machine': [['Espresso', { Type: ['Espresso'] }], ['Capsule', { Type: ['Capsule'] }], ['Bean-to-cup', { Type: ['Bean-to-cup automatic'] }], ['Turkish', { Type: ['Turkish coffee'] }], ['Drip / American', { Type: ['Drip / American'] }], ['Grinder', { Type: ['Grinder'] }]],
  'Iron & steamer': [['Steam iron', { Type: ['Steam iron'] }], ['Steam station', { Type: ['Steam station'] }], ['Garment steamer', { Type: ['Garment steamer'] }]],
  'Heater': [['Oil radiator', { Type: ['Oil radiator'] }], ['Fan heater', { Type: ['Fan heater'] }], ['Halogen / quartz', { Type: ['Halogen / quartz'] }], ['Ceramic', { Type: ['Ceramic'] }]],
  'Air cooler & purifier': [['Air cooler', { Type: ['Air cooler'] }], ['Air purifier', { Type: ['Air purifier'] }], ['Humidifier', { Type: ['Humidifier', 'Dehumidifier'] }]],
  'Kettle': [['Glass', { Glass: true }], ['1.7 L+', { 'Capacity (L)': R_(1.7, null) }]],
  'Water filter': [['RO (reverse osmosis)', { 'RO (reverse osmosis)': true }], ['5+ stages', { Stages: R_(5, null) }]],
};
const groupOf = t => Object.keys(GROUPS).find(g => GROUPS[g].includes(t));
const gIndex = g => Object.keys(GROUPS).indexOf(g);
const img = p => p.th ? `img/${p.id}.webp` : thumb(p.im);
const thumb = u => !u ? 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' : /mafrservices/.test(u) ? u + '?im=Resize=400' : u;
const ourl = o => (/^https?:/.test(o.u) ? '' : ST[o.s].url) + o.u;
const sname = s => (ST[s] || {}).name || s;
const live = p => p.of.filter(o => o.in !== 0);
const inStock = p => p.of.some(o => o.in !== 0);
const gap = p => { const pr = live(p).map(o => o.p); return pr.length > 1 ? Math.max(...pr) - Math.min(...pr) : 0; };
const gapPct = p => { const pr = live(p).map(o => o.p); return pr.length > 1 ? Math.round((Math.max(...pr) - Math.min(...pr)) / Math.max(...pr) * 100) : 0; };
const STC = { azmy: '#0b6e4f', btech: '#e5322d', raya: '#1f5fbf', carrefour: '#0e4da4', '2b': '#f7941d', elaraby: '#7a3fb0' };
const sdot = s => `<i class="sd" style="background:${STC[s] || '#888'}"></i>`;
const dateTxt = () => new Date(UPD + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- shared pieces ---------- */
function specChips(p, n = 4) {
  return Object.entries(p.f).filter(([k, v]) => k !== 'Colour' && v !== 'No').slice(0, n)
    .map(([k, v]) => `<span>${esc(v === 'Yes' ? k.replace(/ \(.*\)/, '') : (typeof v === 'number' ? v + ' ' + unit(k) : v))}</span>`).join('');
}
function card(p) {
  const on = CMP.includes(p.id), d = disc(p), best = p.of[0], n = p.of.length, g = gap(p), oos = !inStock(p);
  return `<article class="card${on ? ' sel' : ''}">
   <button class="pbtn${PLAN.includes(p.id) ? ' on' : ''}" data-plan="${p.id}" title="${PLAN.includes(p.id) ? 'In your home plan' : 'Add to home plan'}" aria-label="Add to home plan"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M12 13v5M9.5 15.5h5"/></svg></button>
   <a class="pic" href="#/p/${p.id}" aria-label="${esc(p.n)}"><img src="${img(p)}" alt="" loading="lazy" width="160" height="160">${d >= 1 ? `<span class="off">−${d}%</span>` : ''}${n > 1 ? `<span class="fdl">${n} stores</span>` : ''}</a>
   <div class="cb"><div class="brand">${esc(p.b)}</div><a class="nm" href="#/p/${p.id}">${esc(p.n)}</a>
   <div class="price"><strong>${p.p ? fmt(p.p) + '<small>EGP</small>' : 'Price on request'}</strong>${p.o && p.o > p.p ? `<s>${fmt(p.o)}</s>` : ''}</div>
   <div class="at${oos ? ' oos' : ''}">${sdot(best.s)}${oos ? 'Out of stock · ' : n > 1 ? 'Cheapest at ' : 'At '}<b>${esc(sname(best.s))}</b>${g ? `<span class="sv">save ${fmt(g)}</span>` : ''}</div>
   <div class="specs">${specChips(p, 3)}</div>
   <div class="ca"><a href="${esc(ourl(best))}" target="_blank" rel="noopener">Buy at ${esc(sname(best.s))}</a><button class="cmpb${on ? ' on' : ''}" data-cmp="${p.id}">${on ? '✓ Added' : '+ Compare'}</button></div></div></article>`;
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
     <div class="dbody"><h3><a href="#/d/${GSLUG[g]}">${esc(g)}</a><small>${fmt(items.length)} products</small></h3><div class="tl">${ts.filter(t => byType[t]).map(t => `<a href="#/c/${TSLUG[t]}">${esc(t)}<small>${byType[t].length}</small></a>`).join('')}</div></div></article>`;
  }).join('')}</div>`;
}

/* ---------- compare tray ---------- */
function saveCmp() { store.set('ac-cmp', CMP); renderTray(); }
function savePlan() { store.set('ac-plan', PLAN); const c = $('pcount'); if (c) c.textContent = PLAN.length || ''; document.querySelectorAll('[data-plan]').forEach(b => { const on = PLAN.includes(b.dataset.plan); b.classList.toggle('on', on); if (b.dataset.big) b.textContent = on ? '✓ In your home plan' : 'Add to home plan'; else b.title = on ? 'In your home plan' : 'Add to home plan'; }); }
function togglePlan(id) {
  const i = PLAN.indexOf(id), p = byId[id];
  if (i >= 0) { PLAN.splice(i, 1); toast('Removed from your home plan.'); }
  else { const same = PLAN.find(x => byId[x] && byId[x].t === p.t); PLAN.push(id); toast(same ? `Added. Your plan now has ${PLAN.filter(x => byId[x].t === p.t).length} ${plural(p.t).toLowerCase()}.` : `Added to your home plan (${PLAN.length} item${PLAN.length > 1 ? 's' : ''}).`); }
  savePlan();
}
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
  document.querySelectorAll('[data-cmp]').forEach(b => { const on = CMP.includes(b.dataset.cmp); b.classList.toggle('on', on); b.textContent = on ? '✓ Added' : (b.dataset.big ? 'Add to compare' : '+ Compare'); b.closest('.card')?.classList.toggle('sel', on); });
}

/* ---------- home ---------- */
function renderHome() {
  const gs = Object.entries(GROUPS);
  const multi = P.filter(p => live(p).length > 1);
  const gaps = multi.filter(p => gapPct(p) >= 5).sort((a, b) => gapPct(b) - gapPct(a) || gap(b) - gap(a));
  const seen = new Set(), topGaps = gaps.filter(p => { if (seen.has(p.t)) return false; seen.add(p.t); return true; }).slice(0, 12);
  const avgGap = Math.round(multi.reduce((a, p) => a + gapPct(p), 0) / (multi.length || 1));
  const quick = ['Refrigerator', 'Washing machine', 'TV', 'Air conditioner', 'Air fryer', 'Dishwasher'];
  const nS = Object.keys(ST).length;
  app.innerHTML = `
  <section class="night hero"><div class="wrap hwrap">
   <div>
    <p class="eyebrow">${nS} Egyptian stores, one catalogue</p>
    <h1 class="display">Every appliance, <em>every price.</em></h1>
    <p class="lead">${fmt(P.length)} home appliances from ${Object.values(ST).map(x => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Matched model by model, so you can see which store sells it cheapest, then compare up to four models by their specs.</p>
    <form class="big" id="bsearch" role="search"><input name="q" type="search" placeholder="Try a model number, “side by side fridge” or “Tornado air fryer”" aria-label="Search"><button>Search</button></form>
    <div class="quick">${quick.filter(t => byType[t]).map(t => `<a href="#/c/${TSLUG[t]}">${esc(plural(t))}</a>`).join('')}</div>
   </div>
   <div class="label" aria-label="Departments">
    <span class="lstamp">Up to<br>${gaps.length ? gapPct(gaps[0]) : 0}%<br>cheaper</span>
    <div class="lh"><b>What's in stock</b><span>${fmt(P.length)} products</span></div>
    ${gs.map(([g, ts], i) => { const n = ts.reduce((a, t) => a + (byType[t] || []).length, 0); return `<a class="lb" href="#/d/${GSLUG[g]}"><span class="bar" data-w="${48 + i * 9}%" style="background:${GC[i]};${i == 2 ? 'color:#111' : ''}">${esc(g)}</span><span class="n">${fmt(n)}</span></a>`; }).join('')}
    <div class="lf"><span>Choose a department to start</span><span>Prices as of ${dateTxt()}</span></div>
   </div>
  </div>
  <div class="wrap"><div class="figs"><div><strong>${fmt(P.length)}</strong><span>home appliances</span></div><div><strong>${nS}</strong><span>stores checked</span></div><div><strong>${fmt(multi.length)}</strong><span>models sold by 2+ stores</span></div><div><strong>${avgGap}%</strong><span>average gap between the cheapest and dearest store</span></div></div></div>
  </section>
  <section class="sec"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Same model, different price</h2><p>The biggest gap between stores in each appliance type, counting in-stock offers only.</p></div><a class="more" href="#/deals">See all ${fmt(gaps.length)} →</a></div>
   <div class="rail rv">${topGaps.map(card).join('')}</div>
  </div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta night rv planc"><div><h2 class="display">Furnishing a new home?</h2><p>Start from a budget, mid-range or premium kit of the essentials, swap what you like, and see your total at the cheapest stores.</p></div><div class="kmini">${Object.keys(TIER).map(k => `<a href="#/plan" class="km"><span>${TIER[k][1]}</span><b>${fmtK(kitFor(k).reduce((a, p) => a + p.p, 0))}</b></a>`).join('')}</div><a class="btn" href="#/plan">Plan my home</a></div></div></section>
  <section class="sec" style="padding-top:0"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Shop by department</h2><p>Each type has its own filters: doors and layout for fridges, panel type for TVs, basket size for air fryers.</p></div><a class="more" href="#/departments">All departments →</a></div>
   ${deptTiles()}
  </div></section>
  <section class="sec night"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">The stores</h2><p style="color:var(--nightmute)">How many of the matched models each store sells at the lowest price.</p></div><a class="more" href="#/stores" style="color:var(--nightink)">All stores →</a></div>
   ${storeTiles(true)}
  </div></section>
  <section class="sec"><div class="wrap">
   <div class="sh rv"><div><h2 class="display">Popular brands</h2><p>See every model a brand has, across all stores and appliance types.</p></div><a class="more" href="#/brands">All ${BRANDS.length} brands →</a></div>
   <div class="brands">${BRANDS.slice(0, 12).map(brandCard).join('')}</div>
  </div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta night rv"><h2 class="display">Not sure where to start? Try the fridges.</h2><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/c/${TSLUG['Refrigerator']}">Compare fridges</a><a class="btn ghost" href="#/c/${TSLUG['TV']}">Compare TVs</a></div></div></div></section>`;
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.lb .bar').forEach(b => b.style.width = b.dataset.w), 60));
}
function storeStats(s) {
  const at = P.filter(p => p.of.some(o => o.s === s));
  const shared = at.filter(p => live(p).length > 1 && live(p).some(o => o.s === s));
  const cheapest = shared.filter(p => live(p)[0].s === s);
  return { n: at.length, instock: at.filter(p => p.of.some(o => o.s === s && o.in !== 0)).length, shared: shared.length, cheapest: cheapest.length };
}
function storeTiles(dark) {
  return `<div class="stores">${Object.keys(ST).map(s => { const x = storeStats(s), pct = x.shared ? Math.round(x.cheapest / x.shared * 100) : 0;
    return `<a class="stile rv${dark ? ' dk' : ''}" href="#/st/${s}" style="--c:${STC[s]}"><b>${esc(ST[s].name)}</b><span>${fmt(x.n)} products · ${fmt(x.instock)} in stock</span>
    <span class="meter"><i style="width:${pct}%"></i></span><small>Cheapest on <strong>${pct}%</strong> of the ${fmt(x.shared)} models it shares with other stores</small></a>`; }).join('')}</div>`;
}
function brandCard([b, n]) {
  const from = Math.min(...P.filter(p => p.b === b && p.p).map(p => p.p));
  return `<a class="bcard rv" href="#/b/${slug(b)}"><b>${esc(b)}</b><span>${fmt(n)} products${isFinite(from) ? ` · from ${fmt(from)} EGP` : ''}</span></a>`;
}

/* ---------- departments, group, brands, deals ---------- */
function renderDepartments() {
  app.innerHTML = pageHead({ crumbs: [[null, 'Departments']], title: 'All departments', sub: `${fmt(P.length)} products in ${Object.keys(byType).length} appliance types.` }) + `<section class="sec" style="padding-top:36px"><div class="wrap">${deptTiles()}</div></section>`;
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
    `<section class="sec" style="padding-top:30px"><div class="wrap"><p class="note" style="margin:0 0 16px">Tap a type above to filter and compare ${esc(b)} models with the type's own specs.</p><div class="grid">${rows.slice(0, 240).map(card).join('')}</div>${rows.length > 240 ? '<p class="note">Showing 240. Pick a type above to filter the rest.</p>' : ''}</div></section>`;
}
function renderDeals(q) {
  const g = q.get('d'), m = q.get('m') === 'disc' ? 'disc' : 'gap';
  const all = m === 'gap' ? P.filter(p => gapPct(p) >= 5) : P.filter(p => p.p && disc(p) >= 20 && inStock(p));
  const val = m === 'gap' ? gapPct : disc;
  const rows = all.filter(p => !g || groupOf(p.t) === g).sort((a, b) => val(b) - val(a) || (m === 'gap' ? gap(b) - gap(a) : a.p - b.p));
  const qs = (x, mm) => `#/deals?m=${mm}${x ? '&d=' + encodeURIComponent(x) : ''}`;
  app.innerHTML = pageHead({ crumbs: [[null, 'Deals']], title: m === 'gap' ? 'Same model, cheaper elsewhere' : 'Biggest discounts',
    sub: m === 'gap' ? `${fmt(all.length)} models where one store is at least 5% cheaper than another for the same in-stock product. Card prices are the cheapest store.` : `${fmt(all.length)} in-stock products at least 20% below the store's own old price.`,
    sibs: `<div class="sibs"><a class="sib${m === 'gap' ? ' on' : ''}" href="${qs(g, 'gap')}">Price gaps between stores</a><a class="sib${m === 'disc' ? ' on' : ''}" href="${qs(g, 'disc')}">Store discounts</a></div>
    <div class="sibs" style="margin-top:8px"><a class="sib${!g ? ' on' : ''}" href="${qs(null, m)}">All<small>${fmt(all.length)}</small></a>${Object.keys(GROUPS).map(x => { const n = all.filter(p => groupOf(p.t) === x).length; return n ? `<a class="sib${g === x ? ' on' : ''}" href="${qs(x, m)}">${esc(x)}<small>${fmt(n)}</small></a>` : ''; }).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap"><div class="grid">${rows.slice(0, 240).map(card).join('')}</div>${rows.length > 240 ? '<p class="note">Showing the top 240. Pick a department above to see more.</p>' : ''}</div></section>`;
}
function renderStores() {
  app.innerHTML = pageHead({ crumbs: [[null, 'Stores']], title: 'The stores', sub: `Prices from ${Object.keys(ST).length} Egyptian retailers, collected on ${dateTxt()}. The bar shows how often each store has the lowest in-stock price for models that more than one store sells.` }) +
    `<section class="sec" style="padding-top:36px"><div class="wrap">${storeTiles(false)}</div></section>`;
}
function renderStore(s, q) {
  const at = P.filter(p => p.of.some(o => o.s === s));
  const m = q.get('m') || 'cheap';
  const mine = p => p.of.find(o => o.s === s);
  let rows;
  if (m === 'cheap') rows = at.filter(p => live(p).length > 1 && live(p)[0].s === s).sort((a, b) => gapPct(b) - gapPct(a));
  else if (m === 'dear') rows = at.filter(p => { const L = live(p), o = mine(p); return L.length > 1 && o.in !== 0 && L[0].s !== s; }).sort((a, b) => (mine(b).p - b.p) / mine(b).p - (mine(a).p - a.p) / mine(a).p);
  else rows = at.slice().sort((a, b) => a.t.localeCompare(b.t) || a.p - b.p);
  const x = storeStats(s);
  const tabs = [['cheap', `Cheapest here`], ['dear', `Cheaper elsewhere`], ['all', `Everything`]];
  app.innerHTML = pageHead({ crumbs: [['#/stores', 'Stores'], [null, ST[s].name]], title: esc(ST[s].name),
    sub: `${fmt(x.n)} home appliances, ${fmt(x.instock)} in stock. Of the ${fmt(x.shared)} models it shares with other stores, it is the cheapest on ${fmt(x.cheapest)}. <a href="${esc(ST[s].url)}" target="_blank" rel="noopener" style="color:inherit">${esc(ST[s].url.replace(/^https?:\/\/(www\.)?/, ''))} ↗</a>`,
    sibs: `<div class="sibs">${tabs.map(([k, l]) => `<a class="sib${m === k ? ' on' : ''}" href="#/st/${s}?m=${k}">${l}</a>`).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap">${m === 'dear' ? `<p class="note" style="margin:0 0 16px">Models ${esc(ST[s].name)} has in stock that another store sells for less. Cards show the cheapest price.</p>` : ''}<div class="grid">${rows.slice(0, 240).map(card).join('')}</div>${rows.length > 240 ? `<p class="note">Showing 240 of ${fmt(rows.length)}.</p>` : ''}</div></section>`;
}
function renderSearch(qs) {
  const q = (qs || '').trim();
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean).map(t => t.replace(/s$/, ''));
  const syn = { fridge: 'refrigerat', freezer: 'freezer', tv: 'tv', vacuum: 'vacuum', washer: 'wash', ac: 'air condition' };
  const rows = toks.length ? P.filter(p => { const h = (p.n + ' ' + p.b + ' ' + p.t + ' ' + (p.m || '') + ' ' + Object.values(p.f).join(' ')).toLowerCase(); return toks.every(t => h.includes(syn[t] || t) || h.includes(t.replace(/[^a-z0-9]/g, ''))); }) : [];
  const types = {}; rows.forEach(p => types[p.t] = (types[p.t] || 0) + 1);
  app.innerHTML = pageHead({ crumbs: [[null, 'Search']], title: rows.length ? `${fmt(rows.length)} results for “${esc(q)}”` : `No results for “${esc(q)}”`, sub: rows.length ? 'Open a type to filter these with its own specs and compare.' : 'Try a brand, a type or a model number, such as “Bosch”, “dishwasher” or “KGN56”.',
    sibs: `<div class="sibs">${Object.entries(types).sort((a, c) => c[1] - a[1]).map(([t, n]) => `<a class="sib" href="#/c/${TSLUG[t]}?q=${encodeURIComponent(q)}">${esc(plural(t))}<small>${n}</small></a>`).join('')}</div>` }) +
    `<section class="sec" style="padding-top:30px"><div class="wrap">${rows.length ? `<div class="grid">${rows.slice(0, 120).map(card).join('')}</div>${rows.length > 120 ? '<p class="note">Showing the first 120. Pick a type above to see the rest.</p>' : ''}` : deptTiles()}</div></section>`;
}

/* ---------- catalogue ---------- */
const C = { type: null, brands: new Set(), stores: new Set(), f: {}, pmin: null, pmax: null, instock: true, multi: false, q: '', sort: 'pa', meta: [], lim: 60 };
function catQS() {
  const q = new URLSearchParams();
  if (C.brands.size) q.set('b', [...C.brands].join('|'));
  if (C.stores.size) q.set('st', [...C.stores].join('|'));
  if (C.pmin != null) q.set('pmin', C.pmin); if (C.pmax != null) q.set('pmax', C.pmax);
  if (!C.instock) q.set('all', '1'); if (C.multi) q.set('multi', '1');
  if (C.q) q.set('q', C.q); if (C.sort !== 'pa') q.set('sort', C.sort);
  for (const [k, v] of Object.entries(C.f)) {
    if (v == null) continue;
    if (v === true) q.set('f.' + k, '1');
    else if (v instanceof Set) { if (v.size) q.set('f.' + k, [...v].join('|')); }
    else if (v.min != null || v.max != null) q.set('r.' + k, (v.min ?? '') + '~' + (v.max ?? ''));
  }
  return q.toString();
}
function syncURL() { const u = '#/c/' + TSLUG[C.type] + (catQS() ? '?' + catQS() : ''); if (location.hash !== u) history.replaceState(null, '', u); }
function readState(q) {
  Object.assign(C, { brands: new Set(), stores: new Set(), f: {}, pmin: null, pmax: null, instock: true, multi: false, q: '', sort: 'pa' });
  if (q.get('b')) C.brands = new Set(q.get('b').split('|'));
  if (q.get('st')) C.stores = new Set(q.get('st').split('|').filter(s => ST[s]));
  if (q.get('pmin')) C.pmin = +q.get('pmin'); if (q.get('pmax')) C.pmax = +q.get('pmax');
  if (q.get('all')) C.instock = false; if (q.get('multi')) C.multi = true;
  if (q.get('q')) C.q = q.get('q'); if (q.get('sort')) C.sort = q.get('sort');
  for (const [k, v] of q.entries()) {
    if (k.startsWith('f.')) { const key = k.slice(2), m = C.meta.find(x => x.k === key); if (!m) continue;
      if (m.kind === 'bool') C.f[key] = true; else C.f[key] = new Set(v.split('|').map(x => m.vals.some(y => typeof y === 'number') ? +x : x)); }
    if (k.startsWith('r.')) { const [a, b] = v.split('~'); C.f[k.slice(2)] = { min: a === '' ? null : +a, max: b === '' ? null : +b }; }
  }
}
function presetSel(def) {
  const out = {};
  for (const [k, v] of Object.entries(def)) {
    const m = C.meta.find(x => x.k === k); if (!m) return null;
    if (v === true) { if (m.kind !== 'bool') return null; out[k] = true; }
    else if (v.r) { const [a, b] = v.r; out[k] = m.kind === 'range' ? { min: a, max: b } : new Set(m.vals.filter(x => (a == null || x >= a) && (b == null || x <= b))); }
    else out[k] = new Set(v.filter(x => m.vals.includes(x)));
  }
  return out;
}
const sameSel = (a, b) => { if (a === true || b === true) return a === b; if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every(x => b.has(x)); if (a && b && !(a instanceof Set) && !(b instanceof Set)) return a.min === b.min && a.max === b.max; return false; };
function presetOn(sel) { return Object.entries(sel).every(([k, v]) => sameSel(C.f[k], v)); }
function presetMatch(p, sel) {
  return Object.entries(sel).every(([k, sv]) => { const v = p.f[k]; if (sv === true) return v === 'Yes'; if (sv instanceof Set) return sv.has(v); return v != null && (sv.min == null || v >= sv.min) && (sv.max == null || v <= sv.max); });
}
function renderPresets() {
  const el = $('presets'); if (!el) return;
  const ps = (PRESETS[C.type] || []).map(([l, d]) => [l, presetSel(d)]).filter(([, s]) => s && Object.values(s).every(v => v === true || !(v instanceof Set) || v.size));
  const base = byType[C.type].filter(p => !C.instock || inStock(p));
  const items = ps.map(([l, s], i) => { const n = base.filter(p => presetMatch(p, s)).length; return n ? `<button class="pre${presetOn(s) ? ' on' : ''}" data-pre="${i}">${esc(l)} <small>${fmt(n)}</small></button>` : ''; }).join('');
  el.innerHTML = items ? `<span class="prel">Popular choices</span>${items}` : '';
  el._ps = ps;
}
function renderPicks(rows) {
  const el = $('picks'); if (!el) return;
  const L = rows.filter(p => inStock(p) && p.p);
  if (L.length < 6) { el.innerHTML = ''; return; }
  const key = KEY[C.type], picks = [], used = new Set();
  const add = (lab, why, p) => { if (p && !used.has(p.id)) { used.add(p.id); picks.push([lab, why, p]); } };
  const cheap = L.reduce((a, b) => b.p < a.p ? b : a); add('Lowest price', `The cheapest match, at ${sname(cheap.of[0].s)}`, cheap);
  if (key) { const ks = L.map(p => p.f[key]).filter(v => typeof v === 'number').sort((a, b) => a - b);
    if (ks.length >= 6) { const med = ks[Math.floor(ks.length * 0.6)], pool = L.filter(p => p.f[key] >= med);
      if (pool.length) { const v = pool.reduce((a, b) => b.p < a.p ? b : a); add('Best value', `Cheapest with ${unit(key) === key ? key.toLowerCase() : ''}${fmt(med)}${unit(key) !== key ? ' ' + unit(key) : ''} or more`, v); } } }
  const wide = L.filter(p => live(p).length >= 3).sort((a, b) => live(b).length - live(a).length || a.p - b.p)[0];
  if (wide) add('Easiest to price-check', `Sold by ${live(wide).length} stores, so you can compare`, wide);
  const sv = L.filter(p => gapPct(p) >= 8).sort((a, b) => gap(b) - gap(a))[0]; if (sv) add('Biggest saving', `${fmt(gap(sv))} EGP less than the dearest store`, sv);
  const pr = L.slice().sort((a, b) => b.p - a.p), prem = pr.find(p => live(p).length >= 2) || pr[0]; if (L.length >= 12) add('Top of the range', 'The highest-priced match sold by 2+ stores', prem);
  const win = {}; let shared = 0; L.forEach(p => { if (live(p).length > 1) { shared++; const s = live(p)[0].s; win[s] = (win[s] || 0) + 1; } });
  const ws = Object.entries(win).sort((a, b) => b[1] - a[1]);
  el.innerHTML = `<div class="pkh"><h2>Top picks for these filters</h2>${ws.length && shared >= 5 ? `<p>${sdot(ws[0][0])}<b>${esc(sname(ws[0][0]))}</b> is cheapest on ${Math.round(ws[0][1] / shared * 100)}% of the ${fmt(shared)} matching models sold by more than one store${ws[1] ? `, then ${esc(sname(ws[1][0]))} (${Math.round(ws[1][1] / shared * 100)}%)` : ''}.</p>` : ''}</div>
   <div class="pkg">${picks.map(([l, w, p]) => `<div class="pk"><div class="pkl"><b>${esc(l)}</b><span>${esc(w)}</span></div>${card(p)}</div>`).join('')}</div>`;
}
function buildMeta() {
  const rows = byType[C.type]; const keys = [];
  rows.forEach(p => Object.keys(p.f).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
  C.meta = keys.map(k => {
    const vals = rows.map(p => p.f[k]).filter(v => v != null); if (!vals.length) return null;
    const uniq = [...new Set(vals)];
    if (uniq.every(v => v === 'Yes' || v === 'No')) return uniq.length === 2 ? { k, kind: 'bool' } : null;
    if (uniq.every(v => typeof v === 'number')) { uniq.sort((a, b) => a - b); return uniq.length <= 12 ? { k, kind: 'cat', vals: uniq } : { k, kind: 'range', vals: uniq }; }
    if (uniq.length < 2) return null;
    return { k, kind: 'cat', vals: uniq.sort((a, b) => vals.filter(v => v === b).length - vals.filter(v => v === a).length) };
  }).filter(Boolean);
}
function match(p, skip) {
  if (skip !== 'brand' && C.brands.size && !C.brands.has(p.b)) return false;
  if (C.pmin != null && (p.p == null || p.p < C.pmin)) return false;
  if (C.pmax != null && (p.p == null || p.p > C.pmax)) return false;
  if (skip !== 'store' && C.stores.size && !p.of.some(o => C.stores.has(o.s) && (!C.instock || o.in !== 0))) return false;
  if (C.instock && !inStock(p)) return false;
  if (C.multi && live(p).length < 2) return false;
  if (C.q) { const h = (p.n + ' ' + p.b + ' ' + (p.m || '')).toLowerCase(); if (!C.q.toLowerCase().split(/\s+/).every(t => h.includes(t))) return false; }
  for (const m of C.meta) {
    if (m.k === skip) continue; const sel = C.f[m.k]; if (sel == null) continue; const v = p.f[m.k];
    if (m.kind === 'bool') { if (sel && v !== 'Yes') return false; }
    else if (m.kind === 'range') { if (sel.min != null && (v == null || v < sel.min)) return false; if (sel.max != null && (v == null || v > sel.max)) return false; }
    else if (sel.size && !sel.has(v)) return false;
  }
  return true;
}
function renderCatalog(t, q) {
  if (C.type !== t) { C.type = t; buildMeta(); }
  readState(q);
  C.lim = 60;
  const g = groupOf(t), gi = gIndex(g), rows = byType[t];
  app.innerHTML = pageHead({ crumbs: [['#/departments', 'Departments'], ['#/d/' + GSLUG[g], g], [null, plural(t)]], title: esc(plural(t)), sub: `${fmt(rows.length)} models from ${new Set(rows.map(p => p.b)).size} brands across ${Object.keys(ST).length} stores. Narrow them down, then add up to 4 to compare.`,
    sibs: `<div class="sibs">${GROUPS[g].filter(x => byType[x]).map(x => `<a class="sib${x === t ? ' on' : ''}" href="#/c/${TSLUG[x]}">${esc(x)}<small>${fmt(byType[x].length)}</small></a>`).join('')}</div>` }) +
  `<div class="wrap"><div class="cat"><aside class="flt" id="filters" aria-label="Filters"></aside><section>
   <div class="presets" id="presets"></div><div class="stats" id="stats"></div><div class="picks" id="picks"></div><div class="strip" id="strip"></div>
   <div class="tools"><span class="cnt" id="cnt"></span><button class="fbtn" id="fbtn">Filters</button>
   <input class="sel" id="cq" type="search" placeholder="Search in ${esc(t==='TV'?'TVs':plural(t).toLowerCase())}" value="${esc(C.q)}" style="width:min(240px,100%)" aria-label="Search in this type">
   <select class="sel" id="sort" aria-label="Sort">${[['pa', 'Price: low to high'], ['pd', 'Price: high to low'], ['ga', 'Biggest gap between stores'], ['da', 'Biggest discount'], ['ka', KEY[t] ? 'Largest ' + KEY[t].replace(/ \(.*\)/, '').toLowerCase() : 'Key spec'], ['br', 'Brand A–Z']].map(([v, l]) => `<option value="${v}"${C.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
   <div class="grid" id="grid"></div></section></div></div>`;
  renderFilters(); renderResults();
}
function renderFilters() {
  renderPresets();
  const rows = byType[C.type];
  const bc = {}; rows.filter(p => match(p, 'brand')).forEach(p => bc[p.b] = (bc[p.b] || 0) + 1);
  const allB = [...new Set(rows.map(p => p.b))].sort((a, b) => (bc[b] || 0) - (bc[a] || 0) || a.localeCompare(b));
  const pr = rows.map(p => p.p).filter(v => v != null).sort((a, b) => a - b);
  const steps = [0, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 150000, 200000, 300000, 500000, 1000000].filter(v => v >= pr[0] * 0.6 && v <= pr[pr.length - 1] * 1.4);
  const sc = {}; rows.filter(p => match(p, 'store')).forEach(p => new Set(p.of.filter(o => !C.instock || o.in !== 0).map(o => o.s)).forEach(s => sc[s] = (sc[s] || 0) + 1));
  let h = `<div class="fh"><h2>Filters</h2><button class="link" id="reset">Reset all</button></div>
  <div class="fs"><h3>Store</h3><div class="opts">${Object.keys(ST).map(s => `<button class="opt${C.stores.has(s) ? ' on' : ''}" data-store="${s}" ${!sc[s] && !C.stores.has(s) ? 'disabled' : ''}>${sdot(s)}${esc(ST[s].name)} <small>${sc[s] || 0}</small></button>`).join('')}</div>
  <label class="tog"><input type="checkbox" id="instock" ${C.instock ? 'checked' : ''}> In stock only</label>
  <label class="tog"><input type="checkbox" id="multi" ${C.multi ? 'checked' : ''}> Sold by 2+ stores (price-matched)</label></div>
  <div class="fs"><h3>Brand</h3><div class="opts">${allB.map(b => `<button class="opt${C.brands.has(b) ? ' on' : ''}" data-brand="${esc(b)}" ${!bc[b] && !C.brands.has(b) ? 'disabled' : ''}>${esc(b)} <small>${bc[b] || 0}</small></button>`).join('')}</div></div>
  <div class="fs"><h3>Price (EGP)</h3><div class="rng"><select id="pmin" aria-label="Minimum price"><option value="">Any</option>${steps.map(v => `<option value="${v}" ${C.pmin === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select>–<select id="pmax" aria-label="Maximum price"><option value="">Any</option>${steps.map(v => `<option value="${v}" ${C.pmax === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select></div>
  </div>`;
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
  const rows = byType[C.type].filter(p => match(p)).sort((a, b) => s === 'pa' ? (a.p ?? 1e12) - (b.p ?? 1e12) : s === 'pd' ? (b.p ?? -1) - (a.p ?? -1) : s === 'ga' ? gapPct(b) - gapPct(a) || gap(b) - gap(a) : s === 'da' ? disc(b) - disc(a) : s === 'ka' ? (kv(b) ?? -1) - (kv(a) ?? -1) : a.b.localeCompare(b.b));
  const pr = rows.map(p => p.p).filter(v => v != null).sort((a, b) => a - b), med = pr.length ? pr[Math.floor(pr.length / 2)] : null;
  $('stats').innerHTML = `<div style="--c:${GC[0]}"><span>Matching</span><strong>${rows.length}</strong></div><div style="--c:${GC[1]}"><span>Brands</span><strong>${new Set(rows.map(p => p.b)).size}</strong></div><div style="--c:${GC[2]}"><span>Price range (EGP)</span><strong>${pr.length ? fmtK(pr[0]) + '–' + fmtK(pr[pr.length - 1]) : '—'}</strong></div><div style="--c:${GC[3]}"><span>Median price (EGP)</span><strong>${med ? fmt(med) : '—'}</strong></div>`;
  renderStrip(rows); renderPicks(rows); syncURL();
  $('cnt').textContent = `${fmt(rows.length)} of ${fmt(byType[C.type].length)} match`;
  $('grid').innerHTML = rows.length ? rows.slice(0, C.lim).map(card).join('') + (rows.length > C.lim ? `<div class="more-row"><button class="btn ghost" id="moreb">Show ${Math.min(60, rows.length - C.lim)} more of ${fmt(rows.length - C.lim)}</button></div>` : '') : `<div class="empty">Nothing matches these filters. <button class="link" id="reset2">Reset filters</button></div>`;
}
function renderStrip(rows) {
  const by = {}; rows.forEach(p => { if (p.p != null) (by[p.b] = by[p.b] || []).push(p.p); });
  const ent = Object.entries(by).map(([b, v]) => { v.sort((a, c) => a - c); return { b, min: v[0], max: v[v.length - 1], med: v[Math.floor(v.length / 2)], n: v.length }; }).sort((a, c) => c.n - a.n).slice(0, 24).sort((a, c) => a.med - c.med);
  if (!ent.length) { $('strip').innerHTML = '<h2>Price range by brand</h2><p>No priced products match.</p>'; return; }
  const lo = Math.min(...ent.map(e => e.min)), hi = Math.max(...ent.map(e => e.max)), L = Math.log, sp = L(hi) - L(lo) || 1, x = v => (L(v) - L(lo)) / sp * 100;
  $('strip').innerHTML = `<h2>Price range by brand</h2><p>Bar runs from each brand's cheapest to dearest matching model (best store price); the tick is the median. ${Object.keys(by).length > 24 ? 'The 24 brands with the most models are shown. ' : ''}Click a brand to filter.</p>` +
    ent.map(e => `<button class="br${C.brands.has(e.b) ? ' on' : ''}" data-brand="${esc(e.b)}" title="${esc(e.b)}: ${fmt(e.min)}–${fmt(e.max)} EGP, median ${fmt(e.med)}"><span class="bn">${esc(e.b)}</span><span class="track"><i></i><em style="left:${x(e.min)}%;width:${Math.max(x(e.max) - x(e.min), 1.5)}%"></em><u style="left:calc(${x(e.med)}% - 1px)"></u></span><span class="bc">${e.n}</span></button>`).join('') +
    `<div class="axis"><span></span><div><span>${fmt(lo)}</span><span>${fmt(Math.round(Math.exp((L(lo) + L(hi)) / 2)))}</span><span>${fmt(hi)}</span></div><span style="text-align:right">count</span></div>`;
}

/* ---------- product ---------- */
function renderProduct(id) {
  const p = byId[id]; if (!p) return renderNotFound();
  const g = groupOf(p.t), d = disc(p), on = CMP.includes(p.id), best = p.of[0], L = live(p), sv = gap(p);
  const sim = byType[p.t].filter(x => x.id !== p.id && x.p && inStock(x)).sort((a, b) => Math.abs(a.p - (p.p || 0)) - Math.abs(b.p - (p.p || 0))).slice(0, 8);
  const offers = p.of.map((o, i) => `<tr class="${i === 0 && o.in !== 0 ? 'win' : ''}${o.in === 0 ? ' oos' : ''}"><th>${sdot(o.s)}${esc(sname(o.s))}${o.mp ? `<small>sold by ${esc(o.mp)}</small>` : ''}</th>
    <td class="num"><b>${fmt(o.p)}</b> EGP${o.o ? ` <s>${fmt(o.o)}</s>` : ''}</td><td>${o.in === 0 ? 'Out of stock' : i === 0 && L.length > 1 ? '<span class="tag">Cheapest</span>' : L.length > 1 ? `+${fmt(o.p - L[0].p)}` : 'In stock'}</td>
    <td><a href="${esc(ourl(o))}" target="_blank" rel="noopener">View ↗</a></td></tr>`).join('');
  app.innerHTML = `<div class="wrap"><div class="crumbs" style="color:var(--mute);padding-top:22px;margin:0"><a href="#/">Home</a> › <a href="#/d/${GSLUG[g]}">${esc(g)}</a> › <a href="#/c/${TSLUG[p.t]}">${esc(plural(p.t))}</a></div>
  <div class="pp"><div class="gal"><img id="gimg" src="${img(p)}" alt="${esc(p.n)}" referrerpolicy="no-referrer">${d ? `<span class="off" style="font-size:15px;top:16px;left:16px">−${d}%</span>` : ''}${p.of.length > 1 ? `<span class="fdl" style="font-size:13px;top:16px;right:16px">${p.of.length} stores</span>` : ''}</div>
  <div><div class="brand" style="font-size:15px">${esc(p.b)} · ${esc(p.t)}</div><h1>${esc(p.n)}</h1>
   <div class="pbox"><div class="price"><strong>${fmt(p.p)}<small>EGP</small></strong>${p.o && p.o > p.p ? `<s>${fmt(p.o)} EGP</s>` : ''}</div>
    <p class="bestat">${inStock(p) ? `${L.length > 1 ? 'Lowest price, at' : 'At'} <b>${esc(sname(best.s))}</b>${sv ? ` · <span class="save">${fmt(sv)} EGP less than the dearest store</span>` : ''}` : 'Out of stock everywhere we checked; last listed price shown.'}</p>
    <div class="acts"><a class="btn green" href="${esc(ourl(best))}" target="_blank" rel="noopener">Buy at ${esc(sname(best.s))} ↗</a><button class="btn ghost cmpb${on ? ' on' : ''}" data-cmp="${p.id}" data-big="1" style="border-radius:12px;min-height:48px;font-size:15px">${on ? '✓ Added' : 'Add to compare'}</button><button class="btn ghost pbig${PLAN.includes(p.id) ? ' on' : ''}" data-plan="${p.id}" data-big="1">${PLAN.includes(p.id) ? '✓ In your home plan' : 'Add to home plan'}</button></div></div>
   <h2 class="h3">Prices at ${p.of.length} store${p.of.length > 1 ? 's' : ''}</h2>
   <table class="spec offers"><tbody>${offers}</tbody></table>
   <h2 class="h3">Specs</h2>
   <table class="spec"><tbody>${Object.entries(p.f).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}${p.m ? `<tr><th>Model code</th><td>${esc(p.m.split(' ')[0])}</td></tr>` : ''}</tbody></table>
   <p class="note">Specs are read from the product names the stores list. Prices were collected on ${dateTxt()}; confirm on the store's page before buying.</p></div></div>
  <div class="sh"><div><h2 class="display" style="font-size:clamp(24px,2.6vw,32px)">Similar ${esc(p.t==='TV'?'TVs':plural(p.t).toLowerCase())} at a similar price</h2></div><a class="more" href="#/c/${TSLUG[p.t]}">See all ${fmt(byType[p.t].length)} →</a></div>
  <div class="rail" style="margin-bottom:40px">${sim.map(card).join('')}</div></div>`;
  if (p.im && p.th) { const hi = new Image(); hi.onload = () => { const g2 = $('gimg'); if (g2) g2.src = hi.src; }; hi.src = p.im; }
  else if (p.im && /mafrservices/.test(p.im)) { const g2 = $('gimg'); g2.src = p.im; }
}

/* ---------- compare ---------- */
function renderCompare(ids) {
  const fromUrl = ids && ids.length;
  const list = (fromUrl ? ids : CMP).map(String).filter(i => byId[i]).slice(0, 4);
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
  const pr = its.map(p => p.p); h += row('Best price (EGP)', pr.map(v => v ? fmt(v) : '—'), bi(pr, 1), pr);
  const at = its.map(p => inStock(p) ? sname(p.of[0].s) : 'Out of stock'); h += row('Cheapest at', at.map(esc), -1, at);
  Object.keys(ST).forEach(s => { const raw = its.map(p => { const o = p.of.find(o => o.s === s); return o ? o.p : null; }); if (raw.every(v => v == null)) return;
    h += row(`At ${sname(s)}`, its.map((p, i) => { const o = p.of.find(o => o.s === s); return o ? `<a href="${esc(ourl(o))}" target="_blank" rel="noopener">${fmt(o.p)}</a>${o.in === 0 ? ' <small>(out)</small>' : ''}` : '—'; }), -1, raw); });
  const ds = its.map(disc); h += row('Discount', ds.map(v => v ? v + '%' : '—'), bi(ds, -1), ds);
  keys.forEach(k => { const raw = its.map(p => p.f[k] ?? null); if (raw.every(v => v == null)) return; const better = /capacity|screen|place|burners|rpm|airflow|drawers|power|programs|hp|taps/i.test(k) ? bi(raw, -1) : -1; h += row(k, raw.map(v => v == null ? '—' : esc(v)), better, raw); });
  h += `<tr><th>Buy</th>${its.map(p => `<td><a class="btn green" style="min-height:40px;padding:8px 14px;font-size:14px" href="${esc(ourl(p.of[0]))}" target="_blank" rel="noopener">${esc(sname(p.of[0].s))} ↗</a></td>`).join('')}</tr></tbody></table>`;
  const share = location.href.split('#')[0] + '#/compare/' + list.join(',');
  app.innerHTML = pageHead({ crumbs: [['#/c/' + TSLUG[t], plural(t)], [null, 'Compare']], title: `Comparing ${its.length} ${esc(t==='TV'?'TVs':plural(t).toLowerCase())}`, sub: 'Bold row labels mark the rows that differ. A green dot marks the best price, discount or capacity in a row. Store prices link to the store.' }) +
    `<section class="sec" style="padding-top:28px"><div class="wrap"><div class="toolbar"><button class="btn" id="share" data-url="${esc(share)}">Copy link to this comparison</button><a class="btn ghost" href="#/c/${TSLUG[t]}">Add another</a><button class="link" id="cclear" style="margin-left:auto">Clear comparison</button></div><div class="scroll">${h}</div></div></section>`;
}

/* ---------- home plan ---------- */
const KITS = {
  'Refrigerator': { pre: p => ['Top freezer', 'Bottom freezer (combi)'].includes(p.f.Layout) && p.f['No frost'] === 'Yes' && p.f['Capacity (L)'] >= 350 && p.f['Capacity (L)'] <= 550 },
  'Washing machine': { pre: p => p.f.Automation === 'Fully automatic' && p.f['Wash capacity (kg)'] >= 7 && p.f['Wash capacity (kg)'] <= 10 },
  'Cooker': { pre: p => p.f.Burners === 5 },
  'TV': { pre: p => p.f['Screen (inch)'] === 55 },
  'Air conditioner': { pre: p => p.f['Capacity (HP)'] === 1.5 },
  'Water heater': { pre: p => p.f.Type === 'Electric tank' && p.f['Tank / flow (L)'] >= 40 && p.f['Tank / flow (L)'] <= 60 },
  'Microwave': { pre: p => p.f['Capacity (L)'] >= 20 && p.f['Capacity (L)'] <= 32 },
  'Vacuum & floor care': { pre: p => p.f.Type === 'Canister' },
  'Water dispenser': { pre: p => true },
};
const TIER = { budget: [0.15, 'Budget'], mid: [0.5, 'Mid-range'], premium: [0.85, 'Premium'] };
function kitFor(tier) {
  const q = TIER[tier][0];
  return Object.entries(KITS).map(([t, k]) => {
    const pool = (byType[t] || []).filter(p => inStock(p) && p.p && k.pre(p));
    if (!pool.length) return null;
    const bc = {}; pool.forEach(p => bc[p.b] = (bc[p.b] || 0) + 1);
    const known = pool.filter(p => bc[p.b] >= 3); const P2 = (known.length >= 8 ? known : pool).sort((a, b) => a.p - b.p);
    const target = P2[Math.min(P2.length - 1, Math.floor(P2.length * q))].p;
    const near = P2.filter(p => Math.abs(p.p - target) <= target * 0.08);
    return (near.filter(p => live(p).length >= 2).sort((a, b) => live(b).length - live(a).length || Math.abs(a.p - target) - Math.abs(b.p - target))[0]) || near[0] || P2[0];
  }).filter(Boolean);
}
function applyKit(tier) { PLAN = kitFor(tier).map(p => p.id); savePlan(); toast(`Filled your plan with the ${TIER[tier][1].toLowerCase()} kit. Swap anything you like.`); renderPlan(); }
function renderPlan(ids) {
  if (ids && ids.length) { const v = ids.map(String).filter(i => byId[i]); if (v.length) { PLAN = v; savePlan(); history.replaceState(null, '', '#/plan'); } }
  const its = PLAN.map(i => byId[i]).filter(Boolean);
  const kits = Object.keys(TIER).map(k => { const ks = kitFor(k); return `<div class="kit"><b>${TIER[k][1]}</b><strong>${fmt(ks.reduce((a, p) => a + p.p, 0))}<small> EGP</small></strong><span>${ks.length} essentials, from ${esc([...new Set(ks.map(p => p.b))].slice(0, 4).join(', '))}${new Set(ks.map(p => p.b)).size > 4 ? ' and more' : ''}</span><button class="btn${k === 'mid' ? ' green' : ' ghost'}" data-kit="${k}">Use this kit</button></div>`; }).join('');
  let body = '';
  if (its.length) {
    const tot = its.reduce((a, p) => a + p.p, 0);
    const dear = its.reduce((a, p) => { const L = live(p); return a + (L.length ? Math.max(...L.map(o => o.p)) : p.p); }, 0);
    const per = Object.keys(ST).map(s => { const has = its.filter(p => p.of.some(o => o.s === s && o.in !== 0)); return { s, n: has.length, sum: has.reduce((a, p) => a + p.of.find(o => o.s === s && o.in !== 0).p, 0), best: its.filter(p => inStock(p) && p.of[0].s === s).length }; }).filter(x => x.n).sort((a, b) => b.best - a.best || b.n - a.n);
    const groups = Object.keys(GROUPS).map(g => [g, its.filter(p => groupOf(p.t) === g)]).filter(([, a]) => a.length);
    body = `<div class="plan">
     <div class="plist"><div class="addmore"><span class="prel">Add more</span>${['Refrigerator', 'Washing machine', 'Cooker', 'TV', 'Air conditioner', 'Water heater', 'Dishwasher', 'Freezer', 'Hood', 'Hob', 'Built-in oven', 'Microwave', 'Dryer', 'Air fryer', 'Kettle', 'Iron & steamer', 'Fan', 'Heater', 'Vacuum & floor care', 'Water dispenser'].filter(t => byType[t] && !its.some(p => p.t === t)).map(t => `<a class="pre" href="#/c/${TSLUG[t]}">+ ${esc(t === 'TV' ? 'TV' : t)}</a>`).join('')}</div>${groups.map(([g, a]) => `<h3>${esc(g)}</h3>${a.map(p => `<div class="prow"><a href="#/p/${p.id}"><img src="${img(p)}" alt="" loading="lazy"></a>
       <div class="pinfo"><small>${esc(p.t)} · ${esc(p.b)}</small><a href="#/p/${p.id}">${esc(p.n)}</a><span class="at">${sdot(p.of[0].s)}${inStock(p) ? (live(p).length > 1 ? 'Cheapest at ' : 'At ') : 'Out of stock · '}<b>${esc(sname(p.of[0].s))}</b>${gap(p) ? `<span class="sv">save ${fmt(gap(p))}</span>` : ''}</span></div>
       <div class="pprice"><strong>${fmt(p.p)}</strong><small>EGP</small><div><a href="#/c/${TSLUG[p.t]}">Swap</a> · <button class="link" data-plan="${p.id}">Remove</button></div></div></div>`).join('')}`).join('')}</div>
     <aside class="psum"><h3>Your total</h3><div class="ptot"><strong>${fmt(tot)}</strong><small>EGP</small></div><p>Buying each item at its cheapest in-stock store. At the dearest stores the same list costs ${fmt(dear)} EGP, <b>${fmt(dear - tot)} EGP more</b>.</p>
      <h4>By store</h4><table class="spec"><tbody>${per.map(x => `<tr><th>${sdot(x.s)}${esc(sname(x.s))}</th><td>${x.best} cheapest</td><td>${x.n}/${its.length} items${x.n === its.length ? ` · ${fmt(x.sum)}` : ''}</td></tr>`).join('')}</tbody></table>
      <p class="note">“${its.length}/${its.length} items” means you could buy everything at that store, at the total shown.</p>
      <div class="pact"><button class="btn" id="share" data-url="${esc(location.href.split('#')[0] + '#/plan/' + its.map(p => p.id).join(','))}">Copy link to this plan</button><button class="link" id="planclear">Clear plan</button></div></aside></div>`;
  } else body = `<div class="empty" style="text-align:left">Your plan is empty. Start from a kit above, or tap the <b>house button</b> on any product to add it.</div>`;
  app.innerHTML = pageHead({ crumbs: [[null, 'Home plan']], title: 'Furnish your home', sub: 'Build a list of everything you need, see the cheapest store for each item and your total. It is saved in this browser, and you can share it as a link.' }) +
   `<section class="sec" style="padding-top:30px"><div class="wrap"><h2 class="h3" style="margin-top:0">Start from a ready-made kit</h2><p class="note" style="margin:0 0 14px">Typical choices for a new home: a 350–550 L no-frost fridge, a 7–10 kg automatic washer, a 5-burner cooker, a 55" TV, a 1.5 HP AC, a 40–60 L water heater, a microwave, a canister vacuum and a water dispenser. Picked at the low, middle and high end of in-stock prices, preferring models sold by several stores.</p>
   <div class="kits">${kits}</div>${body}</div></section>`;
}

/* ---------- about, 404 ---------- */
function renderAbout() {
  app.innerHTML = pageHead({ crumbs: [[null, 'How it works']], title: 'How this site works', sub: 'What the numbers mean, where they come from, and what to double-check.' }) +
  `<section class="sec" style="padding-top:36px"><div class="wrap prose">
   <h2>Where the data comes from</h2><p>Products, prices, old prices, stock, photos and links were collected from the public websites of ${Object.values(ST).map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join(', ')} on <strong>${dateTxt()}</strong>. Only home appliances are included: no phones, laptops, personal care, spare parts or accessories. Prices are in Egyptian pounds. To buy, follow a store link on any product.</p>
   <h2>How the same product is matched across stores</h2><p>Each store names products differently, so products are matched by <strong>brand and model code</strong> (for example <em>RDNE455MK</em> or <em>65U8000F</em>). Small differences are allowed, such as a colour suffix (<em>SJ-GV63G-BK</em>) or Samsung's regional prefix (<em>UA55U8000F</em>). TVs only match when the screen size is the same. Products without a model code in their name can't be matched and appear once per store.</p>
   <h2>Which price you see</h2><p>The headline price is the <strong>lowest in-stock price</strong> across all stores. If no store has it in stock, it shows the last listed price and is marked out of stock. B.TECH listings from marketplace sellers say who the seller is.</p>
   <h2>How specs are worked out</h2><p>Specs are read from product names, such as “Bosch Refrigerator 522 Liter No Frost Stainless”. If a name doesn't mention something, that spec is left blank, or counted as “No” for yes/no filters. So a product may have a feature its name doesn't state. Some fridge layouts come from the maker's model series: Bosch <strong>KDN</strong> is top-freezer, <strong>KGN</strong> is bottom-freezer, LG <strong>GC-B257</strong> is side-by-side.</p>
   <h2>Comparing</h2><ul><li>You can compare 2 to 4 products of the same type.</li><li>The table shows each store's price for each product, and which store is cheapest.</li><li>The green dot marks the lowest price, the biggest discount, and the largest capacity, screen or power in a row.</li><li>Use “Copy link to this comparison” to send it to someone.</li></ul>
   <h2>Popular choices and top picks</h2><p>Each appliance page has one-tap choices such as <em>Top freezer</em>, <em>350–450 L</em>, <em>Half automatic</em> or <em>65"</em>. Your filters are kept in the page address, so you can bookmark or send the link. Top picks are worked out from whatever matches your filters: the lowest price; the best value (the cheapest with at least the typical capacity or size); the model sold by the most stores; the biggest saving between stores; and the top of the range.</p>
   <p>Where a fridge name doesn't state its layout, it is taken from well-known Egyptian top-freezer model series (such as Sharp SJ, Tornado RF, Toshiba GR and Fresh FNT); otherwise it shows as “Not stated”. Washers are handled the same way for front or top loading.</p>
   <h2>Home plan</h2><p>Tap the house button on any product to add it to your home plan. The plan shows the cheapest store for each item, your total, and which stores carry everything. The budget, mid-range and premium kits are starting points picked automatically from in-stock models; swap anything you like.</p>
   <h2>Before you buy</h2><p>Prices and stock change daily, and installation, delivery and warranty differ by store. Always confirm on the store's own page.</p></div></section>`;
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
  else if (a === 'p') renderProduct(b);
  else if (a === 'stores') renderStores();
  else if (a === 'plan') renderPlan(b ? b.split(',') : null);
  else if (a === 'st' && ST[b]) renderStore(b, q);
  else if (a === 'brands') renderBrands();
  else if (a === 'b' && brandBySlug(b)) renderBrand(brandBySlug(b));
  else if (a === 'deals') renderDeals(q);
  else if (a === 's') renderSearch(b);
  else if (a === 'compare') renderCompare(b ? b.split(',') : null);
  else if (a === 'about') renderAbout();
  else renderNotFound();
  document.querySelectorAll('[data-nav]').forEach(n => n.classList.toggle('on', n.dataset.nav === a || (a === 'd' || a === 'c') && n.dataset.nav === 'departments' || a === 'b' && n.dataset.nav === 'brands' || a === 'st' && n.dataset.nav === 'stores'));
  $('top').classList.remove('open');
  const keepScroll = a === 'c' && route._last === 'c:' + b;
  route._last = a + ':' + b;
  if (!keepScroll) window.scrollTo(0, 0);
  renderTray(); reveal();
  const titles = { '': 'Home appliance prices, side by side', departments: 'Departments', deals: 'Best deals', brands: 'Brands', about: 'How it works', compare: 'Compare', stores: 'Stores', plan: 'Home plan' };
  document.title = (a === 'c' && typeBySlug(b) ? plural(typeBySlug(b)) : a === 'd' && grpBySlug(b) ? grpBySlug(b) : a === 's' ? 'Search: ' + (b || '') : a === 'p' && byId[b] ? byId[b].n : a === 'st' && ST[b] ? ST[b].name : a === 'b' && brandBySlug(b) ? brandBySlug(b) : titles[a] || 'Appliance Compare') + ' · Appliance Compare';
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
  if (t.dataset.cmp) { toggleCmp(t.dataset.cmp); return; }
  if (t.dataset.plan) { e.preventDefault(); togglePlan(t.dataset.plan); if (location.hash.startsWith('#/plan')) renderPlan(); return; }
  if (t.dataset.kit) { applyKit(t.dataset.kit); return; }
  if (t.id === 'planclear') { PLAN = []; savePlan(); renderPlan(); return; }
  if (t.dataset.pre != null && $('presets')) { const [, sel] = $('presets')._ps[+t.dataset.pre]; if (presetOn(sel)) Object.keys(sel).forEach(k => delete C.f[k]); else Object.entries(sel).forEach(([k, v]) => C.f[k] = v instanceof Set ? new Set(v) : v === true ? true : { ...v }); C.lim = 60; renderFilters(); renderResults(); return; }
  if (t.dataset.rm) { CMP = CMP.filter(x => x !== t.dataset.rm); saveCmp(); if (location.hash.startsWith('#/compare')) { location.hash = '#/compare' + (CMP.length ? '/' + CMP.join(',') : ''); } return; }
  if (t.id === 'moreb') { C.lim += 60; renderResults(); return; }
  if (t.dataset.store && $('filters')) { const x = t.dataset.store; C.stores.has(x) ? C.stores.delete(x) : C.stores.add(x); C.lim = 60; renderFilters(); renderResults(); return; }
  if (t.dataset.brand && $('filters')) { const b = t.dataset.brand; C.brands.has(b) ? C.brands.delete(b) : C.brands.add(b); renderFilters(); renderResults(); return; }
  if (t.dataset.cat) { const k = t.dataset.cat, v = t.dataset.num === '1' ? Number(t.dataset.v) : t.dataset.v; const s = C.f[k] || (C.f[k] = new Set()); s.has(v) ? s.delete(v) : s.add(v); renderFilters(); renderResults(); return; }
  if (t.id === 'reset' || t.id === 'reset2') { Object.assign(C, { brands: new Set(), stores: new Set(), f: {}, pmin: null, pmax: null, instock: true, multi: false, q: '', lim: 60 }); const i = $('cq'); if (i) i.value = ''; renderFilters(); renderResults(); return; }
  if (t.id === 'fbtn') { $('filters').classList.toggle('open'); return; }
  if (t.id === 'tclr' || t.id === 'cclear') { CMP = []; saveCmp(); if (t.id === 'cclear') location.hash = '#/compare'; return; }
  if (t.id === 'burger') { const o = $('top').classList.toggle('open'); t.setAttribute('aria-expanded', o); return; }
  if (t.id === 'share') { const u = t.dataset.url; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Link copied. Anyone with it sees this comparison.'), () => toast('Copy this link: ' + u)); return; }
});
document.addEventListener('change', e => {
  const t = e.target; if (!$('filters') || !t.closest('.cat')) return;
  if (t.id === 'pmin') C.pmin = t.value ? +t.value : null;
  else if (t.id === 'pmax') C.pmax = t.value ? +t.value : null;
  else if (t.id === 'instock') C.instock = t.checked;
  else if (t.id === 'multi') C.multi = t.checked;
  else if (t.dataset.bool) C.f[t.dataset.bool] = t.checked || null;
  else if (t.dataset.rmin || t.dataset.rmax) { const k = t.dataset.rmin || t.dataset.rmax; const s = C.f[k] || (C.f[k] = {}); s[t.dataset.rmin ? 'min' : 'max'] = t.value ? +t.value : null; }
  else if (t.id === 'sort') { C.sort = t.value; C.lim = 60; renderResults(); return; }
  else return;
  C.lim = 60; renderFilters(); renderResults();
});
document.addEventListener('input', e => { if (e.target.id === 'cq') { C.q = e.target.value.trim(); renderFilters(); renderResults(); } });
document.addEventListener('submit', e => { const f = e.target; if (f.id === 'hsearch' || f.id === 'bsearch') { e.preventDefault(); const q = f.q.value.trim(); if (q) location.hash = '#/s/' + encodeURIComponent(q); f.q.blur(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('filters')?.classList.remove('open'); $('top').classList.remove('open'); } });
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
fetch('data/products.json').then(r => r.json()).then(D => {
  P = D.products; GROUPS = D.groups; KEY = D.key; ST = D.stores; UPD = D.updated;
  P.forEach(p => { byId[p.id] = p; (byType[p.t] = byType[p.t] || []).push(p); });
  Object.keys(byType).forEach(t => TSLUG[t] = slug(t)); Object.keys(GROUPS).forEach(g => GSLUG[g] = slug(g));
  const bc = {}; P.forEach(p => bc[p.b] = (bc[p.b] || 0) + 1); BRANDS = Object.entries(bc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  CMP = CMP.map(String).filter(i => byId[i]); PLAN = PLAN.map(String).filter(i => byId[i]); savePlan();
  const hs = document.querySelector('#hsearch input'); if (hs) hs.placeholder = `Search ${fmt(P.length)} products, brands, model codes`;
  $('fstores').innerHTML = Object.keys(ST).map(s => `<a href="#/st/${s}">${esc(ST[s].name)}</a>`).join('');
  $('fupd').textContent = `Prices in EGP, collected on ${dateTxt()}.`;
  $('fdepts').innerHTML = Object.keys(GROUPS).map(g => `<a href="#/d/${GSLUG[g]}">${esc(g)}</a>`).join('');
  route();
}).catch(() => { app.innerHTML = '<div class="wrap" style="padding:80px 0">The catalogue could not load. Please refresh the page.</div>'; });
}
