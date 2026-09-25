"""Pembaca rekap panen Kadatuan dari Excel.

Dipakai bersama oleh seed.py dan scripts/analyze_by_harvest_date.py agar tidak ada
dua sumber kebenaran untuk angka panen yang sama.
"""

import os

DEFAULT_XLSX = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'seed_data', 'Rekap_Data_Periodik_2025-2026.xlsx',
)
DATE_HEADER = 'hari/tanggal'
STOP_MARKER = 'jumlah'


def read_harvest_events(path=None):
    """[(tanggal, kg, catatan)] dari tabel per-kejadian panen."""
    import openpyxl
    from datetime import datetime

    path = path or DEFAULT_XLSX
    rows = list(openpyxl.load_workbook(path, data_only=True).worksheets[0].iter_rows(values_only=True))

    header_idx = next(
        (i for i, r in enumerate(rows)
         if any(isinstance(c, str) and c.strip().lower() == DATE_HEADER for c in r)),
        None,
    )
    if header_idx is None:
        raise ValueError(f"{path}: kolom '{DATE_HEADER}' tidak ditemukan.")

    events = []
    for r in rows[header_idx + 1:]:
        first = str(r[0]).strip().lower() if r[0] is not None else ''
        if first.startswith(STOP_MARKER):
            break
        tanggal = r[1] if len(r) > 1 else None
        if not isinstance(tanggal, datetime):
            continue
        kg = float(r[2]) if len(r) > 2 and isinstance(r[2], (int, float)) else 0.0
        catatan = str(r[5]).strip() if len(r) > 5 and r[5] else ''
        events.append((tanggal.date(), kg, catatan))

    if not events:
        raise ValueError(f"{path}: tidak ada baris tanggal panen yang terbaca.")
    return events


def monthly_harvest(path=None):
    """[(YYYY-MM, kg)] terurut, hasil agregasi tabel per-kejadian."""
    totals = {}
    for tanggal, kg, _ in read_harvest_events(path):
        totals[f"{tanggal.year:04d}-{tanggal.month:02d}"] = totals.get(
            f"{tanggal.year:04d}-{tanggal.month:02d}", 0.0
        ) + kg
    return [(p, int(round(kg))) for p, kg in sorted(totals.items())]
