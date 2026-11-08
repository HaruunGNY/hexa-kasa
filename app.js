'use strict';
(() => {
  // ===================== Sabitler =====================
  const KEY = 'hexakasa_data_v1';
  const VERSION = '1.3.0';
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const WDS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const WDL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const GROUPS = ['Nakit', 'Banka', 'Kart', 'Birikim', 'Yatırım', 'Borç', 'Diğer'];
  const GROUP_ICON = { Nakit: '💵', Banka: '🏦', Kart: '💳', Birikim: '🐷', Yatırım: '📈', Borç: '🧾', Diğer: '👛' };
  const PALETTE = ['#ef5350', '#ffa726', '#fdd835', '#66bb6a', '#26a69a', '#42a5f5', '#5c6bc0', '#ab47bc', '#ec407a', '#8d6e63', '#78909c', '#c0ca33'];
  const EMOJIS = ['🏷️', '🍔', '🍕', '☕', '🍺', '🛒', '🚌', '🚕', '⛽', '🚗', '✈️', '🏠', '💡', '💧', '🔥', '📱', '💻', '👕', '👟', '💊', '🏥', '🎮', '🎬', '🎵', '⚽', '🏋️', '🎓', '📚', '💄', '✂️', '🐾', '👶', '🎁', '🎉', '📺', '🚬', '💳', '🏦', '💰', '💵', '📈', '🧾', '🛠️', '🧹', '🙏', '❤️', '📦'];

  // Hazır kategoriler ve alt kategorileri (id'ler sabit: e0, e1… / i0, i1…)
  const DEFAULT_CATS = {
    expense: [
      ['🍔', 'Yemek', ['Kahvaltı', 'Öğle Yemeği', 'Akşam Yemeği', 'Atıştırmalık', 'Paket Servis']],
      ['🛒', 'Market', ['Gıda', 'Meyve / Sebze', 'Et / Tavuk', 'İçecek', 'Temizlik']],
      ['🚌', 'Ulaşım', ['Toplu Taşıma', 'Taksi', 'Şehirlerarası Otobüs', 'Uçak']],
      ['🏠', 'Kira / Ev', ['Kira', 'Aidat', 'Ev Eşyası', 'Tamir / Bakım']],
      ['💡', 'Faturalar', ['Elektrik', 'Su', 'Doğalgaz']],
      ['📱', 'Telefon / İnternet', ['Cep Telefonu', 'Ev İnterneti']],
      ['👕', 'Giyim', ['Kıyafet', 'Ayakkabı', 'Aksesuar']],
      ['💊', 'Sağlık', ['İlaç', 'Doktor / Hastane', 'Diş']],
      ['🎮', 'Eğlence', ['Sinema', 'Konser / Etkinlik', 'Oyun', 'Gezi / Tatil']],
      ['☕', 'Kafe', ['Kahve', 'Çay', 'Tatlı']],
      ['🎓', 'Eğitim', ['Kurs', 'Kitap', 'Okul']],
      ['💄', 'Kişisel Bakım', ['Kuaför / Berber', 'Kozmetik']],
      ['🚗', 'Araç / Yakıt', ['Yakıt', 'Bakım', 'Otopark', 'Köprü / Otoyol', 'Sigorta / Vergi']],
      ['🎁', 'Hediye', ['Doğum Günü', 'Bayram', 'Özel Gün']],
      ['📺', 'Abonelik', ['Dijital Platform', 'Müzik', 'Spor Salonu', 'Uygulama']],
      ['📦', 'Diğer', []],
    ],
    income: [
      ['💰', 'Maaş', []],
      ['🎉', 'Prim / İkramiye', []],
      ['💵', 'Ek Gelir', ['Freelance', 'Kira Geliri', 'Satış']],
      ['📈', 'Yatırım', ['Faiz', 'Hisse', 'Döviz / Altın']],
      ['🎁', 'Hediye', []],
      ['📦', 'Diğer', []],
    ],
  };
  const DATA_V = 3;
  function defaultData() {
    const mk = (arr, p) => arr.map(([icon, name, subs], i) => ({ id: p + i, icon, name, subs: subs.map((n, j) => ({ id: `${p}${i}s${j}`, name: n })) }));
    const exp = mk(DEFAULT_CATS.expense, 'e');
    const inc = mk(DEFAULT_CATS.income, 'i');
    return {
      v: DATA_V,
      accounts: [
        { id: 'a1', name: 'Nakit', group: 'Nakit', initial: 0 },
        { id: 'a2', name: 'Banka Hesabı', group: 'Banka', initial: 0 },
        { id: 'a3', name: 'Kredi Kartı', group: 'Kart', initial: 0 },
      ],
      categories: { expense: exp, income: inc },
      tx: [],
      budgets: {},
      favorites: [],
      settings: { theme: 'auto', currency: '₺', weekStart: 1, monthStart: 1, lastAcc: null },
    };
  }

  // ===================== Veri =====================
  function normalize(r) {
    const d = defaultData();
    const cats = (r.categories && r.categories.expense && r.categories.income) ? r.categories : d.categories;
    for (const t of ['expense', 'income']) cats[t] = cats[t].map(c => ({ ...c, subs: Array.isArray(c.subs) ? c.subs : [] }));
    // Eski sürümden gelen veriye yeni hazır alt kategorileri bir kez ekle (kullanıcının kendi eklediklerine dokunmadan)
    if ((r.v || 1) < 3) {
      const low = s => String(s).toLocaleLowerCase('tr');
      let k = 0;
      for (const [t, p] of [['expense', 'e'], ['income', 'i']]) {
        DEFAULT_CATS[t].forEach(([, , subs], i) => {
          const c = cats[t].find(x => x.id === p + i);
          if (!c) return;
          for (const n of subs) if (!c.subs.some(s => low(s.name) === low(n))) c.subs.push({ id: `m${Date.now().toString(36)}${k++}`, name: n });
        });
      }
    }
    return {
      ...d, ...r, v: DATA_V,
      accounts: Array.isArray(r.accounts) ? r.accounts : d.accounts,
      categories: cats,
      tx: Array.isArray(r.tx) ? r.tx : [],
      budgets: r.budgets || {},
      favorites: Array.isArray(r.favorites) ? r.favorites : [],
      settings: { ...d.settings, ...(r.settings || {}) },
    };
  }
  function load() {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && Array.isArray(r.tx)) return normalize(r); } catch (e) { /* bozuk veri */ }
    return defaultData();
  }
  let D = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(D)); }
    catch (e) { toast('Kaydedilemedi! Depolama dolu olabilir.'); }
  }
  // Tarayıcının verileri silmemesi için kalıcı depolama iste
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ===================== Yardımcılar =====================
  const $ = s => document.querySelector(s);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const shortDay = d => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  const nfc = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });
  const cur = () => D.settings.currency || '';
  const money = n => nf2.format(n);
  const moneyC = n => nf2.format(n) + (cur() ? ' ' + cur() : '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lower = s => String(s ?? '').toLocaleLowerCase('tr');

  // "1.250,50"  "1250.5"  "1.500"  "100+50" gibi girişleri anlar
  function normNum(s) {
    if (s.includes(',')) return s.replace(/\./g, '').replace(',', '.');
    const p = s.split('.');
    if (p.length > 2 || (p.length === 2 && p[1].length === 3)) return p.join('');
    return s;
  }
  function parseAmount(str) {
    const s = String(str ?? '').replace(/[\s₺$€]/g, '').replace(/×|x/gi, '*').replace(/÷/g, '/').replace(/−/g, '-');
    if (!s || !/^[\d.,+\-*/()]+$/.test(s)) return NaN;
    const expr = s.replace(/[\d.,]+/g, m => normNum(m));
    try {
      const v = Function('"use strict";return (' + expr + ')')();
      return (typeof v === 'number' && isFinite(v)) ? Math.round(v * 100) / 100 : NaN;
    } catch (e) { return NaN; }
  }
  const amountToInput = n => (n === '' || n == null) ? '' : String(n).replace('.', ',');

  // ----- Dönemler (ay başlangıç günü desteği) -----
  const ms = () => Math.min(Math.max(+D.settings.monthStart || 1, 1), 28);
  // Örn. başlangıç 15 ise "Kasım" = 15 Kasım – 14 Aralık
  function periodRange(y, m) {
    const s = new Date(y, m, ms()), e = new Date(y, m + 1, ms() - 1);
    return [ymd(s), ymd(e), s, e];
  }
  function curPeriod(d = new Date()) {
    let y = d.getFullYear(), m = d.getMonth();
    if (d.getDate() < ms()) { m--; if (m < 0) { m = 11; y--; } }
    return { y, m };
  }
  function weekStartOf(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return addDays(x, -((x.getDay() - +D.settings.weekStart + 7) % 7));
  }
  const inRange = (list, s, e) => list.filter(t => t.date >= s && t.date <= e);
  const yearRange = y => [periodRange(y, 0)[0], periodRange(y, 11)[1]];
  const txMonth = (y, m) => { const [s, e] = periodRange(y, m); return inRange(D.tx, s, e); };
  const txYear = y => { const [s, e] = yearRange(y); return inRange(D.tx, s, e); };

  // ----- Kategoriler -----
  const findCat = (type, id) => (D.categories[type] || []).find(c => c.id === id);
  const catOf = t => findCat(t.type, t.categoryId);
  const subOf = t => { const c = catOf(t); return t.subId && c ? c.subs?.find(s => s.id === t.subId) : null; };
  function catLabel(t) {
    if (t.type === 'transfer') return 'Transfer';
    const c = catOf(t); if (!c) return 'Kategorisiz';
    const s = subOf(t); return s ? `${c.name} / ${s.name}` : c.name;
  }
  const catIcon = t => t.type === 'transfer' ? '🔁' : (catOf(t)?.icon || '❔');

  const accOf = id => D.accounts.find(a => a.id === id);
  function sums(list) {
    let inc = 0, exp = 0;
    for (const t of list) { if (t.type === 'income') inc += t.amount; else if (t.type === 'expense') exp += t.amount; }
    return { inc, exp, tot: inc - exp };
  }
  const sortTx = (a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0);
  function balance(a) {
    let b = +a.initial || 0;
    for (const t of D.tx) {
      if (t.type === 'income' && t.accountId === a.id) b += t.amount;
      else if (t.type === 'expense' && t.accountId === a.id) b -= t.amount;
      else if (t.type === 'transfer') { if (t.accountId === a.id) b -= t.amount; if (t.toAccountId === a.id) b += t.amount; }
    }
    return Math.round(b * 100) / 100;
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const empty = (title, sub, icon = '🧾') => `<div class="empty"><div class="big">${icon}</div><b>${title}</b>${sub}</div>`;

  // ===================== Durum =====================
  const S = { tab: 'tx', sub: 'daily', y: 0, m: 0, wk: null, statsSub: 'stats', statsType: 'expense', period: 'month' };
  function goToday() { const p = curPeriod(); S.y = p.y; S.m = p.m; S.wk = weekStartOf(new Date()); }
  goToday();
  const statsMain = () => S.tab === 'stats' && S.statsSub === 'stats';
  const weekMode = () => statsMain() && S.period === 'week';
  const yearMode = () => (S.tab === 'tx' && S.sub === 'monthly') || (statsMain() && S.period === 'year');
  function shift(d) {
    if (weekMode()) S.wk = addDays(S.wk, 7 * d);
    else if (yearMode()) S.y += d;
    else { const dt = new Date(S.y, S.m + d, 1); S.y = dt.getFullYear(); S.m = dt.getMonth(); }
    render();
  }
  // İstatistikte seçili dönemin [başlangıç, bitiş] tarihleri
  function statsRange() {
    if (S.period === 'week') return [ymd(S.wk), ymd(addDays(S.wk, 6))];
    if (S.period === 'year') return yearRange(S.y);
    return periodRange(S.y, S.m).slice(0, 2);
  }
  function setPeriod(p) {
    if (p === 'week') {
      const [s, e] = periodRange(S.y, S.m), td = today();
      S.wk = weekStartOf(td >= s && td <= e ? new Date() : parseDate(s));
    } else if (S.period === 'week') {
      const c = curPeriod(addDays(S.wk, 3)); S.y = c.y; S.m = c.m;
    }
    S.period = p;
  }

  // ===================== Tema =====================
  const mq = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const t = D.settings.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : D.settings.theme;
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name=theme-color]').content = '#0a0a0a';
  }
  mq.addEventListener?.('change', applyTheme);

  // ===================== Ana çizim =====================
  function render() {
    applyTheme();
    renderTop();
    $('#view').innerHTML = S.tab === 'tx' ? viewTx() : S.tab === 'stats' ? viewStats() : S.tab === 'acc' ? viewAcc() : viewMore();
    document.querySelectorAll('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.v === S.tab));
    $('#fab').style.display = (S.tab === 'tx' || S.tab === 'stats') ? '' : 'none';
  }

  const SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  function topLabel() {
    if (weekMode()) { const e = addDays(S.wk, 6); return [`${shortDay(S.wk)} – ${shortDay(e)}`, String(e.getFullYear())]; }
    if (yearMode()) {
      const [a, b] = yearRange(S.y).map(parseDate);
      return [String(S.y), ms() !== 1 ? `${shortDay(a)} ${a.getFullYear()} – ${shortDay(b)} ${b.getFullYear()}` : ''];
    }
    const r = periodRange(S.y, S.m);
    return [`${MONTHS[S.m]} ${S.y}`, ms() !== 1 ? `${shortDay(r[2])} – ${shortDay(r[3])}` : ''];
  }
  function renderTop() {
    let h;
    if (S.tab === 'tx' || S.tab === 'stats') {
      const [t, sub] = topLabel();
      h = `<button class="icon" data-act="prev" aria-label="Önceki">‹</button>
           <button class="title" data-act="thisMonth">${t}${sub ? `<small>${sub}</small>` : ''}</button>
           <button class="icon" data-act="next" aria-label="Sonraki">›</button>`;
      if (S.tab === 'tx') h += `<button class="icon right" data-act="search" aria-label="Ara">${SEARCH_SVG}</button>`;
      else if (S.statsSub === 'stats') h += `<button class="pill" data-act="period">${{ week: 'Haftalık', month: 'Aylık', year: 'Yıllık' }[S.period]} ▾</button>`;
    } else {
      h = `<div class="title">${S.tab === 'acc' ? 'Hesaplar' : 'Ayarlar'}</div>`;
    }
    $('#topbar').innerHTML = h;
  }
  const seg = (act, items, cur) => `<div class="seg">${items.map(([k, l]) => `<button data-act="${act}" data-v="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const summaryBar = (s, labels = ['Gelir', 'Gider', 'Toplam']) =>
    `<div class="summary"><div><span>${labels[0]}</span><b class="inc">${money(s.inc)}</b></div><div><span>${labels[1]}</span><b class="exp">${money(s.exp)}</b></div><div><span>${labels[2]}</span><b class="${s.tot < 0 ? 'exp' : ''}">${money(s.tot)}</b></div></div>`;

  // ===================== İşlemler sekmesi =====================
  function viewTx() {
    const tabs = seg('sub', [['daily', 'Günlük'], ['calendar', 'Takvim'], ['monthly', 'Aylık']], S.sub);
    const list = S.sub === 'monthly' ? txYear(S.y) : txMonth(S.y, S.m);
    const body = S.sub === 'daily' ? (list.length ? dayGroups(list) : empty('Bu dönemde henüz işlem yok', 'Sağ alttaki + butonuyla ilk işlemini ekle'))
      : S.sub === 'calendar' ? calendar(list) : monthly();
    return tabs + summaryBar(sums(list)) + body;
  }

  function dayGroups(list) {
    const g = {};
    for (const t of [...list].sort(sortTx)) (g[t.date] ??= []).push(t);
    return Object.keys(g).sort().reverse().map(d => {
      const items = g[d], s = sums(items), dt = parseDate(d), wd = dt.getDay();
      return `<section class="day"><div class="dayhead">
        <span class="dnum">${dt.getDate()}</span>
        <span class="wd ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}">${WDS[wd]}</span>
        <span class="dmy">${pad(dt.getMonth() + 1)}.${dt.getFullYear()}</span>
        <span class="inc">${s.inc ? money(s.inc) : ''}</span><span class="exp">${s.exp ? money(s.exp) : ''}</span>
      </div>${items.map(txRow).join('')}</section>`;
    }).join('');
  }

  function txRow(t) {
    const name = esc(catLabel(t));
    const sub = t.type === 'transfer'
      ? `${esc(accOf(t.accountId)?.name || '?')} → ${esc(accOf(t.toAccountId)?.name || '?')}`
      : esc(accOf(t.accountId)?.name || 'Hesap silinmiş');
    const cls = t.type === 'income' ? 'inc' : t.type === 'expense' ? 'exp' : 'trf';
    return `<div class="tx" data-act="edit" data-id="${t.id}">
      <div class="ic">${catIcon(t)}</div>
      <div class="mid"><div class="nm">${t.note ? esc(t.note) : name}</div><div class="sb">${t.note ? name + ' · ' : ''}${sub}</div></div>
      <div class="amt ${cls}">${money(t.amount)}</div></div>`;
  }

  function calendar(list) {
    const ws = +D.settings.weekStart;
    const [ss, es, s] = periodRange(S.y, S.m);
    const offset = (s.getDay() - ws + 7) % 7;
    const by = {}; for (const t of list) (by[t.date] ??= []).push(t);
    let h = '<div class="cal"><div class="calhead">';
    for (let i = 0; i < 7; i++) { const d = (i + ws) % 7; h += `<div class="${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}">${WDS[d]}</div>`; }
    h += '</div><div class="calgrid">';
    for (let i = 0; i < offset; i++) h += '<div class="cell blank"></div>';
    const td = today(); let n = 0;
    for (let d = new Date(s); ymd(d) <= es; d = addDays(d, 1)) {
      n++;
      const key = ymd(d), sm = sums(by[key] || []), wd = d.getDay();
      const lbl = (ms() !== 1 && (d.getDate() === 1 || key === ss)) ? shortDay(d) : d.getDate();
      h += `<div class="cell ${key === td ? 'today' : ''}" data-act="day" data-v="${key}">
        <div class="cd ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}">${lbl}</div>
        ${sm.inc ? `<div class="inc">${nf0.format(sm.inc)}</div>` : ''}${sm.exp ? `<div class="exp">${nf0.format(sm.exp)}</div>` : ''}</div>`;
    }
    const rest = (7 - (offset + n) % 7) % 7;
    for (let i = 0; i < rest; i++) h += '<div class="cell blank"></div>';
    return h + '</div></div>';
  }

  function monthly() {
    const cp = curPeriod();
    let rows = '';
    for (let m = 11; m >= 0; m--) {
      const list = txMonth(S.y, m);
      if ((S.y > cp.y || (S.y === cp.y && m > cp.m)) && !list.length) continue;
      const s = sums(list), r = periodRange(S.y, m);
      rows += `<div class="mrow" data-act="gomonth" data-v="${m}"><div class="mname">${MONTHS[m]}${ms() !== 1 ? `<small>${shortDay(r[2])} – ${shortDay(r[3])}</small>` : ''}</div>
        <div class="inc">${money(s.inc)}</div><div class="exp">${money(s.exp)}</div><div class="${s.tot < 0 ? 'exp' : ''}">${money(s.tot)}</div></div>`;
    }
    if (!rows) return empty('Bu yıl için kayıt yok', '');
    return `<div class="mrow head"><div class="mname">Ay</div><div>Gelir</div><div>Gider</div><div>Toplam</div></div>${rows}`;
  }

  // ===================== İstatistik sekmesi =====================
  function viewStats() {
    const tabs = seg('statsSub', [['stats', 'İstatistik'], ['budget', 'Bütçe']], S.statsSub);
    if (S.statsSub === 'budget') return tabs + budgetView();
    const [rs, re] = statsRange();
    const list = inRange(D.tx, rs, re);
    const s = sums(list), T = S.statsType;
    const typeSeg = `<div class="seg2">
      <button data-act="stype" data-v="income" class="${T === 'income' ? 'on inc' : ''}">Gelir<br><b>${money(s.inc)}</b></button>
      <button data-act="stype" data-v="expense" class="${T === 'expense' ? 'on exp' : ''}">Gider<br><b>${money(s.exp)}</b></button></div>`;
    const items = list.filter(t => t.type === T);
    const total = items.reduce((a, t) => a + t.amount, 0);
    const by = {}; for (const t of items) by[t.categoryId] = (by[t.categoryId] || 0) + t.amount;
    const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([cid, v], i) => {
      const c = findCat(T, cid);
      return { cid, v, name: c?.name || 'Kategorisiz', icon: c?.icon || '❔', color: PALETTE[i % PALETTE.length], pct: total ? v / total * 100 : 0 };
    });
    const periodWord = { week: 'hafta', month: 'dönem', year: 'yıl' }[S.period];
    if (!rows.length) return tabs + typeSeg + empty('Veri yok', `Bu ${periodWord} ${T === 'expense' ? 'gider' : 'gelir'} kaydı bulunmuyor`, '📊') + trendChart();
    return tabs + typeSeg + donut(rows, total) +
      `<div class="clist">${rows.map(r => `<div class="crow" data-act="catdetail" data-v="${esc(r.cid)}">
        <span class="pct" style="background:${r.color}">${r.pct < 1 ? '<1' : Math.round(r.pct)}%</span>
        <span class="ic">${r.icon}</span><span class="nm">${esc(r.name)}</span><span class="amt">${money(r.v)}</span></div>`).join('')}</div>` + trendChart();
  }

  function donut(rows, total) {
    const r = 62, C = 2 * Math.PI * r; let off = 0;
    const segs = rows.map(x => {
      const len = x.v / total * C;
      const s = `<circle r="${r}" cx="90" cy="90" fill="none" stroke="${x.color}" stroke-width="30" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"/>`;
      off += len; return s;
    }).join('');
    return `<div class="donut"><svg viewBox="0 0 180 180" width="210" height="210">
      <circle r="${r}" cx="90" cy="90" fill="none" class="ring" stroke-width="30"/>
      <g transform="rotate(-90 90 90)">${segs}</g>
      <text x="90" y="85" text-anchor="middle" class="dt1">Toplam</text>
      <text x="90" y="105" text-anchor="middle" class="dt2">${esc(nfc.format(total))} ${esc(cur())}</text></svg></div>`;
  }

  function trendChart() {
    const B = [];
    if (S.period === 'week') {
      for (let i = 7; i >= 0; i--) { const s = addDays(S.wk, -7 * i); B.push({ l: `${s.getDate()}.${pad(s.getMonth() + 1)}`, s: ymd(s), e: ymd(addDays(s, 6)) }); }
    } else if (S.period === 'year') {
      for (let m = 0; m < 12; m++) { const r = periodRange(S.y, m); B.push({ l: MONTHS[m].slice(0, 3), s: r[0], e: r[1] }); }
    } else {
      for (let i = 5; i >= 0; i--) { const d = new Date(S.y, S.m - i, 1), r = periodRange(d.getFullYear(), d.getMonth()); B.push({ l: MONTHS[d.getMonth()].slice(0, 3), s: r[0], e: r[1] }); }
    }
    const pts = B.map(b => ({ l: b.l, v: inRange(D.tx, b.s, b.e).filter(t => t.type === S.statsType).reduce((a, t) => a + t.amount, 0) }));
    const n = pts.length, max = Math.max(...pts.map(p => p.v), 1), W = 340, H = 160;
    const bw = n === 12 ? 18 : n === 8 ? 26 : 32, gap = (W - n * bw) / (n + 1);
    const col = S.statsType === 'expense' ? 'var(--exp)' : 'var(--inc)';
    const bars = pts.map((p, i) => {
      const x = gap + i * (bw + gap), h = Math.max(p.v / max * (H - 44), p.v ? 2 : 0), y = H - 22 - h;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" style="fill:${col}" opacity="${i === n - 1 && S.period !== 'year' ? 1 : .55}"/>
        <text x="${x + bw / 2}" y="${H - 7}" text-anchor="middle" class="svgt">${p.l}</text>
        ${p.v ? `<text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" class="svgv">${nfc.format(p.v)}</text>` : ''}`;
    }).join('');
    const title = { week: 'Son 8 hafta', month: 'Son 6 ay', year: `${S.y} aylık` }[S.period];
    return `<div class="card"><div class="ctitle">${title} ${S.statsType === 'expense' ? 'gider' : 'gelir'}</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%">${bars}</svg></div>`;
  }

  const bar = (v, max) => {
    const p = max > 0 ? Math.min(100, v / max * 100) : 0;
    return `<div class="barbg"><div class="barfg ${v > max ? 'over' : p >= 80 ? 'warn' : ''}" style="width:${p}%"></div></div>`;
  };
  function budgetView() {
    const spent = {};
    for (const t of txMonth(S.y, S.m)) if (t.type === 'expense') spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount;
    const cats = D.categories.expense.filter(c => D.budgets[c.id] > 0);
    if (!cats.length) return empty('Henüz bütçe yok', 'Kategorilere aylık limit koyarak harcamalarını kontrol et', '🎯') +
      `<button class="btn primary wide" data-act="editbudget">Bütçe Belirle</button>`;
    const totB = cats.reduce((a, c) => a + D.budgets[c.id], 0), totS = cats.reduce((a, c) => a + (spent[c.id] || 0), 0);
    const [ps, pe, , PE] = periodRange(S.y, S.m), td = today();
    const isCur = td >= ps && td <= pe;
    const daysLeft = Math.round((PE - parseDate(td)) / 864e5) + 1;
    let h = `<div class="card"><div class="brow"><b>Toplam bütçe</b><b>${moneyC(totB)}</b></div>${bar(totS, totB)}
      <div class="bsub"><span>Harcanan ${money(totS)}</span><span class="${totB - totS < 0 ? 'exp' : ''}">Kalan ${money(totB - totS)}</span></div>
      ${isCur && totB - totS > 0 ? `<div class="bsub" style="margin-top:6px"><span>Günlük harcayabileceğin: <b>${money((totB - totS) / daysLeft)}</b> (${daysLeft} gün)</span></div>` : ''}</div>`;
    for (const c of cats) {
      const b = D.budgets[c.id], s = spent[c.id] || 0;
      h += `<div class="card"><div class="brow"><span class="left"><span>${c.icon}</span><b>${esc(c.name)}</b></span><span>${money(b)}</span></div>${bar(s, b)}
        <div class="bsub"><span>${money(s)} (${Math.round(s / b * 100)}%)</span><span class="${b - s < 0 ? 'exp' : ''}">${b - s < 0 ? 'Aşım ' + money(s - b) : 'Kalan ' + money(b - s)}</span></div></div>`;
    }
    return h + `<button class="btn wide" data-act="editbudget">Bütçeleri Düzenle</button>`;
  }
  function openBudgetEditor() {
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>Aylık Bütçe</b><span class="sp"></span></div>
      <div class="note">Her kategori için aylık limit gir. Boş bırakılanlar bütçeye dahil edilmez.</div>
      <div class="form" style="margin-top:8px">${D.categories.expense.map(c => `<label>${c.icon} ${esc(c.name)}
        <input inputmode="decimal" data-bud="${esc(c.id)}" placeholder="Limit yok" value="${D.budgets[c.id] ? amountToInput(D.budgets[c.id]) : ''}"></label>`).join('')}</div>
      <div class="actions"><button class="btn primary" data-act="savebudget">Kaydet</button></div>`);
  }

  // ===================== Hesaplar sekmesi =====================
  function viewAcc() {
    const list = D.accounts.map(a => ({ a, b: balance(a) }));
    const assets = list.reduce((s, x) => s + (x.b > 0 ? x.b : 0), 0);
    const debts = list.reduce((s, x) => s + (x.b < 0 ? -x.b : 0), 0);
    let h = summaryBar({ inc: assets, exp: debts, tot: assets - debts }, ['Varlıklar', 'Borçlar', 'Net']);
    const groups = [...GROUPS, ...new Set(D.accounts.map(a => a.group).filter(g => !GROUPS.includes(g)))];
    for (const g of groups) {
      const items = list.filter(x => x.a.group === g);
      if (!items.length) continue;
      const gt = items.reduce((s, x) => s + x.b, 0);
      h += `<div class="ghead"><span>${esc(g)}</span><span class="${gt < 0 ? 'exp' : ''}">${money(gt)}</span></div><div class="accbox">` +
        items.map(({ a, b }) => `<div class="acc" data-act="acc" data-v="${a.id}"><div class="ic">${GROUP_ICON[a.group] || '👛'}</div>
          <div class="nm">${esc(a.name)}</div><div class="amt ${b < 0 ? 'exp' : b > 0 ? 'inc' : ''}">${money(b)}</div></div>`).join('') + '</div>';
    }
    if (!D.accounts.length) h += empty('Hesap yok', 'Nakit, banka veya kart hesabı ekle', '👛');
    return h + `<button class="btn primary wide" data-act="acc">+ Hesap Ekle</button>`;
  }
  function openAccount(id) {
    const a = id ? accOf(id) : { name: '', group: 'Banka', initial: 0 };
    const txs = id ? D.tx.filter(t => t.accountId === id || t.toAccountId === id).sort(sortTx).slice(0, 150) : [];
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>${id ? 'Hesap' : 'Yeni Hesap'}</b><span class="sp"></span></div>
      <div class="form">
        <label>Hesap adı<input id="a-name" value="${esc(a.name)}" placeholder="Örn. Ziraat, Bonus Kart"></label>
        <div class="twocol">
          <label>Grup<select id="a-group">${GROUPS.map(g => `<option ${g === a.group ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
          <label>Başlangıç bakiyesi<input id="a-init" inputmode="decimal" value="${amountToInput(a.initial || 0)}"></label>
        </div>
        <div class="note" style="padding:0">${id ? `Güncel bakiye: <b>${moneyC(balance(a))}</b>. ` : ''}Kredi kartı borcu için eksi değer gir (örn. -2500).</div>
      </div>
      <div class="actions">${id ? `<button class="btn danger" data-act="delacc" data-v="${id}">Sil</button>` : ''}<button class="btn primary" data-act="saveacc" data-v="${id || ''}">Kaydet</button></div>
      ${txs.length ? `<div class="ghead"><span>Son işlemler</span><span>${txs.length}</span></div>${dayGroups(txs)}` : ''}`);
  }

  // ===================== Ayarlar sekmesi =====================
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (S.tab === 'more') render(); });
  function viewMore() {
    const st = D.settings;
    const opt = (v, l, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`;
    const days = Array.from({ length: 28 }, (_, i) => opt(i + 1, `Her ayın ${i + 1}. günü`, st.monthStart)).join('');
    return `
      <div class="group"><div class="gh">Genel</div>
        <label class="row"><span>Ay başlangıç günü<small>Maaş günün 15 ise 15 seç</small></span><select data-set="monthStart">${days}</select></label>
        <label class="row">Haftanın ilk günü<select data-set="weekStart">${opt(1, 'Pazartesi', st.weekStart)}${opt(0, 'Pazar', st.weekStart)}</select></label>
        <label class="row">Para birimi simgesi<input data-set="currency" value="${esc(st.currency)}" maxlength="4"></label>
        <label class="row">Tema<select data-set="theme">${opt('auto', 'Sistem', st.theme)}${opt('light', 'Açık', st.theme)}${opt('dark', 'Koyu', st.theme)}</select></label>
      </div>
      <div class="group"><div class="gh">Kategoriler</div>
        <button class="row" data-act="cats" data-v="expense">Gider kategorileri <span class="arrow">${D.categories.expense.length} ›</span></button>
        <button class="row" data-act="cats" data-v="income">Gelir kategorileri <span class="arrow">${D.categories.income.length} ›</span></button>
        <button class="row" data-act="favs">Sık kullanılanlar <span class="arrow">${D.favorites.length} ›</span></button>
      </div>
      <div class="group"><div class="gh">Yedekleme</div>
        <button class="row" data-act="xlsx"><span>📊 Excel olarak indir<small>İşlemler, aylık özet ve hesaplar (.xlsx)</small></span><span class="arrow">›</span></button>
        <button class="row" data-act="export"><span>💾 Tam yedek al<small>Geri yükleme için (.json)</small></span><span class="arrow">›</span></button>
        <button class="row" data-act="import"><span>♻️ Yedekten geri yükle<small>.json yedek dosyasını seç</small></span><span class="arrow">›</span></button>
      </div>
      <div class="group"><div class="gh">Uygulama</div>
        ${installEvt ? '<button class="row" data-act="install">📲 Ana ekrana yükle <span class="arrow">›</span></button>' : ''}
        <div class="row"><span>Toplam işlem</span><span class="muted">${D.tx.length}</span></div>
        <button class="row danger" data-act="wipe">Tüm verileri sil</button>
      </div>
      <div class="ver"><a class="brand" href="https://hexaforge.com.tr/" target="_blank" rel="noopener">⬡ Hexaforge</a> tarafından geliştirildi<br>Hexa Kasa v${VERSION} · Reklamsız · Veriler sadece bu cihazda saklanır.<br>Düzenli yedek almayı unutma!</div>`;
  }

  // ----- Kategori yönetimi -----
  const catRow = c => `<div class="cedit" data-id="${esc(c.id)}">
      <div class="cline">
        <button class="emo" data-act="pickemoji">${esc(c.icon)}</button>
        <input class="cn" value="${esc(c.name)}" placeholder="Kategori adı">
        <button data-act="catup" aria-label="Yukarı taşı">↑</button><button class="del" data-act="catdel" aria-label="Sil">✕</button>
      </div>
      <input class="subs" value="${esc((c.subs || []).map(s => s.name).join(', '))}" placeholder="Alt kategoriler (virgülle ayır, isteğe bağlı)">
    </div>`;
  function openCats(type) {
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>${type === 'expense' ? 'Gider' : 'Gelir'} Kategorileri</b><span class="sp"></span></div>
      <div class="note">Simgeye dokunarak değiştir. Alt kategorileri virgülle ayırarak yaz (örn. Elektrik, Su, Doğalgaz).</div>
      <div id="catlist">${D.categories[type].map(catRow).join('')}</div>
      <button class="btn wide" data-act="catadd">+ Yeni kategori</button>
      <div class="actions"><button class="btn primary" data-act="savecats" data-v="${type}">Kaydet</button></div>`);
  }
  function emojiPicker(target, onPick) {
    document.querySelector('.emopick')?.remove();
    const box = document.createElement('div');
    box.className = 'emopick';
    box.innerHTML = EMOJIS.map(e => `<button type="button">${e}</button>`).join('');
    box.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      ev.stopPropagation(); onPick(b.textContent); box.remove();
    });
    target.after(box);
  }
  function subsFromText(text, old = []) {
    const names = [...new Set(text.split(',').map(s => s.trim()).filter(Boolean))];
    return names.map(n => ({ id: old.find(s => lower(s.name) === lower(n))?.id || uid(), name: n }));
  }

  // ----- Hızlı kategori / alt kategori ekleme (işlem ekranından) -----
  function quickAddCategory() {
    readEditor();
    const name = prompt(`Yeni ${Ed.type === 'income' ? 'gelir' : 'gider'} kategorisinin adı:`);
    if (!name || !name.trim()) return;
    if (D.categories[Ed.type].some(c => lower(c.name) === lower(name.trim()))) { toast('Bu isimde kategori zaten var'); return; }
    const c = { id: uid(), icon: '🏷️', name: name.trim(), subs: [] };
    D.categories[Ed.type].push(c); save();
    Ed.categoryId = c.id; Ed.subId = null;
    drawEditor();
    toast('Kategori eklendi. Simgesini Ayarlar\'dan değiştirebilirsin.');
  }
  function quickAddSub() {
    readEditor();
    const c = findCat(Ed.type, Ed.categoryId); if (!c) return;
    const name = prompt(`"${c.name}" için yeni alt kategori:`);
    if (!name || !name.trim()) return;
    const ex = c.subs.find(s => lower(s.name) === lower(name.trim()));
    const s = ex || { id: uid(), name: name.trim() };
    if (!ex) { c.subs.push(s); save(); }
    Ed.subId = s.id;
    $('#subrow').innerHTML = subChips();
  }

  // ----- Sık kullanılanlar -----
  function openFavs() {
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>Sık Kullanılanlar</b><span class="sp"></span></div>
      <div class="note">İşlem eklerken üstteki ☆ ile kaydettiğin kısayollar. Yeni işlem ekranında tek dokunuşla doldurulur.</div>
      ${D.favorites.length ? `<div class="clist">${D.favorites.map(f => `<div class="crow">
        <span class="ic">${catIcon(f)}</span>
        <span class="nm">${esc(f.name)}<div class="sb">${esc(catLabel(f))} · ${esc(accOf(f.accountId)?.name || '')}</div></span>
        <span class="amt">${f.amount ? money(f.amount) : ''}</span>
        <button class="xbtn" data-act="favdel" data-v="${f.id}" aria-label="Sil">✕</button></div>`).join('')}</div>`
        : empty('Henüz kısayol yok', 'Yeni işlem eklerken sağ üstteki ☆ butonuna bas', '⭐')}`);
  }

  // ===================== İşlem ekleme / düzenleme =====================
  let Ed = null;
  function blankTx(p = {}) {
    const acc = accOf(D.settings.lastAcc) ? D.settings.lastAcc : D.accounts[0]?.id;
    return { id: null, type: p.type || 'expense', date: p.date || today(), amountRaw: '', categoryId: null, subId: null,
      accountId: p.accountId || acc, toAccountId: D.accounts.find(a => a.id !== acc)?.id || acc, note: '' };
  }
  function openEditor(t, preset) {
    if (!D.accounts.length) { toast('Önce Hesaplar sekmesinden bir hesap ekle'); return; }
    Ed = t ? { subId: null, ...t, amountRaw: amountToInput(t.amount) } : blankTx(preset);
    drawEditor();
  }
  function accSelect(id, val) {
    return `<select id="${id}">${D.accounts.map(a => `<option value="${a.id}" ${a.id === val ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`;
  }
  function subChips() {
    const c = findCat(Ed.type, Ed.categoryId);
    if (!c) return '';
    return `<div class="flabel">Alt kategori <span class="muted">(isteğe bağlı)</span></div><div class="chips">${(c.subs || []).map(s =>
      `<button type="button" class="chip ${s.id === Ed.subId ? 'on' : ''}" data-act="esub" data-v="${esc(s.id)}">${esc(s.name)}</button>`).join('')}
      <button type="button" class="chip add" data-act="esubadd">+ Ekle</button></div>`;
  }
  function drawEditor() {
    const e = Ed;
    const notes = [...new Set(D.tx.filter(t => t.note && t.type === e.type).sort(sortTx).map(t => t.note))].slice(0, 40);
    const types = [['income', 'Gelir'], ['expense', 'Gider'], ['transfer', 'Transfer']];
    const favs = !e.id && D.favorites.length ? `<div class="favs">${D.favorites.map(f =>
      `<button class="fav" data-act="efav" data-v="${f.id}"><span>${catIcon(f)}</span><b>${esc(f.name)}</b>${f.amount ? `<small>${money(f.amount)}</small>` : ''}</button>`).join('')}</div>` : '';
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>${e.id ? 'İşlemi Düzenle' : 'Yeni İşlem'}</b>
        <button data-act="favsave" aria-label="Sık kullanılanlara ekle" title="Sık kullanılanlara ekle">☆</button></div>
      <div class="seg3">${types.map(([k, l]) => `<button data-act="etype" data-v="${k}" class="${e.type === k ? 'on ' + k : ''}">${l}</button>`).join('')}</div>
      ${favs}
      <div class="form">
        <label>Tutar<input id="f-amt" inputmode="decimal" placeholder="0,00" value="${esc(e.amountRaw)}" autocomplete="off"></label>
        <div class="twocol">
          <label>Tarih<input type="date" id="f-date" value="${e.date}"></label>
          <label>${e.type === 'transfer' ? 'Kimden' : 'Hesap'}${accSelect('f-acc', e.accountId)}</label>
        </div>
        ${e.type === 'transfer' ? `<label>Kime${accSelect('f-to', e.toAccountId)}</label>`
          : `<div class="flabel">Kategori</div><div class="catgrid">${D.categories[e.type].map(c =>
            `<button type="button" class="cat ${c.id === e.categoryId ? 'on' : ''}" data-act="ecat" data-v="${esc(c.id)}"><span>${c.icon}</span>${esc(c.name)}</button>`).join('')}
            <button type="button" class="cat add" data-act="ecatadd"><span>＋</span>Yeni</button></div>
            <div id="subrow">${subChips()}</div>`}
        <label>Not<input id="f-note" value="${esc(e.note)}" placeholder="İsteğe bağlı (örn. Migros)" list="notelist" autocomplete="off"></label>
        <datalist id="notelist">${notes.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
        ${!e.id ? `<div class="twocol">
          <label>Tekrarla<select id="f-rep"><option value="">Yok</option><option value="w">Her hafta</option><option value="m">Her ay</option><option value="y">Her yıl</option></select></label>
          <label id="repn-wrap" style="visibility:hidden">Kaç kez<input id="f-repn" type="number" min="2" max="120" value="12"></label></div>` : ''}
      </div>
      <div class="actions">${e.id
        ? `<button class="btn danger" data-act="edel">Sil</button><button class="btn" data-act="ecopy">Kopyala</button>`
        : `<button class="btn" data-act="esave" data-v="more">Kaydet + Yeni</button>`}
        <button class="btn primary" data-act="esave">Kaydet</button></div>`);
  }
  function readEditor() {
    const v = id => document.getElementById(id)?.value;
    Ed.amountRaw = v('f-amt') ?? Ed.amountRaw;
    Ed.date = v('f-date') || Ed.date;
    Ed.accountId = v('f-acc') || Ed.accountId;
    if (Ed.type === 'transfer') Ed.toAccountId = v('f-to') || Ed.toAccountId;
    Ed.note = v('f-note') ?? Ed.note;
    Ed.rep = v('f-rep') || '';
    Ed.repn = +v('f-repn') || 1;
  }
  function shiftDate(dateStr, rep, k) {
    const d = parseDate(dateStr);
    if (rep === 'w') return ymd(addDays(d, 7 * k));
    const y = d.getFullYear() + (rep === 'y' ? k : 0), m = d.getMonth() + (rep === 'm' ? k : 0);
    const last = new Date(y, m + 1, 0).getDate();
    return ymd(new Date(y, m, Math.min(d.getDate(), last)));
  }
  function saveEditor(more) {
    readEditor();
    const amt = parseAmount(Ed.amountRaw);
    if (!(amt > 0)) { toast('Geçerli bir tutar gir'); $('#f-amt')?.focus(); return; }
    if (!Ed.date) { toast('Tarih seç'); return; }
    if (Ed.type !== 'transfer' && !Ed.categoryId) { toast('Bir kategori seç'); return; }
    if (Ed.type === 'transfer' && Ed.accountId === Ed.toAccountId) { toast('Transfer için farklı hesaplar seç'); return; }
    const editing = !!Ed.id, isTr = Ed.type === 'transfer';
    const rec = { id: Ed.id || uid(), type: Ed.type, date: Ed.date, amount: amt,
      categoryId: isTr ? null : Ed.categoryId, subId: isTr ? null : (Ed.subId || null), accountId: Ed.accountId,
      toAccountId: isTr ? Ed.toAccountId : null, note: (Ed.note || '').trim(), created: Ed.created || Date.now() };
    let count = 1;
    if (editing) {
      const i = D.tx.findIndex(t => t.id === rec.id); if (i >= 0) D.tx[i] = rec; else D.tx.push(rec);
    } else {
      D.tx.push(rec);
      if (Ed.rep) {
        count = Math.min(Math.max(Ed.repn, 2), 120);
        for (let k = 1; k < count; k++) D.tx.push({ ...rec, id: uid(), date: shiftDate(rec.date, Ed.rep, k), created: rec.created + k });
      }
    }
    D.settings.lastAcc = rec.accountId;
    save();
    if (more) {
      toast('Kaydedildi');
      Ed = blankTx({ type: rec.type, date: rec.date, accountId: rec.accountId });
      drawEditor(); render();
      return;
    }
    closeSheet();
    render();
    toast(editing ? 'Güncellendi' : count > 1 ? `${count} işlem eklendi` : 'Kaydedildi');
  }

  // ===================== Arama / detay listeleri =====================
  function openSearch() {
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>İşlem Ara</b><span class="sp"></span></div>
      <div class="searchbox"><input id="s-q" placeholder="Not, kategori, hesap veya tutar..." autocomplete="off"></div>
      <div id="s-res"><div class="sresult">Aramak için yazmaya başla</div></div>`);
    setTimeout(() => $('#s-q')?.focus(), 250);
  }
  function runSearch(q) {
    q = lower(q.trim());
    const box = $('#s-res'); if (!box) return;
    if (!q) { box.innerHTML = '<div class="sresult">Aramak için yazmaya başla</div>'; return; }
    const res = D.tx.filter(t => lower([t.note, catLabel(t), accOf(t.accountId)?.name, accOf(t.toAccountId)?.name, money(t.amount), String(t.amount)].join(' ')).includes(q));
    const s = sums(res);
    box.innerHTML = `<div class="sresult">${res.length} sonuç · Gelir <span class="inc">${money(s.inc)}</span> · Gider <span class="exp">${money(s.exp)}</span></div>` +
      (res.length ? dayGroups(res.slice(0, 300)) : '');
  }
  function openDay(key) {
    const list = D.tx.filter(t => t.date === key), d = parseDate(key), s = sums(list);
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${WDL[d.getDay()]}</b><span class="sp"></span></div>
      ${summaryBar(s)}${list.length ? dayGroups(list) : empty('Bu gün işlem yok', '', '📅')}
      <button class="btn primary wide" data-act="dayadd" data-v="${key}">+ Bu güne işlem ekle</button>`);
  }
  function openCatDetail(cid) {
    const [rs, re] = statsRange();
    const list = inRange(D.tx, rs, re).filter(t => t.type === S.statsType && t.categoryId === cid);
    const c = findCat(S.statsType, cid);
    const total = list.reduce((a, t) => a + t.amount, 0);
    const bySub = {};
    for (const t of list) { const k = subOf(t)?.id || ''; bySub[k] = (bySub[k] || 0) + t.amount; }
    const subRows = Object.entries(bySub).sort((a, b) => b[1] - a[1]);
    const showSubs = subRows.some(([k]) => k);
    const [t1] = topLabel();
    openSheet(`<div class="sheethead"><button data-act="close">✕</button><b>${c?.icon || ''} ${esc(c?.name || 'Kategorisiz')}</b><span class="sp"></span></div>
      <div class="sresult">${t1} · ${list.length} işlem · Toplam <b>${moneyC(total)}</b></div>
      ${showSubs ? `<div class="card">${subRows.map(([k, v]) => `<div class="brow"><span>${esc(k ? c.subs.find(s => s.id === k).name : 'Alt kategorisiz')}</span><span>${money(v)} <span class="muted">(${Math.round(v / total * 100)}%)</span></span></div>${bar(v, total)}`).join('')}</div>` : ''}
      ${dayGroups(list)}`);
  }

  // ===================== Alt sayfa (sheet) =====================
  function openSheet(html) {
    const sh = $('#sheet'), p = $('#sheet .panel');
    const wasOpen = !sh.classList.contains('hidden');
    p.innerHTML = html;
    p.scrollTop = 0;
    if (!wasOpen) { sh.classList.remove('hidden'); history.pushState({ sheet: 1 }, ''); }
  }
  function hideSheet() { $('#sheet').classList.add('hidden'); $('#sheet .panel').innerHTML = ''; }
  function closeSheet() { if (history.state && history.state.sheet) history.back(); else hideSheet(); }
  // Android geri tuşu açık pencereyi kapatsın
  window.addEventListener('popstate', () => { if (!$('#sheet').classList.contains('hidden')) hideSheet(); });

  // ===================== Yedekleme =====================
  function exportJSON() {
    download(`hexa-kasa-yedek-${today()}.json`, JSON.stringify(D, null, 1), 'application/json');
    toast('Yedek indirildi');
  }
  // ----- Excel (.xlsx) dışa aktarma: kütüphanesiz, çevrimdışı çalışır -----
  const CRC_T = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  // Sıkıştırmasız (store) ZIP arşivi oluşturur; .xlsx aslında bir ZIP'tir
  function makeZip(files, type) {
    const enc = new TextEncoder(), parts = [], central = [];
    const now = new Date();
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type });
  }
  const xesc = s => String(s ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const colName = i => { let s = ''; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  const excelDate = s => { const [y, m, d] = s.split('-').map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5; };
  // Hücre: 'metin' | {n: sayı, b: kalın} | {d: 'yyyy-aa-gg'} | {t: 'metin', b: kalın}
  function sheetXml(rows, widths, filter) {
    const cell = (v, ref, header) => {
      if (v == null || v === '') return '';
      if (typeof v === 'object' && 'n' in v) return `<c r="${ref}" s="${v.b ? 4 : 3}"><v>${Math.round(v.n * 100) / 100}</v></c>`;
      if (typeof v === 'object' && 'd' in v) return `<c r="${ref}" s="2"><v>${excelDate(v.d)}</v></c>`;
      const bold = header || (typeof v === 'object' && v.b);
      const txt = typeof v === 'object' ? v.t : v;
      return `<c r="${ref}" t="inlineStr"${bold ? ' s="1"' : ''}><is><t xml:space="preserve">${xesc(txt)}</t></is></c>`;
    };
    const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => cell(v, colName(ci) + (ri + 1), ri === 0)).join('')}</row>`).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
      `<sheetData>${body}</sheetData>` +
      (filter ? `<autoFilter ref="A1:${colName(widths.length - 1)}${rows.length}"/>` : '') + '</worksheet>';
  }
  function exportXLSX() {
    const typeName = { income: 'Gelir', expense: 'Gider', transfer: 'Transfer' };
    const sorted = [...D.tx].sort((a, b) => a.date.localeCompare(b.date) || (a.created || 0) - (b.created || 0));

    // 1) İşlemler
    const txRows = [['Tarih', 'Tür', 'Kategori', 'Alt Kategori', 'Hesap', 'Hedef Hesap', 'Tutar', 'Not']];
    for (const t of sorted) {
      txRows.push([{ d: t.date }, typeName[t.type], t.type === 'transfer' ? '' : (catOf(t)?.name || 'Kategorisiz'), subOf(t)?.name || '',
        accOf(t.accountId)?.name || '', accOf(t.toAccountId)?.name || '', { n: t.amount }, t.note || '']);
    }

    // 2) Aylık özet (ay başlangıç gününe göre)
    const sumRows = [['Dönem', 'Tarih Aralığı', 'Gelir', 'Gider', 'Net']];
    let ti = 0, te = 0;
    if (sorted.length) {
      let p = curPeriod(parseDate(sorted[0].date));
      const last = curPeriod(parseDate(sorted[sorted.length - 1].date));
      for (let guard = 0; guard < 1200; guard++) {
        const [s, e, sd, ed] = periodRange(p.y, p.m), sm = sums(inRange(D.tx, s, e));
        ti += sm.inc; te += sm.exp;
        sumRows.push([`${MONTHS[p.m]} ${p.y}`, `${pad(sd.getDate())}.${pad(sd.getMonth() + 1)}.${sd.getFullYear()} – ${pad(ed.getDate())}.${pad(ed.getMonth() + 1)}.${ed.getFullYear()}`,
          { n: sm.inc }, { n: sm.exp }, { n: sm.tot }]);
        if (p.y === last.y && p.m === last.m) break;
        const nx = new Date(p.y, p.m + 1, 1); p = { y: nx.getFullYear(), m: nx.getMonth() };
      }
    }
    sumRows.push([{ t: 'TOPLAM', b: true }, '', { n: ti, b: true }, { n: te, b: true }, { n: ti - te, b: true }]);

    // 3) Hesaplar
    const accRows = [['Hesap', 'Grup', 'Başlangıç Bakiyesi', 'Güncel Bakiye']];
    let tb = 0;
    for (const a of D.accounts) { const b = balance(a); tb += b; accRows.push([a.name, a.group, { n: +a.initial || 0 }, { n: b }]); }
    accRows.push([{ t: 'TOPLAM', b: true }, '', '', { n: tb, b: true }]);

    const sheets = [
      { name: 'İşlemler', xml: sheetXml(txRows, [12, 10, 18, 16, 16, 16, 14, 30], true) },
      { name: 'Aylık Özet', xml: sheetXml(sumRows, [16, 26, 14, 14, 14]) },
      { name: 'Hesaplar', xml: sheetXml(accRows, [22, 12, 18, 16]) },
    ];
    const NS = 'http://schemas.openxmlformats.org';
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${NS}/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>' },
      { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships"><sheets>` +
        sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' +
        `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'İşlemler'!$A$1:$H$${txRows.length}</definedName></definedNames></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}/package/2006/relationships">` +
        sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFD7F0E6"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
        '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="4" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
      ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })),
    ];
    const blob = makeZip(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    download(`hexa-kasa-${today()}.xlsx`, blob, blob.type);
    toast('Excel dosyası indirildi');
  }
  $('#importfile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      if (!obj || !Array.isArray(obj.tx)) throw new Error('format');
      if (!confirm(`Yedekte ${obj.tx.length} işlem var. Mevcut verilerin yerine geçecek. Devam edilsin mi?`)) return;
      D = normalize(obj); save(); goToday(); render(); toast('Yedek geri yüklendi');
    } catch (err) { toast('Geçersiz yedek dosyası'); }
  });

  // ===================== Olaylar =====================
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v;
    switch (act) {
      case 'tab': S.tab = v; render(); window.scrollTo(0, 0); break;
      case 'prev': shift(-1); break;
      case 'next': shift(1); break;
      case 'thisMonth': goToday(); render(); break;
      case 'sub': S.sub = v; render(); break;
      case 'statsSub': S.statsSub = v; render(); break;
      case 'stype': S.statsType = v; render(); break;
      case 'period': { const o = ['week', 'month', 'year']; setPeriod(o[(o.indexOf(S.period) + 1) % 3]); render(); break; }
      case 'gomonth': S.m = +v; S.sub = 'daily'; render(); break;
      case 'search': openSearch(); break;
      case 'day': openDay(v); break;
      case 'dayadd': openEditor(null, { date: v }); break;
      case 'catdetail': openCatDetail(v); break;
      case 'new': {
        const [s, en] = S.tab === 'stats' && S.statsSub === 'stats' ? statsRange() : S.sub === 'monthly' && S.tab === 'tx' ? yearRange(S.y) : periodRange(S.y, S.m);
        const td = today();
        openEditor(null, { date: td >= s && td <= en ? td : s, type: S.tab === 'stats' ? S.statsType : undefined });
        break;
      }
      case 'edit': { const t = D.tx.find(t => t.id === el.dataset.id); if (t) openEditor(t); break; }
      case 'close': closeSheet(); break;
      case 'etype':
        readEditor(); Ed.type = v;
        if (!findCat(v, Ed.categoryId)) { Ed.categoryId = null; Ed.subId = null; }
        drawEditor(); break;
      case 'ecat':
        if (Ed.categoryId !== v) Ed.subId = null;
        Ed.categoryId = v;
        document.querySelectorAll('.cat').forEach(b => b.classList.toggle('on', b.dataset.v === v));
        $('#subrow').innerHTML = subChips();
        break;
      case 'esub':
        Ed.subId = Ed.subId === v ? null : v;
        $('#subrow').innerHTML = subChips();
        break;
      case 'ecatadd': quickAddCategory(); break;
      case 'esubadd': quickAddSub(); break;
      case 'efav': {
        const f = D.favorites.find(x => x.id === v); if (!f) break;
        readEditor();
        Object.assign(Ed, { type: f.type, categoryId: f.categoryId, subId: f.subId || null, note: f.note || '',
          amountRaw: f.amount ? amountToInput(f.amount) : Ed.amountRaw });
        if (accOf(f.accountId)) Ed.accountId = f.accountId;
        if (f.type === 'transfer' && accOf(f.toAccountId)) Ed.toAccountId = f.toAccountId;
        drawEditor(); toast(`"${f.name}" dolduruldu`);
        break;
      }
      case 'favsave': {
        readEditor();
        if (Ed.type !== 'transfer' && !Ed.categoryId) { toast('Önce bir kategori seç'); break; }
        const amt = parseAmount(Ed.amountRaw);
        const def = (Ed.note || '').trim() || catLabel(Ed);
        const name = prompt('Kısayol adı (tutar boşsa her seferinde girersin):', def);
        if (name === null) break;
        const isTr = Ed.type === 'transfer';
        D.favorites.push({ id: uid(), name: name.trim() || def, type: Ed.type, amount: amt > 0 ? amt : null,
          categoryId: isTr ? null : Ed.categoryId, subId: isTr ? null : (Ed.subId || null), accountId: Ed.accountId,
          toAccountId: isTr ? Ed.toAccountId : null, note: (Ed.note || '').trim() });
        save(); drawEditor(); toast('Sık kullanılanlara eklendi ⭐');
        break;
      }
      case 'favs': openFavs(); break;
      case 'favdel':
        if (confirm('Bu kısayol silinsin mi?')) { D.favorites = D.favorites.filter(f => f.id !== v); save(); openFavs(); }
        break;
      case 'esave': saveEditor(v === 'more'); break;
      case 'edel':
        if (confirm('Bu işlem silinsin mi?')) { D.tx = D.tx.filter(t => t.id !== Ed.id); save(); closeSheet(); render(); toast('Silindi'); }
        break;
      case 'ecopy': readEditor(); Ed = { ...Ed, id: null, created: null, date: today() }; drawEditor(); toast('Kopya oluşturuldu, kaydetmeyi unutma'); break;
      case 'editbudget': openBudgetEditor(); break;
      case 'savebudget': {
        const b = {};
        document.querySelectorAll('[data-bud]').forEach(i => { const n = parseAmount(i.value); if (n > 0) b[i.dataset.bud] = n; });
        D.budgets = b; save(); closeSheet(); render(); toast('Bütçe kaydedildi');
        break;
      }
      case 'acc': openAccount(v); break;
      case 'saveacc': {
        const name = $('#a-name').value.trim();
        if (!name) { toast('Hesap adı gir'); return; }
        const init = $('#a-init').value.trim() === '' ? 0 : parseAmount($('#a-init').value);
        if (isNaN(init)) { toast('Başlangıç bakiyesi geçersiz'); return; }
        const group = $('#a-group').value;
        if (v) Object.assign(accOf(v), { name, group, initial: init });
        else D.accounts.push({ id: uid(), name, group, initial: init });
        save(); closeSheet(); render(); toast('Hesap kaydedildi');
        break;
      }
      case 'delacc': {
        const n = D.tx.filter(t => t.accountId === v || t.toAccountId === v).length;
        if (!confirm(n ? `Bu hesaba ait ${n} işlem de silinecek. Emin misin?` : 'Hesap silinsin mi?')) return;
        D.accounts = D.accounts.filter(a => a.id !== v);
        D.tx = D.tx.filter(t => t.accountId !== v && t.toAccountId !== v);
        save(); closeSheet(); render(); toast('Hesap silindi');
        break;
      }
      case 'cats': openCats(v); break;
      case 'pickemoji': {
        const open = el.parentNode.nextElementSibling?.classList.contains('emopick');
        if (open) { el.parentNode.nextElementSibling.remove(); break; }
        emojiPicker(el.parentNode, em => { el.textContent = em; });
        break;
      }
      case 'catadd': {
        const div = document.createElement('div');
        div.innerHTML = catRow({ id: '', icon: '🏷️', name: '', subs: [] });
        $('#catlist').appendChild(div.firstElementChild);
        $('#catlist').lastElementChild.querySelector('.cn').focus();
        break;
      }
      case 'catup': { const r = el.closest('.cedit'); if (r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling); break; }
      case 'catdel': {
        const r = el.closest('.cedit'), id = r.dataset.id;
        const n = id ? D.tx.filter(t => t.categoryId === id).length : 0;
        if (n && !confirm(`Bu kategori ${n} işlemde kullanılıyor. Silinirse bu işlemler "Kategorisiz" görünür. Devam?`)) return;
        r.remove();
        break;
      }
      case 'savecats': {
        const list = [];
        for (const r of document.querySelectorAll('#catlist .cedit')) {
          const name = r.querySelector('.cn').value.trim();
          if (!name) continue;
          const id = r.dataset.id || uid();
          const old = findCat(v, r.dataset.id)?.subs || [];
          list.push({ id, icon: r.querySelector('.emo').textContent.trim() || '🏷️', name, subs: subsFromText(r.querySelector('.subs').value, old) });
        }
        if (!list.length) { toast('En az bir kategori olmalı'); return; }
        D.categories[v] = list;
        save(); closeSheet(); render(); toast('Kategoriler kaydedildi');
        break;
      }
      case 'export': exportJSON(); break;
      case 'import': $('#importfile').click(); break;
      case 'xlsx': exportXLSX(); break;
      case 'install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; render(); }); } break;
      case 'wipe':
        if (confirm('TÜM işlemler, hesaplar ve ayarlar silinecek. Emin misin?') && confirm('Bu geri alınamaz. Önce yedek almanı öneririm. Yine de silinsin mi?')) {
          D = defaultData(); save(); goToday(); render(); toast('Tüm veriler silindi');
        }
        break;
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.set) {
      const k = t.dataset.set;
      D.settings[k] = (k === 'weekStart' || k === 'monthStart') ? +t.value : t.value;
      save();
      if (k === 'monthStart' || k === 'weekStart') goToday();
      render();
    } else if (t.id === 'f-rep') {
      $('#repn-wrap').style.visibility = t.value ? 'visible' : 'hidden';
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 's-q') runSearch(e.target.value); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && ['f-amt', 'f-note'].includes(e.target.id)) { e.preventDefault(); saveEditor(false); }
    if (e.key === 'Escape' && !$('#sheet').classList.contains('hidden')) closeSheet();
  });

  // Sağa/sola kaydırarak dönem değiştir
  let sx = 0, sy = 0;
  const view = $('#view');
  view.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  view.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50 && (S.tab === 'tx' || S.tab === 'stats')) shift(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Uygulama arka plandan dönünce (gün değişmiş olabilir) yenile
  document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#sheet').classList.contains('hidden')) render(); });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
