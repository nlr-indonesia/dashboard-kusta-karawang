/* Dashboard Program Kusta Karawang - logika tampilan.
   Membaca data.json (agregat) dan merender 6 tab. */
'use strict';

/* ---------- util ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const nf = (n) => Number(n || 0).toLocaleString('id-ID');
const nf1 = (n) => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct = (a, b) => (b ? nf1(a / b * 100) + '%' : '-');
const pctn = (a, b) => (b ? a / b * 100 : 0);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const C = { teal: '#0e7c7b', light: '#8cc4c2', orange: '#e0912f', track: '#eef3f2' };

const PERIODS = [
  { code: 'FY', label: 'Setahun (semua bulan)' },
  { code: 'H1', label: 'Januari sampai Juni (semester 1)' },
  { code: 'H2', label: 'Juli sampai Desember (semester 2)' },
  { code: 'Q1', label: 'Triwulan 1 (Jan-Mar)' },
  { code: 'Q2', label: 'Triwulan 2 (Apr-Jun)' },
  { code: 'Q3', label: 'Triwulan 3 (Jul-Sep)' },
  { code: 'Q4', label: 'Triwulan 4 (Okt-Des)' },
];
const PERIOD_MONTHS = {
  FY: [1,2,3,4,5,6,7,8,9,10,11,12], H1: [1,2,3,4,5,6], H2: [7,8,9,10,11,12],
  Q1: [1,2,3], Q2: [4,5,6], Q3: [7,8,9], Q4: [10,11,12],
};

/* ---------- peta label indikator (dari struktur laporan) ---------- */
const IND = {
  DESAKU: {
    full: 'DESAKU (Desa Sahabat Kusta)',
    dasar: [['D01', 'Penduduk puskesmas yang menjalankan Bina Desa Sahabat Kusta'],
            ['D02', 'Penduduk di Desa Sahabat Kusta']],
    dasarDesc: 'Penduduk di wilayah Bina Desa Sahabat Kusta.',
    output: [['D03', 'Desa yang melaksanakan lokakarya'],
             ['D04', 'Anggota kelompok potensial yang ikut lokakarya desa'],
             ['D05', 'Petugas puskesmas yang ikut lokakarya puskesmas']],
    outputDesc: 'Lokakarya di desa dan di puskesmas.',
    funnelTitle: 'Dari suspek sampai kasus baru',
    funnelDesc: 'Dari suspek yang diperiksa sampai kasus baru ditemukan.',
    funnel: [['D08', 'Suspek yang diperiksa petugas kusta puskesmas', 'base'],
             ['D09', 'Kasus baru dari suspek tersebut', 'D08'],
             ['D10', 'Kasus baru yang menolak pengobatan (MDT)', 'thin']],
    outcome: [['D06', 'Petugas puskesmas yang merujuk suspek'],
              ['D07', 'Anggota kelompok potensial yang merujuk suspek'],
              ['D11', 'Kontak yang menolak kemoprofilaksis']],
    impact: [['D12', 'Penolakan sosial karena kusta'],
             ['D13', 'Kasus baru di seluruh Desa Sahabat Kusta'],
             ['D14', 'Kasus baru anak di seluruh Desa Sahabat Kusta'],
             ['D15', 'Kasus baru disabilitas tingkat 2']],
    impactDesc: 'Di seluruh Desa Sahabat Kusta pada periode laporan.',
    cols: [['D02', 'Penduduk desa'], ['D05', 'Petugas ikut lokakarya'],
           ['D04', 'Kelompok ikut lokakarya'], ['D06', 'Petugas merujuk'],
           ['D07', 'Kelompok merujuk'], ['D08', 'Suspek diperiksa'],
           ['D09', 'Kasus baru dari suspek'], ['D13', 'Kasus baru di desa']],
  },
  KOTAKU: {
    full: 'KOTAKU (Kota Sahabat Kusta)',
    dasar: [['K01', 'Penduduk di wilayah padat penduduk (slum area)']],
    dasarDesc: 'Penduduk dan fasilitas kesehatan di wilayah Kota Sahabat Kusta.',
    types: [['DPM', 'K02', 'K05'], ['Klinik (swasta dan perusahaan)', 'K03', 'K06'],
            ['Rumah sakit (umum dan swasta)', 'K04', 'K07']],
    output: [['K08', 'DPM, klinik, dan RS yang ikut lokakarya'],
             ['K09', 'Petugas puskesmas yang ikut lokakarya'],
             ['K10', 'Kader yang ikut orientasi kusta']],
    outputDesc: 'Lokakarya dan orientasi kusta.',
    funnelTitle: 'Rujukan sampai kasus baru',
    funnelDesc: 'Dari pihak yang merujuk, suspek dirujuk, sampai kasus baru ditemukan.',
    funnels: [['Fasilitas kesehatan swasta', 'Fasilitas yang merujuk', 'K11', 'K12', 'K13'],
              ['Petugas puskesmas', 'Petugas yang merujuk', 'K14', 'K15', 'K16'],
              ['Tokoh masyarakat', 'Tokoh yang merujuk', 'K17', 'K18', 'K19']],
    outcome: [['K20', 'Kasus yang ditangani fasilitas swasta'],
              ['K21', 'Pasien dengan komplikasi yang dirujuk']],
    impact: [['K23', 'Kasus baru kusta'], ['K24', 'Kasus baru anak (<15 th)'],
             ['K25', 'Kasus baru disabilitas tingkat 2'], ['K26', 'Penolakan sosial karena kusta']],
    impactDesc: 'Di seluruh Kota Sahabat Kusta pada periode laporan.',
    cols: [['K01', 'Penduduk slum'], ['FAS', 'Faskes swasta'], ['K09', 'Petugas ikut lokakarya'],
           ['K10', 'Kader ikut orientasi'], ['K13', 'Rujukan faskes'], ['K16', 'Rujukan petugas'],
           ['K19', 'Rujukan tokoh'], ['K23', 'Kasus baru']],
  },
};

/* ---------- state ---------- */
let D = null;
const S = { tab: 'ringkasan', year: null, period: 'FY', pkm: null, sort: 'baru',
            sub: 'ringkasan', indProg: 'DESAKU', indPeriod: null, pkmDesa: null };
let _map = null, _mapDesa = null;

const TABS = [
  ['ringkasan', 'Ringkasan'], ['perbandingan', 'Perbandingan puskesmas'],
  ['peta', 'Peta sebaran'], ['perpuskesmas', 'Data per puskesmas'],
  ['eliminasi', 'Status eliminasi'], ['intervensi', 'Puskesmas intervensi'],
];

