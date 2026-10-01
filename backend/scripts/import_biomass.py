#!/usr/bin/env python
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.db.database import db
from app.db.models import Farm, GisLayer
from app.services.biomass_service import BiomassService
from geoalchemy2.functions import ST_AsGeoJSON
from sqlalchemy import insert

PARAMETER_TYPE = 'biomass'


def resolve_periods(farm_ids, requested):
    if requested:
        return sorted({p.strip() for p in requested.split(',') if p.strip()})

    rows = (db.session.query(GisLayer.period)
            .filter(GisLayer.farm_id.in_(farm_ids), GisLayer.parameter_type != PARAMETER_TYPE)
            .distinct().all())
    periods = sorted({r[0] for r in rows if r[0]})
    return periods or ['2026-09']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--periods', help='Daftar periode YYYY-MM dipisah koma')
    parser.add_argument('--only-aoa', action='store_true', help='Buang sel di luar area of applicability')
    parser.add_argument('--dry-run', action='store_true', help='Tampilkan rencana tanpa menulis ke database')
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        service = BiomassService()
        meta, summary = service.meta, service.summary

        print(f"Dataset   : {service.dataset_path}")
        print(f"Judul     : {meta.get('judul')}")
        print(f"Jendela   : {meta.get('jendela_citra', '-')}")
        print(f"Sumber    : {service.provenance()}")
        print(f"Ringkasan : AGB total {summary.get('agb_total_ton', 0):.1f} ton, "
              f"rerata {summary.get('agb_rerata_mg_ha', 0):.2f} Mg/ha, "
              f"{int(summary.get('jumlah_sel', 0))} sel\n")

        farms = Farm.query.all()
        if not farms:
            print("Tidak ada lahan di database. Jalankan seed terlebih dahulu.")
            return 1

        mapping = {}
        print("Pemetaan lahan -> plot survei:")
        for farm in farms:
            geojson = None
            if farm.boundary is not None:
                geojson = json.loads(db.session.scalar(ST_AsGeoJSON(farm.boundary)))
            plot_ids = service.plots_for_farm(farm, geojson)
            if plot_ids:
                mapping[farm] = plot_ids
                print(f"  {farm.name} ({float(farm.total_area_ha or 0):.2f} Ha) -> {', '.join(plot_ids)}")

        if not mapping:
            print("  Tidak ada lahan yang mencakup plot survei. Periksa batas (boundary) lahan Kadatuan.")
            return 1

        periods = resolve_periods([f.id for f in mapping], args.periods)
        print(f"\nPeriode target: {', '.join(periods)}")

        total_written = 0

        for farm, plot_ids in mapping.items():
            rows = service.layer_rows(farm.id, plot_ids, None, only_aoa=args.only_aoa)
            if not rows:
                print(f"  [LEWATI] {farm.name}: tidak ada sel")
                continue

            for period in periods:
                if not args.dry_run:
                    GisLayer.query.filter_by(
                        farm_id=farm.id, parameter_type=PARAMETER_TYPE, period=period
                    ).delete(synchronize_session=False)
                    db.session.execute(insert(GisLayer), [{**row, 'period': period} for row in rows])
                total_written += len(rows)

            mean_agb = sum(row['numerical_value'] for row in rows) / len(rows)
            print(f"  {farm.name}: {len(rows)} sel x {len(periods)} periode, rerata AGB {mean_agb:.2f} Mg/ha")

        if args.dry_run:
            db.session.rollback()
            print(f"\n[DRY RUN] {total_written} baris akan ditulis. Tidak ada perubahan disimpan.")
        else:
            db.session.commit()
            print(f"\nSelesai: {total_written} baris biomassa tertulis.")

    return 0


if __name__ == '__main__':
    sys.exit(main())
