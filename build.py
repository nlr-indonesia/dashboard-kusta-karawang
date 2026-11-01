#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py - Dashboard Program Kusta Karawang
--------------------------------------------
Membaca data dari Google Sheets (atau file ekspor lokal), menghitung SEMUA
agregat yang dibutuhkan dashboard, lalu menulis satu berkas `data.json`.

Yang keluar HANYA angka agregat (jumlah per puskesmas/periode, dsb).
Line-list mentah (data per pasien) TIDAK PERNAH ikut ke data.json, jadi aman
dipasang di web yang bisa diakses umum.

Pakai:
    python build.py                 # tarik dari Google Sheets (SHEET_ID)
    python build.py --local FILE    # baca ekspor gabungan untuk uji coba
    SHEET_ID=xxxx python build.py   # override ID sheet lewat environment
"""

import csv, io, json, os, sys, datetime, urllib.request, urllib.parse

# ---------------------------------------------------------------------------
# Konfigurasi
# ---------------------------------------------------------------------------
SHEET_ID = (os.environ.get("SHEET_ID") or
            "1zXFMeD85PW_giIfOae6W37wcnLR9lRvrbsjhPcI3FUA")
SHEETS = ["register_anonim", "penduduk", "data_indikator",
          "periode", "cek_data", "puskesmas"]

OUT = os.environ.get("OUT", os.path.join(os.path.dirname(__file__), "data.json"))

MONTHS_H1 = {1, 2, 3, 4, 5, 6}
MONTHS_H2 = {7, 8, 9, 10, 11, 12}
PERIOD_MONTHS = {
    "FY": set(range(1, 13)),
    "H1": MONTHS_H1, "H2": MONTHS_H2,
    "Q1": {1, 2, 3}, "Q2": {4, 5, 6}, "Q3": {7, 8, 9}, "Q4": {10, 11, 12},
}

# ---------------------------------------------------------------------------
# Pembacaan data
# ---------------------------------------------------------------------------
def fetch_csv(sheet_name):
    url = ("https://docs.google.com/spreadsheets/d/%s/gviz/tq"
           "?tqx=out:csv&sheet=%s" % (SHEET_ID, urllib.parse.quote(sheet_name)))
    req = urllib.request.Request(url, headers={"User-Agent": "kusta-dashboard"})
    with urllib.request.urlopen(req, timeout=60) as r:
        text = r.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))


def read_remote():
    return {name: fetch_csv(name) for name in SHEETS}


def read_local(path):
    """Baca ekspor gabungan: blok dipisah '## Sheet name: <nama>'."""
    txt = open(path, encoding="utf-8").read()
    blocks, cur, rows = {}, None, []
    for line in txt.splitlines():
        if line.startswith("## Sheet name:"):
            if cur:
                blocks[cur] = rows
            cur = line.split(":", 1)[1].strip()
            rows = []
        elif line.strip():
            rows.append(line)
    if cur:
        blocks[cur] = rows
    return {n: list(csv.DictReader(io.StringIO("\n".join(blocks[n]))))
            for n in blocks}

# ---------------------------------------------------------------------------
# Util
# ---------------------------------------------------------------------------
def inum(x):
    try:
        return int(float(str(x).replace(".", "").replace(",", ".")))
    except Exception:
        return None


def fnum(x):
    try:
        return float(str(x).replace(".", "").replace(",", "."))
    except Exception:
        return 0.0


def latlng(row):
    """Sheet puskesmas menyimpan koordinat '-6.316251,107.315588'."""
    raw = (row.get("koordinat") or "").strip()
    if "," in raw:
        try:
            a, b = raw.split(",")[:2]
            return round(float(a), 6), round(float(b), 6)
        except Exception:
            pass
    return None, None

# ---------------------------------------------------------------------------
# Perhitungan agregat
# ---------------------------------------------------------------------------
def compute(data):
    reg = data.get("register_anonim", [])
    pend = data.get("penduduk", [])
    ind = data.get("data_indikator", [])
    per = data.get("periode", [])
    cek = data.get("cek_data", [])
    pusk = data.get("puskesmas", [])

    # --- meta puskesmas (grup intervensi + koordinat) ---
    pmeta, groups = {}, {}
    for r in pusk:
        name = (r.get("puskesmas") or "").strip()
        if not name:
            continue
        grp = (r.get("program") or "Non-intervensi").strip() or "Non-intervensi"
        lat, lng = latlng(r)
        pmeta[name] = {"name": name, "group": grp, "lat": lat, "lng": lng}
        groups[name] = grp

    def grp_of(name):
        return groups.get(name, "Non-intervensi")

    # --- penduduk per puskesmas per tahun ---
    penduduk = {}
    pop_years = set()
    for r in pend:
        name = (r.get("puskesmas") or "").strip()
        y = str(r.get("tahun") or "").strip()
        n = inum(r.get("jumlah_penduduk"))
        if name and y and n is not None:
            penduduk.setdefault(name, {})[y] = n
            pop_years.add(y)

    # kasus baru saja
    baru = [r for r in reg if (r.get("jenis_kasus") or "").strip() == "Baru"]

    def ym(r):
        y = str(r.get("tahun_reg") or "").strip()
        b = (r.get("bulan_reg") or "").strip()
        m = None
        if len(b) >= 7 and b[4] == "-":
            m = inum(b[5:7])
        if m is None:
            m = inum((r.get("triwulan_reg") or ""))  # fallback kasar
        return y, m

    years = sorted({str(r.get("tahun_reg") or "").strip()
                    for r in reg if str(r.get("tahun_reg") or "").strip()})
    latest_year = years[-1] if years else None

    def is_anak(r):
        return (r.get("kelompok_umur") or "").startswith("Anak")

    def cacat_awal(r):
        return inum(r.get("cacat_awal"))

    # --- kab: per tahun & per bulan (semua kasus baru, tanpa filter periode) ---
    kab_yearly, kab_monthly = {}, {}
    for r in baru:
        y, m = ym(r)
        if not y:
            continue
        ky = kab_yearly.setdefault(y, {"total": 0, "anak": 0, "dewasa": 0})
        ky["total"] += 1
        ky["anak" if is_anak(r) else "dewasa"] += 1
        if m:
            km = kab_monthly.setdefault(y, {})
            cell = km.setdefault(str(m), {"total": 0, "anak": 0})
            cell["total"] += 1
            if is_anak(r):
                cell["anak"] += 1

    # --- pkm: per puskesmas per tahun per periode (baru, anak, disab2) ---
    pkm = {}
    for r in baru:
        y, m = ym(r)
        name = (r.get("puskesmas") or "").strip()
        if not (y and m and name):
            continue
        for pcode, months in PERIOD_MONTHS.items():
            if m in months:
                cell = (pkm.setdefault(y, {}).setdefault(pcode, {})
                        .setdefault(name, {"baru": 0, "anak": 0, "disab2": 0}))
                cell["baru"] += 1
                if is_anak(r):
                    cell["anak"] += 1
                if cacat_awal(r) == 2:
                    cell["disab2"] += 1

    # --- pkm_monthly: per puskesmas per tahun -> 12 bulan ---
    pkm_monthly = {}
    for r in baru:
        y, m = ym(r)
        name = (r.get("puskesmas") or "").strip()
        if not (y and m and name):
            continue
        arr = pkm_monthly.setdefault(y, {}).setdefault(name, [0] * 12)
        if 1 <= m <= 12:
            arr[m - 1] += 1

    # --- char: karakteristik kasus baru per tahun per periode ---
    char = {}
    for r in baru:
        y, m = ym(r)
        if not (y and m):
            continue
        for pcode, months in PERIOD_MONTHS.items():
            if m not in months:
                continue
            c = char.setdefault(y, {}).setdefault(pcode, {
                "L": 0, "P": 0, "MB": 0, "PB": 0,
                "c0": 0, "c1": 0, "c2": 0, "cNA": 0,
                "kontak_jumlah": 0, "kontak_diperiksa": 0})
            sex = (r.get("sex") or "").strip().upper()
            if sex in ("L", "P"):
                c[sex] += 1
            tipe = (r.get("tipe") or "").strip().upper()
            if tipe in ("MB", "PB"):
                c[tipe] += 1
            ca = cacat_awal(r)
            c["c0" if ca == 0 else "c1" if ca == 1 else "c2" if ca == 2
              else "cNA"] += 1
            c["kontak_jumlah"] += fnum(r.get("kontak_jumlah"))
            c["kontak_diperiksa"] += fnum(r.get("kontak_diperiksa"))
    # bulatkan kontak
    for y in char:
        for p in char[y]:
            char[y][p]["kontak_jumlah"] = int(char[y][p]["kontak_jumlah"])
            char[y][p]["kontak_diperiksa"] = int(char[y][p]["kontak_diperiksa"])

    # --- RFT kohort: kasus MB baru pada tahun (Y-2), % status RFT ---
    rft = {}
    for y in years:
        cohort = str(int(y) - 2) if y.isdigit() else None
        entry = {"cohortYear": cohort, "kab": None,
                 "byGroup": {"DESAKU": None, "KOTAKU": None, "Lain": None}}
        if cohort:
            mb = [r for r in baru
                  if (r.get("tipe") or "").strip().upper() == "MB"
                  and str(r.get("tahun_reg") or "").strip() == cohort]
            if mb:
                rftn = sum(1 for r in mb
                           if (r.get("status_akhir") or "").strip() == "RFT")
                entry["kab"] = round(rftn / len(mb) * 100, 1)
                entry["kabN"] = len(mb)
                for gkey, test in (("DESAKU", lambda g: g == "DESAKU"),
                                   ("KOTAKU", lambda g: g == "KOTAKU"),
                                   ("Lain", lambda g: g not in ("DESAKU", "KOTAKU"))):
                    sub = [r for r in mb if test(grp_of((r.get("puskesmas") or "").strip()))]
                    if sub:
                        n = sum(1 for r in sub
                                if (r.get("status_akhir") or "").strip() == "RFT")
                        entry["byGroup"][gkey] = round(n / len(sub) * 100, 1)
        rft[y] = entry

    # --- indikator DESAKU / KOTAKU ---
    def build_indicator(program):
        rows = [r for r in ind if (r.get("program") or "").strip() == program]
        periods = []
        for r in rows:
            p = (r.get("periode") or "").strip()
            if p and p not in periods:
                periods.append(p)
        names = sorted({(r.get("puskesmas") or "").strip()
                        for r in rows if (r.get("puskesmas") or "").strip()})
        # data[period][code] = list sejajar dgn names
        dd = {}
        for p in periods:
            dd[p] = {}
        for r in rows:
            p = (r.get("periode") or "").strip()
            code = (r.get("kode") or "").strip()
            name = (r.get("puskesmas") or "").strip()
            if not (p and code and name):
                continue
            arr = dd[p].setdefault(code, [0] * len(names))
            if name in names:
                arr[names.index(name)] += fnum(r.get("nilai"))
        # bulatkan ke int bila memungkinkan
        for p in dd:
            for code in dd[p]:
                dd[p][code] = [int(v) if abs(v - round(v)) < 1e-9 else round(v, 2)
                               for v in dd[p][code]]
        return {"periods": periods, "names": names, "data": dd}

    indikator = {"DESAKU": build_indicator("DESAKU"),
                 "KOTAKU": build_indicator("KOTAKU")}

    # --- periode meta & cek_data ---
    periode = [{"periode": (r.get("periode") or "").strip(),
                "label": (r.get("label") or "").strip(),
                "tgl_mulai": (r.get("tgl_mulai") or "").strip(),
                "tgl_selesai": (r.get("tgl_selesai") or "").strip(),
                "tahun_program": (r.get("tahun_program") or "").strip(),
                "jenis": (r.get("jenis") or "").strip()}
               for r in per if (r.get("periode") or "").strip()]

    cek_data = [{"jenis_masalah": (r.get("jenis_masalah") or "").strip(),
                 "ref_sumber": (r.get("ref_sumber") or "").strip(),
                 "detail": (r.get("detail") or "").strip()}
                for r in cek if (r.get("jenis_masalah") or "").strip()]

    # --- data terakhir (bulan/tahun registrasi paling baru) ---
    last_m, last_y = 0, 0
    for r in reg:
        y, m = ym(r)
        if y and y.isdigit() and m:
            if int(y) > last_y or (int(y) == last_y and m > last_m):
                last_y, last_m = int(y), m

    meta = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc)
                        .strftime("%Y-%m-%dT%H:%M:%SZ"),
        "data_through": {"year": last_y, "month": last_m} if last_y else None,
        "years": years,
        "latest_year": latest_year,
        "pop_years": sorted(pop_years),
        "n_puskesmas": len(pmeta),
    }

    return {
        "meta": meta,
        "puskesmas": sorted(pmeta.values(), key=lambda d: d["name"]),
        "penduduk": penduduk,
        "kab": {"yearly": kab_yearly, "monthly": kab_monthly},
        "pkm": pkm,
        "pkm_monthly": pkm_monthly,
        "char": char,
        "rft": rft,
        "indikator": indikator,
        "periode": periode,
        "cek_data": cek_data,
    }

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if "--local" in sys.argv:
        path = sys.argv[sys.argv.index("--local") + 1]
        print("Membaca data lokal:", path)
        data = read_local(path)
    else:
        print("Menarik data dari Google Sheets:", SHEET_ID)
        data = read_remote()

    for name in SHEETS:
        print("  %-16s %5d baris" % (name, len(data.get(name, []))))

    out = compute(data)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print("Tersimpan: %s (%.1f KB)" % (OUT, size / 1024))
    print("Data sampai: %s" % out["meta"]["data_through"])


if __name__ == "__main__":
    main()