/* ---------- SVG charts ---------- */
function vbars(items, { h = 230, hiColor = C.orange, color = C.teal } = {}) {
  const n = items.length, step = 100 / n, bw = Math.min(step * 0.55, 11);
  const max = Math.max(1, ...items.map(d => d.value));
  const top = 24, bot = 26, ph = h - top - bot;
  let s = `<div class="chart"><svg viewBox="0 0 100 ${h}" preserveAspectRatio="none" style="height:${h}px">`;
  // reset height scaling: use non-distorting via width 100 units but we want crisp text; use objectBounding
  s = `<div class="chart"><svg viewBox="0 0 ${n * 60} ${h}" style="width:100%;height:${h}px">`;
  const colw = 60;
  items.forEach((d, i) => {
    const bh = d.value / max * ph;
    const x = i * colw + colw / 2;
    const y = top + (ph - bh);
    const col = d.hi ? hiColor : color;
    s += `<rect x="${x - 15}" y="${y}" width="30" height="${Math.max(bh,0)}" rx="3" fill="${col}"/>`;
    s += `<text x="${x}" y="${y - 7}" text-anchor="middle" class="bar-val">${nf(d.value)}</text>`;
    s += `<text x="${x}" y="${h - 8}" text-anchor="middle" class="bar-lbl">${esc(d.label)}</text>`;
  });
  s += '</svg></div>';
  return s;
}

function groupBars(items, series, { h = 240 } = {}) {
  // items:[{label, vals:[a,b]}], series:[{name,color}]
  const n = items.length, colw = 90, gap = 6, bw = 28;
  const max = Math.max(1, ...items.flatMap(d => d.vals));
  const top = 26, bot = 26, ph = h - top - bot;
  let s = `<div class="chart"><svg viewBox="0 0 ${n * colw} ${h}" style="width:100%;height:${h}px">`;
  items.forEach((d, i) => {
    const cx = i * colw + colw / 2;
    d.vals.forEach((v, j) => {
      const bh = v / max * ph;
      const x = cx - bw - gap / 2 + j * (bw + gap);
      const y = top + (ph - bh);
      s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(bh,0)}" rx="3" fill="${series[j].color}"/>`;
      s += `<text x="${x + bw/2}" y="${y - 6}" text-anchor="middle" class="bar-val">${nf(v)}</text>`;
    });
    s += `<text x="${cx}" y="${h - 8}" text-anchor="middle" class="bar-lbl">${esc(d.label)}</text>`;
  });
  s += '</svg></div>';
  return s;
}

function propBar(label, segs, desc) {
  const tot = segs.reduce((a, b) => a + b.v, 0) || 1;
  let bar = segs.map(sg => `<span style="width:${sg.v / tot * 100}%;background:${sg.c}"></span>`).join('');
  return `<div class="prop"><div class="pl">${esc(label)}</div><div class="pbar">${bar}</div>
    <div class="pd">${esc(desc)}</div></div>`;
}

/* ---------- data helpers ---------- */
function allPkmNames() { return D.puskesmas.map(p => p.name); }
function groupOf(name) { const p = D.puskesmas.find(x => x.name === name); return p ? p.group : 'Non-intervensi'; }
function popOf(name, year) {
  const m = D.penduduk[name] || {}; if (m[year] != null) return m[year];
  const ys = Object.keys(m).sort(); return ys.length ? m[ys[ys.length - 1]] : 0;
}
function kabPop(year) { return allPkmNames().reduce((a, n) => a + popOf(n, year), 0); }

function pkmRows(year, period) {
  const src = ((D.pkm[year] || {})[period]) || {};
  return D.puskesmas.map(p => {
    const c = src[p.name] || { baru: 0, anak: 0, disab2: 0 };
    const pop = popOf(p.name, year);
    return { name: p.name, group: p.group, baru: c.baru, anak: c.anak, disab2: c.disab2,
             pop, per100k: pop ? c.baru / pop * 100000 : 0 };
  });
}
function periodTotals(year, period) {
  const rows = pkmRows(year, period);
  return rows.reduce((a, r) => { a.baru += r.baru; a.anak += r.anak; a.disab2 += r.disab2; return a; },
    { baru: 0, anak: 0, disab2: 0 });
}
function charOf(year, period) {
  return ((D.char[year] || {})[period]) ||
    { L: 0, P: 0, MB: 0, PB: 0, c0: 0, c1: 0, c2: 0, cNA: 0, kontak_jumlah: 0, kontak_diperiksa: 0 };
}
function monthsSumKab(year, period, key) {
  const mm = (D.kab.monthly[year]) || {};
  return PERIOD_MONTHS[period].reduce((a, m) => a + (((mm[String(m)]) || {})[key] || 0), 0);
}
function periodLabel(period, year) {
  const base = PERIODS.find(p => p.code === period).label;
  return base;
}

/* ---------- filter builder ---------- */
function fieldSel(label, id, options, val) {
  const opts = options.map(o => `<option value="${esc(o.v)}" ${o.v == val ? 'selected' : ''}>${esc(o.t)}</option>`).join('');
  return `<div class="field"><label>${esc(label)}</label><select id="${id}">${opts}</select></div>`;
}
const yearOpts = () => D.meta.years.map(y => ({ v: y, t: y }));
const periodOpts = () => PERIODS.map(p => ({ v: p.code, t: p.label }));

/* =====================================================================
   TAB: Ringkasan
   ===================================================================== */
