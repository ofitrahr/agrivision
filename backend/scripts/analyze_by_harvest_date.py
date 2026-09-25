#!/usr/bin/env python
"""Jalankan analisis satelit untuk periode yang punya catatan panen.

Tanggal panen dibaca dari Rekap_Data_Periodik_2025-2026.xlsx, lalu dipetakan ke
periode bulanan karena pipeline observasi bekerja per bulan. Menganalisis persis
bulan-bulan berpanen membuat kalibrasi yield punya pijakan di setiap periode.

  python scripts/analyze_by_harvest_date.py --list
  python scripts/analyze_by_harvest_date.py --dry-run
  python scripts/analyze_by_harvest_date.py --skip-existing
  python scripts/analyze_by_harvest_date.py --periods 2026-03,2026-04
  python scripts/analyze_by_harvest_date.py --farms "Blok 3,Blok 1"
"""

import argparse
import os
import sys
import time
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from app.db.database import db  # noqa: E402
from app.db.models import Farm, GisLayer  # noqa: E402
from app.core.harvest_data import DEFAULT_XLSX as XLSX, read_harvest_events  # noqa: E402
from app.services.agronomy_pipeline_service import AgronomyPipelineService  # noqa: E402



def group_by_period(events):
    periods = OrderedDict()
    for tanggal, kg, catatan in events:
        key = f"{tanggal.year:04d}-{tanggal.month:02d}"
        entry = periods.setdefault(key, {'tanggal': [], 'kg': 0.0, 'catatan': []})
        entry['tanggal'].append(tanggal)
        entry['kg'] += kg
        if catatan:
            entry['catatan'].append(catatan)
    return periods


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--periods', help='Batasi ke periode YYYY-MM tertentu, dipisah koma')
    parser.add_argument('--farms', help='Batasi ke lahan yang namanya memuat teks ini, dipisah koma')
    parser.add_argument('--skip-existing', action='store_true', help='Lewati kombinasi yang sudah punya data')
    parser.add_argument('--dry-run', action='store_true', help='Tampilkan rencana tanpa memanggil GEE')
    parser.add_argument('--list', action='store_true', help='Tampilkan tanggal panen lalu berhenti')
    args = parser.parse_args()

    events = read_harvest_events()
    periods = group_by_period(events)

    print(f"Sumber   : {os.path.basename(XLSX)}")
    total_kg = f"{sum(e[1] for e in events):,.0f}".replace(',', '.')
    print(f"Panen    : {len(events)} kejadian, {total_kg} kg, {events[0][0]} s/d {events[-1][0]}")
    print(f"Periode  : {len(periods)} bulan\n")

    print(f"{'periode':9} {'kg':>7} {'n':>3}  tanggal panen")
    for key, info in periods.items():
        tgl = ', '.join(d.isoformat() for d in info['tanggal'])
        flag = '  [perlu diperiksa]' if info['catatan'] else ''
        print(f"{key:9} {info['kg']:7.0f} {len(info['tanggal']):3}  {tgl}{flag}")

    if args.list:
        return 0

    target_periods = sorted(periods)
    if args.periods:
        wanted = {p.strip() for p in args.periods.split(',') if p.strip()}
        unknown = wanted - set(target_periods)
        if unknown:
            print(f"\nPeriode tanpa catatan panen: {', '.join(sorted(unknown))}")
        target_periods = sorted(wanted & set(target_periods))
        if not target_periods:
            print("Tidak ada periode yang cocok.")
            return 1

    app = create_app()
    with app.app_context():
        farms = Farm.query.order_by(Farm.name).all()
        if args.farms:
            needles = [n.strip().lower() for n in args.farms.split(',') if n.strip()]
            farms = [f for f in farms if any(n in f.name.lower() for n in needles)]
        if not farms:
            print("\nTidak ada lahan yang cocok.")
            return 1

        jobs = [(f, p) for p in target_periods for f in farms]
        if args.skip_existing:
            before = len(jobs)
            jobs = [
                (f, p) for f, p in jobs
                if not db.session.query(
                    GisLayer.query.filter_by(farm_id=f.id, parameter_type='ndvi', period=p).exists()
                ).scalar()
            ]
            print(f"\n--skip-existing: {before - len(jobs)} kombinasi dilewati, {len(jobs)} tersisa.")

        print(f"\nRencana: {len(farms)} lahan x {len(target_periods)} periode = {len(jobs)} analisis")
        if args.dry_run:
            for f, p in jobs:
                print(f"  [DRY RUN] {p}  {f.name}")
            print(f"\n[DRY RUN] {len(jobs)} analisis tidak dijalankan.")
            return 0

        print("Setiap analisis memanggil Earth Engine dan butuh puluhan detik.\n")

        ok, gagal = [], []
        t0 = time.time()
        for i, (farm, period) in enumerate(jobs, start=1):
            label = f"[{i}/{len(jobs)}] {period} {farm.name}"
            try:
                result = AgronomyPipelineService.run_pipeline_for_farm(farm.id, period)
                ok.append((farm.name, period))
                print(f"{label}: OK  {result['pixel_count']} titik, "
                      f"SOC {result['soc_prediction']} Ton C/Ha, "
                      f"NDVI {result['ndvi_prediction']}, "
                      f"yield {result['yield_prediction']} Ton/Ha "
                      f"({result.get('yield_baseline_source', '-')})")
            except Exception as e:
                db.session.rollback()
                gagal.append((farm.name, period, str(e)))
                print(f"{label}: GAGAL  {e}")

        durasi = time.time() - t0
        print(f"\nSelesai dalam {durasi/60:.1f} menit: {len(ok)} berhasil, {len(gagal)} gagal.")
        if gagal:
            print("\nYang gagal:")
            for nama, period, pesan in gagal:
                print(f"  {period} {nama}: {pesan[:160]}")
            print("\nJalankan ulang dengan --skip-existing untuk mencoba yang gagal saja.")
        return 1 if gagal else 0


if __name__ == '__main__':
    sys.exit(main())