function renderRingkasan() {
  const y = S.year, p = S.period;
  const tot = periodTotals(y, p), ch = charOf(y, p);
  const pop = kabPop(y), per100 = pop ? tot.baru / pop * 100000 : 0;
  const totalChar = ch.c0 + ch.c1 + ch.c2 + ch.cNA || tot.baru || 1;
  const anakPct = pctn(tot.anak, tot.baru), disabPct = pctn(ch.c2, totalChar);
  const kontakPct = pctn(ch.kontak_diperiksa, ch.kontak_jumlah);
  const rft = (D.rft[y] || {});
  const rftv = rft.kab;

  const kpis = [
    { lbl: 'Kasus baru', val: nf(tot.baru), sub: nf1(per100) + ' per 100.000 penduduk' },
    { lbl: 'Kasus baru anak (&lt;15 th)', val: nf(tot.anak), sub: nf1(anakPct) + '% dari kasus baru',
      pill: anakPct < 5 ? ['ok', 'Di bawah batas &lt;5%'] : ['warn', 'Di atas batas &lt;5%'] },
    { lbl: 'Disabilitas tingkat 2', val: nf(ch.c2), sub: nf1(disabPct) + '% dari kasus baru',
      pill: disabPct < 5 ? ['ok', 'Di bawah batas &lt;5%'] : ['warn', 'Di atas batas &lt;5%'] },
    { lbl: 'Kontak diperiksa', val: ch.kontak_jumlah ? nf1(kontakPct) + '%' : '-',
      sub: 'Target 80%', pill: kontakPct >= 80 ? ['ok', 'Memenuhi target'] : ['warn', 'Di bawah target'] },
    { lbl: 'Selesai berobat tepat waktu (RFT), kusta MB', val: rftv != null ? nf1(rftv) + '%' : '-',
      sub: rft.cohortYear ? 'Target 90% atau lebih · kohort ' + rft.cohortYear : 'Target 90% atau lebih',
      pill: rftv == null ? null : rftv >= 90 ? ['ok', 'Memenuhi target'] : ['warn', 'Di bawah target'] },
  ];

  // monthly chart
  const mm = (D.kab.monthly[y]) || {};
  const monthItems = PERIOD_MONTHS[p].map(m => ({ label: MONTHS[m - 1], value: ((mm[String(m)]) || {}).total || 0 }));
  const maxM = Math.max(...monthItems.map(d => d.value));
  monthItems.forEach(d => { if (d.value === maxM && maxM > 0 && monthItems.filter(x => x.value === maxM).length === 1) d.hi = true; });
  // yearly chart
  const yearItems = D.meta.years.map(yr => ({ label: yr === D.meta.latest_year ? yr + '*' : yr,
    value: (D.kab.yearly[yr] || {}).total || 0, faint: yr === D.meta.latest_year }));

  // top puskesmas
  const rows = pkmRows(y, p).filter(r => r.baru > 0).sort((a, b) => b.baru - a.baru);
  const top = rows.slice(0, 6), maxTop = Math.max(1, ...top.map(r => r.baru));

  const html = `
    ${filtersRow([fieldSel('Tahun', 'fY', yearOpts(), y), fieldSel('Periode', 'fP', periodOpts(), p)])}
    <div class="cards">${kpis.map(kpiCard).join('')}</div>
    <div class="two" style="margin-bottom:16px">
      <div class="panel"><h3>Kasus baru per bulan, ${y}</h3>
        ${vbars(monthItems)}
        <div class="foot">Batang oranye adalah bulan dengan kasus terbanyak. Lonjakan satu bulan perlu dicek ke puskesmas: apakah ada kegiatan penemuan kasus atau input yang menumpuk.</div>
      </div>
      <div class="panel"><h3>Kasus baru per tahun</h3>
        ${vbars(yearItems.map(d => ({ ...d, hi: false })), {})}
        <div class="foot">* ${D.meta.latest_year} belum tahun penuh (data sampai ${dataThrough()}). Angka tahun lama berasal dari register; kelengkapannya perlu dicek.</div>
      </div>
    </div>
    <div class="two">
      <div class="panel"><h3>Karakteristik kasus baru ${y}</h3>
        ${propBar('Jenis kelamin',
          [{ v: ch.L, c: '#0b4f4e' }, { v: ch.P, c: C.light }],
          `${nf(ch.L)} laki-laki (${pct(ch.L, ch.L + ch.P)}) · ${nf(ch.P)} perempuan (${pct(ch.P, ch.L + ch.P)})`)}
        ${propBar('Tipe kusta',
          [{ v: ch.MB, c: '#0b4f4e' }, { v: ch.PB, c: C.light }],
          `${nf(ch.MB)} multibasiler/MB (${pct(ch.MB, ch.MB + ch.PB)}) · ${nf(ch.PB)} pausibasiler/PB (${pct(ch.PB, ch.MB + ch.PB)})`)}
        ${propBar('Tingkat disabilitas saat ditemukan',
          [{ v: ch.c0, c: '#0b4f4e' }, { v: ch.c1, c: C.light }, { v: ch.c2, c: C.orange }],
          `Tingkat 0: ${nf(ch.c0)} (${pct(ch.c0, totalChar)}) · tingkat 1: ${nf(ch.c1)} (${pct(ch.c1, totalChar)}) · tingkat 2: ${nf(ch.c2)} (${pct(ch.c2, totalChar)})`)}
      </div>
      <div class="panel"><h3>Puskesmas dengan kasus baru terbanyak</h3>
        <div class="hbars">${top.map(r => `
          <div class="hbar"><div class="nm">${esc(r.name)}</div>
            <div class="track"><div class="fill" style="width:${r.baru / maxTop * 100}%"></div></div>
            <div class="num">${nf(r.baru)}</div></div>`).join('')}
        </div>
        <div class="foot"><a href="#" id="goCompare">Lihat semua puskesmas →</a></div>
      </div>
    </div>
    ${srcLine('Batas &lt;5% dan target 80% / 90% mengikuti dashboard program kusta Jawa Timur.')}`;
  $('#view').innerHTML = html;
  bindFilters();
  const gc = $('#goCompare'); if (gc) gc.onclick = (e) => { e.preventDefault(); S.tab = 'perbandingan'; renderTabs(); render(); };
}

function kpiCard(k) {
  return `<div class="card kpi"><div class="lbl">${k.lbl}</div><div class="val">${k.val}</div>
    <div class="sub">${k.sub}</div>${k.pill ? `<span class="pill ${k.pill[0]}">${k.pill[1]}</span>` : ''}</div>`;
}

/* =====================================================================
   TAB: Perbandingan puskesmas
   ===================================================================== */
function renderPerbandingan() {
  const y = S.year, p = S.period;
  let rows = pkmRows(y, p);
  const reporting = rows.filter(r => r.baru > 0).length;
  const anakPkm = rows.filter(r => r.anak > 0).map(r => r.name);
  const sortKey = S.sort;
  rows.sort((a, b) => sortKey === 'nama' ? a.name.localeCompare(b.name) :
    sortKey === 'per100k' ? b.per100k - a.per100k : b[sortKey] - a[sortKey]);
  const shown = rows.slice(0, 15), maxB = Math.max(1, ...rows.map(r => r.baru));

  const html = `
    ${filtersRow([fieldSel('Tahun', 'fY', yearOpts(), y), fieldSel('Periode', 'fP', periodOpts(), p),
      fieldSel('Urutkan menurut', 'fSort', [
        { v: 'baru', t: 'Jumlah kasus baru' }, { v: 'per100k', t: 'Per 100.000 penduduk' },
        { v: 'anak', t: 'Kasus baru anak' }, { v: 'disab2', t: 'Disabilitas tingkat 2' },
        { v: 'nama', t: 'Nama puskesmas' }], S.sort)])}
    <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <div class="card kpi"><div class="lbl">Puskesmas yang melaporkan kasus baru</div>
        <div class="val">${reporting} <span style="font-size:18px;color:var(--muted);font-weight:600">dari ${D.puskesmas.length}</span></div></div>
      <div class="card kpi"><div class="lbl">Puskesmas belum ada kasus baru</div>
        <div class="val">${D.puskesmas.length - reporting}</div></div>
      <div class="card kpi"><div class="lbl">Kasus baru anak (&lt;15 th) ditemukan di ${anakPkm.length} puskesmas</div>
        <div class="sub" style="font-size:14px;color:var(--ink);font-weight:700;margin-top:6px">${anakPkm.length ? esc(anakPkm.join(', ')) : '-'}</div></div>
    </div>
    <div class="panel"><h3>Kasus baru per puskesmas, ${periodLabel(p, y)} ${y}</h3>
      <table><thead><tr><th>Puskesmas</th><th style="text-align:left">Kasus baru</th>
        <th>Penduduk</th><th>Per 100.000*</th><th>Anak</th><th>Disabilitas 2</th></tr></thead>
        <tbody>${shown.map(r => `<tr>
          <td>${esc(r.name)}</td>
          <td><div class="cellbar"><div class="t"><div class="f" style="width:${r.baru / maxB * 100}%"></div></div>
            <b>${nf(r.baru)}</b></div></td>
          <td>${nf(r.pop)}</td><td>${nf1(r.per100k)}</td><td>${nf(r.anak)}</td><td>${nf(r.disab2)}</td>
        </tr>`).join('')}</tbody></table>
      <div class="foot">* Per 100.000 penduduk untuk periode terpilih (belum tentu setahun penuh); angka Karawang ${nf1(pctn(periodTotals(y,p).baru, kabPop(y)) ? periodTotals(y,p).baru/kabPop(y)*100000 : 0)}. Tabel menampilkan 15 teratas dari ${reporting} puskesmas yang melapor. Angka per puskesmas kecil dan mudah naik-turun, jadi baca bersama jumlah aslinya.</div>
    </div>
    ${srcLine()}`;
  $('#view').innerHTML = html;
  bindFilters();
}

/* =====================================================================
   TAB: Peta sebaran
   ===================================================================== */
function renderPeta() {
  const y = S.year, p = S.period;
  const rows = pkmRows(y, p);
  const byName = Object.fromEntries(rows.map(r => [r.name, r]));
  const ranked = rows.filter(r => r.baru > 0).sort((a, b) => b.baru - a.baru);
  const intervBaru = rows.filter(r => r.group !== 'Non-intervensi').reduce((a, r) => a + r.baru, 0);
  const totBaru = rows.reduce((a, r) => a + r.baru, 0);

  const html = `
    <h2 class="page-title">Sebaran kasus baru per puskesmas</h2>
    ${filtersRow([fieldSel('Tahun', 'fY', yearOpts(), y), fieldSel('Periode', 'fP', periodOpts(), p)])}
    <div class="two" style="grid-template-columns:1.6fr 1fr">
      <div class="panel">
        <h3>Kasus baru ${periodLabel(p, y)} ${y}</h3>
        <div class="legend">
          <span><i style="background:${C.teal}"></i>DESAKU</span>
          <span><i style="background:${C.orange}"></i>KOTAKU</span>
          <span><i style="background:#9aa8a6"></i>Puskesmas lain</span>
        </div>
        <div id="map"></div>
        <div class="foot">Makin besar lingkaran, makin banyak kasus baru. Klik lingkaran untuk melihat nama dan jumlahnya. Koordinat dari kolom lintang/bujur di Google Sheets.</div>
      </div>
      <div class="panel"><h3>Puskesmas dengan kasus terbanyak</h3>
        <div class="ranklist">${ranked.slice(0, 10).map((r, i) => `
          <div class="r"><span class="rk">${i + 1}</span>
            <span class="rn">${esc(r.name)} ${grpTag(r.group)}</span>
            <span><b>${nf(r.baru)}</b></span></div>`).join('')}
        </div>
        <div class="foot">${nf(intervBaru)} dari ${nf(totBaru)} kasus baru (${pct(intervBaru, totBaru)}) ada di 20 puskesmas intervensi.</div>
      </div>
    </div>
    ${srcLine(`${ranked.length} dari ${D.puskesmas.length} puskesmas melaporkan kasus baru pada periode ini.`)}`;
  $('#view').innerHTML = html;
  bindFilters();
  drawMap('map', '_map', byName);
}

function grpTag(g) {
  if (g === 'DESAKU') return '<span class="tag d">DESAKU</span>';
  if (g === 'KOTAKU') return '<span class="tag k">KOTAKU</span>';
  return '<span class="tag l">Lain</span>';
}

function drawMap(elId, ref, byName) {
  const pts = D.puskesmas.filter(p => p.lat != null && p.lng != null);
  if (!pts.length) { $('#' + elId).innerHTML = '<div class="loading">Koordinat puskesmas belum tersedia.</div>'; return; }
  if (window[ref]) { window[ref].remove(); window[ref] = null; }
  const map = L.map(elId, { scrollWheelZoom: false }).setView([-6.25, 107.4], 10);
  window[ref] = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 16, attribution: '&copy; OpenStreetMap' }).addTo(map);
  const maxB = Math.max(1, ...pts.map(p => (byName[p.name] || {}).baru || 0));
  const color = g => g === 'DESAKU' ? C.teal : g === 'KOTAKU' ? C.orange : '#9aa8a6';
  const bounds = [];
  pts.forEach(p => {
    const r = byName[p.name] || { baru: 0, anak: 0 };
    const radius = 6 + Math.sqrt((r.baru || 0) / maxB) * 22;
    bounds.push([p.lat, p.lng]);
    L.circleMarker([p.lat, p.lng], { radius, color: '#fff', weight: 1.2,
      fillColor: color(p.group), fillOpacity: r.baru ? 0.82 : 0.35 })
      .bindPopup(`<b>${esc(p.name)}</b><br>${p.group}<br>Kasus baru: <b>${nf(r.baru)}</b><br>Anak: ${nf(r.anak)}`)
      .addTo(map);
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
}

/* =====================================================================
   TAB: Data per puskesmas
   ===================================================================== */
function renderPerPuskesmas() {
  const y = S.year;
  if (!S.pkm) S.pkm = D.puskesmas[0].name;
  const name = S.pkm;
  const rows = pkmRows(y, 'FY'), me = rows.find(r => r.name === name);
  const kabTot = periodTotals(y, 'FY'), kabPer = kabPop(y) ? kabTot.baru / kabPop(y) * 100000 : 0;
  const disabPct = pctn(me.disab2, me.baru);
  const monthly = ((D.pkm_monthly[y]) || {})[name] || Array(12).fill(0);
  const monthItems = monthly.map((v, i) => ({ label: MONTHS[i], value: v }));
  const yearItems = D.meta.years.map(yr => {
    const c = (((D.pkm[yr] || {}).FY) || {})[name] || { baru: 0 };
    return { label: yr === D.meta.latest_year ? yr + '*' : yr, value: c.baru, faint: yr === D.meta.latest_year };
  });

  const kpis = [
    { lbl: 'Jumlah penduduk', val: nf(me.pop), sub: 'Data dasar ' + y },
    { lbl: 'Kasus baru', val: nf(me.baru), sub: 'Seluruh Karawang: ' + nf(kabTot.baru) },
    { lbl: 'Kasus baru per 100.000', val: nf1(me.per100k), sub: 'Seluruh Karawang: ' + nf1(kabPer) },
    { lbl: 'Kasus baru anak (&lt;15 th)', val: nf(me.anak), sub: pct(me.anak, me.baru) + ' dari kasus baru' },
    { lbl: 'Disabilitas tingkat 2', val: nf(me.disab2), sub: nf1(disabPct) + '% dari kasus baru',
      pill: me.baru ? (disabPct < 5 ? ['ok', 'Di bawah batas &lt;5%'] : ['warn', 'Di atas batas &lt;5%']) : null },
  ];

  const html = `
    ${filtersRow([
      fieldSel('Puskesmas', 'fPkm', D.puskesmas.map(p => ({ v: p.name, t: p.name })), name),
      fieldSel('Tahun', 'fY', yearOpts(), y)])}
    <div class="cards">${kpis.map(kpiCard).join('')}</div>
    <div class="two">
      <div class="panel"><h3>Kasus baru per bulan, ${y}</h3>${vbars(monthItems)}</div>
      <div class="panel"><h3>Kasus baru per tahun</h3>${vbars(yearItems, {})}
        <div class="foot">* ${D.meta.latest_year} belum tahun penuh.</div></div>
    </div>
    <div class="note" style="background:#fff;border-color:var(--border);color:var(--muted)">
      Angka per puskesmas kecil, sehingga grafik mudah naik-turun tajam. Baca grafik bersama jumlah aslinya, dan jangan membandingkan persentase antar puskesmas yang kasusnya sedikit.</div>
    ${srcLine()}`;
  $('#view').innerHTML = html;
  bindFilters();
}

/* =====================================================================
   TAB: Status eliminasi
   ===================================================================== */
function renderEliminasi() {
  const years = D.meta.years;
  const anakItems = years.map(yr => ({ label: yr === D.meta.latest_year ? yr + '*' : yr,
    value: (D.kab.yearly[yr] || {}).anak || 0, faint: yr === D.meta.latest_year }));
  // 5-tahun jendela anak (kriteria Fase 1)
  const last5 = years.slice(-5);
  const anak5 = last5.reduce((a, yr) => a + ((D.kab.yearly[yr] || {}).anak || 0), 0);
  // highlight 5 tahun terakhir
  anakItems.forEach(d => { const yy = d.label.replace('*', ''); d.hi = !last5.includes(yy); }); // batang lama = teal muda
  const tableYears = years.slice(-5);

  const phases = [
    ['Fase 1', 'Pemutusan penularan', 'Nol kasus baru anak selama minimal 5 tahun berturut-turut.', true],
    ['Fase 2', 'Eliminasi', 'Nol kasus baru minimal 3 tahun, dan nol kasus baru anak minimal 5 tahun.', false],
    ['Fase 3', 'Surveilans pasca eliminasi', 'Kasus baru hanya sporadis selama 10 tahun atau lebih.', false],
    ['Non-endemik', 'Status akhir', 'Kusta tidak lagi ada secara normal di wilayah ini; kasus sporadis masih mungkin muncul.', false],
  ];

  const html = `
    <h2 class="page-title">Posisi Karawang dalam fase eliminasi kusta</h2>
    <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">
      ${phases.map(ph => `<div class="card phase ${ph[3] ? 'cur' : ''}">
        ${ph[3] ? '<span class="tagp">Posisi Karawang</span>' : ''}
        <h4>${ph[0]}</h4><div class="ph-sub">${ph[1]}</div><p>${ph[2]}</p></div>`).join('')}
    </div>
    <div class="two">
      <div class="panel"><h3>Kasus baru anak (&lt;15 th) per tahun</h3>${vbars(anakItems, { hiColor: C.light })}
        <div class="foot">Batang gelap adalah 5 tahun terakhir yang dinilai (${last5[0]}–${dataThrough()}). Pada periode itu ditemukan ${nf(anak5)} kasus baru anak, jadi syarat Fase 1 (nol kasus baru anak selama 5 tahun) ${anak5 === 0 ? 'terpenuhi' : 'belum terpenuhi'}.</div>
      </div>
      <div class="panel"><h3>Kasus baru anak dan dewasa</h3>
        <table><thead><tr><th>Tahun</th><th>Semua</th><th>Anak</th><th>Dewasa</th></tr></thead>
        <tbody>${tableYears.map(yr => { const c = D.kab.yearly[yr] || { total: 0, anak: 0, dewasa: 0 };
          return `<tr><td><b>${yr === D.meta.latest_year ? yr + '*' : yr}</b></td><td>${nf(c.total)}</td><td>${nf(c.anak)}</td><td>${nf(c.dewasa)}</td></tr>`;
        }).join('')}</tbody></table>
        <div class="foot">* ${D.meta.latest_year} belum tahun penuh.</div>
      </div>
    </div>
    <div class="note"><b>Catatan:</b> halaman ini hanya gambaran dari data register, bukan penetapan status. Penetapan status eliminasi mengikuti penilaian resmi program di tingkat kabupaten.</div>
    ${srcLine('Kriteria fase mengikuti Leprosy Elimination Monitoring Tool (WHO).')}`;
  $('#view').innerHTML = html;
}

/* =====================================================================
   TAB: Puskesmas intervensi (sub-tabs)
   ===================================================================== */
function renderIntervensi() {
  const subs = [['ringkasan', 'Ringkasan intervensi'], ['desaku', 'Indikator DESAKU'],
                ['kotaku', 'Indikator KOTAKU'], ['peta-desa', 'Peta per desa']];
  const head = `
    <h2 class="page-title">Puskesmas intervensi Comprehensive Zero Leprosy</h2>
    <p class="page-desc">20 dari ${D.puskesmas.length} puskesmas di Karawang: 10 puskesmas <b>DESAKU</b> (Desa Sahabat Kusta / Leprosy Friendly Village) dan 10 puskesmas <b>KOTAKU</b> (Kota Sahabat Kusta / Urban Leprosy).</p>
    <div class="subtabs">${subs.map(s => `<button data-sub="${s[0]}" class="${S.sub === s[0] ? 'active' : ''}">${s[1]}</button>`).join('')}</div>
    <div id="subview"></div>`;
  $('#view').innerHTML = head;
  $('#view').querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { S.sub = b.dataset.sub; renderIntervensi(); });
  if (S.sub === 'ringkasan') subRingkasanIntervensi();
  else if (S.sub === 'desaku') subIndicator('DESAKU');
  else if (S.sub === 'kotaku') subIndicator('KOTAKU');
  else subPetaDesa();
}

function subRingkasanIntervensi() {
  const y = S.year, p = S.period;
  const rows = pkmRows(y, p);
  const grpOf = g => rows.filter(r => g === 'Lain' ? r.group === 'Non-intervensi' : r.group === g);
  const agg = set => {
    const pop = set.reduce((a, r) => a + r.pop, 0), baru = set.reduce((a, r) => a + r.baru, 0);
    return { n: set.length, pop, baru, anak: set.reduce((a, r) => a + r.anak, 0),
      disab2: set.reduce((a, r) => a + r.disab2, 0), per100k: pop ? baru / pop * 100000 : 0 };
  };
  const D1 = agg(grpOf('DESAKU')), K1 = agg(grpOf('KOTAKU')), L1 = agg(grpOf('Lain')), ALL = agg(rows);
  const rft = D.rft[y] || { byGroup: {} };
  const cols = [['DESAKU', D1, rft.byGroup.DESAKU], ['KOTAKU', K1, rft.byGroup.KOTAKU],
               ['Puskesmas lain', L1, rft.byGroup.Lain], ['Seluruh Karawang', ALL, rft.kab]];

  const metrics = [
    ['Jumlah penduduk', c => nf(c[1].pop)],
    ['Kasus baru', c => nf(c[1].baru)],
    ['Kasus baru per 100.000 penduduk', c => nf1(c[1].per100k)],
    ['Kasus baru anak (&lt;15 th)', c => nf(c[1].anak)],
    ['Disabilitas tingkat 2', c => nf(c[1].disab2)],
    ['Disabilitas tingkat 2 dari kasus baru', c => pct(c[1].disab2, c[1].baru)],
    ['Selesai berobat tepat waktu (RFT), kusta MB', c => c[2] != null ? nf1(c[2]) + '%' : '-'],
  ];

  // monthly grouped DESAKU vs KOTAKU
  const dNames = new Set(rows.filter(r => r.group === 'DESAKU').map(r => r.name));
  const kNames = new Set(rows.filter(r => r.group === 'KOTAKU').map(r => r.name));
  const mon = (names, m) => Array.from(names).reduce((a, n) => a + (((D.pkm_monthly[y] || {})[n] || [])[m - 1] || 0), 0);
  const monItems = PERIOD_MONTHS[p].map(m => ({ label: MONTHS[m - 1], vals: [mon(dNames, m), mon(kNames, m)] }));

  // per-pkm tables
  const dRows = grpOf('DESAKU').sort((a, b) => b.baru - a.baru);
  const kRows = grpOf('KOTAKU').sort((a, b) => b.baru - a.baru);
  const miniTable = (title, color, set) => {
    const maxB = Math.max(1, ...set.map(r => r.baru));
    return `<div class="panel"><h3 style="color:${color}">10 puskesmas ${title}</h3>
      <div class="foot" style="margin:-8px 0 12px">Kasus baru ${periodLabel(p, y)} ${y}</div>
      <table><thead><tr><th>Puskesmas</th><th style="text-align:left">Kasus baru</th><th>Per 100.000</th><th>Anak</th><th>Disab. 2</th></tr></thead>
      <tbody>${set.map(r => `<tr><td>${esc(r.name)}</td>
        <td><div class="cellbar"><div class="t" style="max-width:120px"><div class="f" style="width:${r.baru / maxB * 100}%;background:${color}"></div></div><b>${nf(r.baru)}</b></div></td>
        <td>${nf1(r.per100k)}</td><td>${nf(r.anak)}</td><td>${nf(r.disab2)}</td></tr>`).join('')}</tbody></table></div>`;
  };

  const html = `
    ${filtersRow([fieldSel('Tahun', 'fY', yearOpts(), y), fieldSel('Periode', 'fP', periodOpts(), p)])}
    <div class="panel" style="margin-bottom:16px"><h3>Perbandingan kelompok puskesmas, ${periodLabel(p, y)} ${y}</h3>
      <table><thead><tr><th>Indikator</th>
        ${cols.map(c => `<th>${c[0]}<br><span style="font-weight:600;color:var(--faint)">(${c[1].n} puskesmas)</span></th>`).join('')}</tr></thead>
        <tbody>${metrics.map(m => `<tr><td>${m[0]}</td>${cols.map(c => `<td><b>${m[1](c)}</b></td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="foot">RFT dihitung untuk kusta MB dari kohort ${rft.cohortYear || '-'} (kasus baru MB ${rft.cohortYear || ''} yang sudah dinilai). Angka per 100.000 untuk periode terpilih.</div>
    </div>
    <div class="panel" style="margin-bottom:16px"><h3>Kasus baru per bulan, ${y}
      <span style="float:right;font-size:13px;font-weight:600"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${C.teal};margin-right:5px"></i>DESAKU
      <i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${C.orange};margin:0 5px 0 12px"></i>KOTAKU</span></h3>
      ${groupBars(monItems, [{ name: 'DESAKU', color: C.teal }, { name: 'KOTAKU', color: C.orange }])}
    </div>
    <div class="two">${miniTable('DESAKU', C.teal, dRows)}${miniTable('KOTAKU', C.orange, kRows)}</div>
    ${srcLine('Data per 100.000 memakai penduduk Data Dasar SIPK; beberapa nilai penduduk yang tertulis sama persis antar puskesmas perlu dicek.')}`;
  $('#subview').innerHTML = html;
  bindFilters();
}

function subIndicator(prog) {
  const cfg = IND[prog], ind = D.indikator[prog];
  if (!ind || !ind.periods.length) { $('#subview').innerHTML = '<div class="panel">Data indikator belum tersedia.</div>'; return; }
  if (!S.indPeriod || !ind.periods.includes(S.indPeriod)) S.indPeriod = ind.periods[ind.periods.length - 1];
  const per = S.indPeriod, other = ind.periods.find(p => p !== per);
  const names = ind.names;
  const arr = (p, code) => (ind.data[p] || {})[code] || names.map(() => 0);
  const sum = (p, code) => arr(p, code).reduce((a, b) => a + b, 0);
  const fasArr = p => names.map((_, i) => ['K02', 'K03', 'K04'].reduce((a, c) => a + (arr(p, c)[i] || 0), 0));
  const sumFas = p => fasArr(p).reduce((a, b) => a + b, 0);
  const getCol = (p, code) => code === 'FAS' ? fasArr(p) : arr(p, code);

  const periodMeta = (D.periode.find(x => x.periode === per) || {});
  const card = (code, label) => `<div class="card"><div class="lbl" style="min-height:40px">${label}</div>
    <div class="val" style="font-size:30px">${nf(sum(per, code))}</div>
    <div class="sub">${other ? other + ': ' + nf(sum(other, code)) : ''}</div></div>`;

  // sections
  let sections = '';
  // data dasar
  sections += `<div class="sec-label">Data dasar</div><div class="sec-desc">${cfg.dasarDesc}</div>
    <div class="cards">${cfg.dasar.map(([c, l]) => card(c, l)).join('')}</div>`;
  if (prog === 'KOTAKU') {
    sections += `<div class="panel" style="margin-bottom:16px"><h3>Fasilitas kesehatan swasta</h3>
      <table><thead><tr><th>Jenis fasilitas</th><th>Jumlah</th><th>Dengan staf terlatih</th></tr></thead>
      <tbody>${cfg.types.map(t => `<tr><td>${esc(t[0])}</td><td>${nf(sum(per, t[1]))}</td><td>${nf(sum(per, t[2]))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  // output
  sections += `<div class="sec-label">Output: kegiatan yang sudah dilakukan</div><div class="sec-desc">${cfg.outputDesc}</div>
    <div class="cards">${cfg.output.map(([c, l]) => card(c, l)).join('')}</div>`;
  // outcome / funnel
  sections += `<div class="sec-label">Outcome: hasil dari kegiatan</div><div class="sec-desc">${cfg.funnelDesc}</div>`;
  if (prog === 'DESAKU') {
    const base = sum(per, 'D08'), baru = sum(per, 'D09'), tol = sum(per, 'D10');
    const steps = [
      { l: 'Suspek yang diperiksa petugas kusta puskesmas', v: base, note: other ? other + ': ' + nf(sum(other, 'D08')) : '', w: 100, c: C.light },
      { l: 'Kasus baru dari suspek tersebut', v: baru, note: pct(baru, base) + ' dari suspek' + (other ? '; ' + other + ': ' + nf(sum(other, 'D09')) : ''), w: Math.max(baru / (base || 1) * 100, 3), c: C.teal },
      { l: 'Kasus baru yang menolak pengobatan (MDT)', v: tol, note: other ? other + ': ' + nf(sum(other, 'D10')) : '', w: 2, c: C.orange },
    ];
    sections += `<div class="two"><div class="panel"><h3>${cfg.funnelTitle}</h3>
      <div class="funnel">${steps.map(s => `<div class="step"><div class="sl"><span>${s.l}</span><span class="sv">${nf(s.v)}</span></div>
        <div class="sb"><span style="width:${s.w}%;background:${s.c}"></span></div>
        <div class="pd" style="color:var(--muted);font-size:12px;margin-top:4px">${s.note}</div></div>`).join('')}</div></div>
      <div class="grid" style="gap:16px">${cfg.outcome.map(([c, l]) => card(c, l)).join('')}</div></div>`;
  } else {
    sections += `<div class="two">${cfg.funnels.map(f => {
      const sen = sum(per, f[2]), sus = sum(per, f[3]), bar = sum(per, f[4]);
      return `<div class="panel"><h3 style="font-size:15px">${f[0]}</h3>
        <div class="funnel">
          <div class="step"><div class="sl"><span>${f[1]}</span><span class="sv">${nf(sen)}</span></div></div>
          <div class="step"><div class="sl"><span>Suspek dirujuk</span><span class="sv">${nf(sus)}</span></div>
            <div class="sb"><span style="width:100%;background:${C.light}"></span></div></div>
          <div class="step"><div class="sl"><span>Kasus baru ditemukan</span><span class="sv">${nf(bar)}</span></div>
            <div class="sb"><span style="width:${Math.max(bar/(sus||1)*100,3)}%;background:${C.teal}"></span></div>
            <div class="pd" style="color:var(--muted);font-size:12px;margin-top:4px">${pct(bar, sus)} dari suspek</div></div>
        </div></div>`;
    }).join('')}</div>
    <div class="cards" style="margin-top:16px">${cfg.outcome.map(([c, l]) => card(c, l)).join('')}</div>`;
  }
  // impact
  sections += `<div class="sec-label">Impact: dampak pada kasus</div><div class="sec-desc">${cfg.impactDesc}</div>
    <div class="cards">${cfg.impact.map(([c, l]) => card(c, l)).join('')}</div>`;

  // per-puskesmas table
  const tableFor = p => {
    const cells = cfg.cols.map(c => getCol(p, c[0]));
    const totals = cfg.cols.map((c, j) => cells[j].reduce((a, b) => a + b, 0));
    return `<table><thead><tr><th>Puskesmas</th>${cfg.cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
      <tbody>${names.map((nm, i) => `<tr><td>${esc(nm)}</td>${cfg.cols.map((c, j) => `<td>${nf(cells[j][i])}</td>`).join('')}</tr>`).join('')}
      <tr class="total"><td>Total</td>${totals.map(t => `<td>${nf(t)}</td>`).join('')}</tr></tbody></table>`;
  };

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <h3 style="font-size:18px">Capaian indikator ${cfg.full}</h3>
      <span class="pill neutral">Data asli dari laporan puskesmas</span></div>
    ${filtersRow([fieldSel('Periode laporan', 'fIndP', ind.periods.map(p => {
      const m = D.periode.find(x => x.periode === p) || {}; return { v: p, t: m.label || p };
    }), per)])}
    ${sections}
    <div class="panel" style="margin-top:16px"><h3>Capaian per puskesmas ${prog}, ${periodMeta.label || per}</h3>${tableFor(per)}</div>
    ${other ? `<div class="panel" style="margin-top:16px"><h3>Capaian per puskesmas ${prog}, ${(D.periode.find(x => x.periode === other) || {}).label || other}</h3>${tableFor(other)}</div>` : ''}
    ${srcLine('Laporan Triwulan Bina Desa/Kota Sahabat Kusta Kabupaten Karawang, diinput oleh tim program. Indikator mengikuti Lampiran 4. Y1 adalah data setahun; triwulan tidak bisa langsung dijumlahkan atau dibandingkan dengan Y1.')}`;
  $('#subview').innerHTML = html;
  const sel = $('#fIndP'); if (sel) sel.onchange = () => { S.indPeriod = sel.value; renderIntervensi(); };
  bindFilters();
}

function subPetaDesa() {
  const y = S.year;
  const interv = D.puskesmas.filter(p => p.group !== 'Non-intervensi');
  if (!S.pkmDesa) S.pkmDesa = interv[0].name;
  const sel = D.puskesmas.find(p => p.name === S.pkmDesa) || interv[0];
  const c = (((D.pkm[y] || {}).FY) || {})[sel.name] || { baru: 0, anak: 0 };

  const html = `
    <div class="note"><b>Peta per desa belum tersedia.</b> Register SIPK saat ini belum memuat kolom desa, jadi kasus belum bisa dipetakan sampai tingkat desa. Untuk mengaktifkan halaman ini, tambahkan kolom <b>desa</b> dan koordinat desa di Google Sheets untuk 20 puskesmas intervensi. Sementara itu, halaman ini menampilkan posisi dan jumlah kasus di tingkat puskesmas.</div>
    ${filtersRow([
      fieldSel('Puskesmas intervensi', 'fDesa', interv.map(p => ({ v: p.name, t: p.name + ' (' + p.group + ')' })), sel.name),
      fieldSel('Tahun', 'fY', yearOpts(), y)])}
    <div class="two" style="grid-template-columns:1.6fr 1fr">
      <div class="panel"><h3>Lokasi Puskesmas ${esc(sel.name)}</h3><div id="map-desa"></div>
        <div class="foot">Peta tingkat puskesmas. Breakdown per desa akan muncul di sini setelah kolom desa ditambahkan ke register.</div></div>
      <div class="panel"><h3>Ringkasan ${esc(sel.name)}</h3>
        <div class="cards" style="grid-template-columns:1fr">
          <div class="card kpi"><div class="lbl">Kelompok intervensi</div><div class="val" style="font-size:24px">${sel.group}</div></div>
          <div class="card kpi"><div class="lbl">Kasus baru ${y}</div><div class="val">${nf(c.baru)}</div></div>
          <div class="card kpi"><div class="lbl">Kasus baru anak (&lt;15 th)</div><div class="val">${nf(c.anak)}</div></div>
        </div>
        <div class="foot">Pada desa dengan 1–2 kasus, pasien bisa dikenali warga. Jika nanti ditampilkan per desa, halaman ini sebaiknya hanya dibuka untuk tim program, tidak dibagikan lewat tautan umum.</div>
      </div>
    </div>
    ${srcLine()}`;
  $('#subview').innerHTML = html;
  const ds = $('#fDesa'); if (ds) ds.onchange = () => { S.pkmDesa = ds.value; renderIntervensi(); };
  bindFilters();
  // mini map single point
  const pts = sel.lat != null ? [sel] : [];
  const byName = { [sel.name]: { baru: c.baru, anak: c.anak } };
  if (pts.length) {
    if (window._mapDesa) { window._mapDesa.remove(); window._mapDesa = null; }
    const map = L.map('map-desa', { scrollWheelZoom: false }).setView([sel.lat, sel.lng], 12);
    window._mapDesa = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 16, attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.circleMarker([sel.lat, sel.lng], { radius: 14, color: '#fff', weight: 1.5,
      fillColor: sel.group === 'DESAKU' ? C.teal : C.orange, fillOpacity: 0.85 })
      .bindPopup(`<b>${esc(sel.name)}</b><br>Kasus baru ${y}: <b>${nf(c.baru)}</b>`).addTo(map).openPopup();
  } else { $('#map-desa').innerHTML = '<div class="loading">Koordinat belum tersedia.</div>'; }
}

/* ---------- shared bits ---------- */
function filtersRow(fields) { return `<div class="filters">${fields.join('')}</div>`; }
function bindFilters() {
  const fY = $('#fY'); if (fY) fY.onchange = () => { S.year = fY.value; render(); };
  const fP = $('#fP'); if (fP) fP.onchange = () => { S.period = fP.value; render(); };
  const fSort = $('#fSort'); if (fSort) fSort.onchange = () => { S.sort = fSort.value; render(); };
  const fPkm = $('#fPkm'); if (fPkm) fPkm.onchange = () => { S.pkm = fPkm.value; render(); };
}
function dataThrough() {
  const dt = D.meta.data_through; if (!dt) return D.meta.latest_year;
  return MONTHS[dt.month - 1] + ' ' + dt.year;
}
function srcLine(extra) {
  return `<div class="src">Sumber: register SIPK Karawang, diolah. Data anonim tanpa nama dan alamat pasien.
    Diperbarui otomatis; pembaruan terakhir ${fmtGen(D.meta.generated_at)}. ${extra || ''}</div>`;
}
function fmtGen(iso) {
  try { const d = new Date(iso); return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'; }
  catch (e) { return iso; }
}

/* ---------- shell ---------- */
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(t => `<button data-tab="${t[0]}" class="${S.tab === t[0] ? 'active' : ''}">${t[1]}</button>`).join('');
  $('#tabs').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    S.tab = b.dataset.tab; renderTabs(); render(); window.scrollTo(0, 0);
  });
}
function render() {
  if (window._map) { window._map.remove(); window._map = null; }
  if (window._mapDesa) { window._mapDesa.remove(); window._mapDesa = null; }
  const fn = { ringkasan: renderRingkasan, perbandingan: renderPerbandingan, peta: renderPeta,
    perpuskesmas: renderPerPuskesmas, eliminasi: renderEliminasi, intervensi: renderIntervensi }[S.tab];
  fn();
}
function headMeta() {
  $('#headMeta').innerHTML = `Data sampai ${dataThrough()}<br><span class="badge-outline badge-live">Diperbarui otomatis</span>`;
}

fetch('data.json', { cache: 'no-store' })
  .then(r => { if (!r.ok) throw new Error('data.json tidak ditemukan'); return r.json(); })
  .then(data => {
    D = data;
    S.year = D.meta.latest_year;
    headMeta(); renderTabs(); render();
  })
  .catch(e => { $('#view').innerHTML = `<div class="loading">Gagal memuat data: ${esc(e.message)}.<br>Pastikan data.json ada di folder yang sama.</div>`; });
