#!/usr/bin/env python
"""Impor layer biomassa (AGB) Kadatuan ke gis_layers.

Dataset ini hasil prediksi yang sudah jadi untuk satu jendela citra, bukan model
yang bisa dijalankan per periode - jadi diimpor lewat skrip, bukan lewat pipeline
observasi satelit.

  python scripts/import_biomass.py                      # semua periode yang sudah ada di gis_layers
  python scripts/import_biomass.py --periods 2026-06
  python scripts/import_biomass.py --only-aoa           # hanya sel di dalam area of applicability
  python scripts/import_biomass.py --dry-run
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from app.db.database import db  # noqa: E402
from app.db.models import Farm, GisLayer  # noqa: E402
from app.services.biomass_service import BiomassService  # noqa: E402

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
        print(f"Jendela   : {meta.get('jendela_citra')}")
        print(f"Model     : {meta.get('model')}  R2_blok_spasial={float(meta.get('r2_blok_spasial', 0)):.4f}")
        print(f"Ringkasan : AGB total {summary.get('agb_total_ton', 0):.1f} ton, "
              f"rerata {summary.get('agb_rerata_mg_ha', 0):.2f} Mg/ha, "
              f"{int(summary.get('jumlah_sel', 0))} sel\n")

        farms = Farm.query.all()
        if not farms:
            print("Tidak ada lahan di database. Jalankan seed terlebih dahulu.")
            return 1

        mapping = service.match_plots_to_farms(farms)
        print("Pemetaan plot -> lahan:")
        for plot in service.plots:
            farm = mapping[plot['plot_id']]
            print(f"  {plot['plot_id']} ({plot['pj']}, {plot['area_ha']:.3f} Ha) -> "
                  f"{farm.name} ({float(farm.total_area_ha):.2f} Ha)")

        farm_ids = [f.id for f in mapping.values()]
        periods = resolve_periods(farm_ids, args.periods)
        print(f"\nPeriode target: {', '.join(periods)}")

        source = service.provenance()
        total_written = 0

        for plot_id, farm in mapping.items():
            cells = service.cells_for_plot(plot_id)
            if args.only_aoa:
                cells = [c for c in cells if c['dalam_aoa']]
            if not cells:
                print(f"  [LEWATI] {farm.name}: tidak ada sel")
                continue

            for period in periods:
                if not args.dry_run:
                    GisLayer.query.filter_by(
                        farm_id=farm.id, parameter_type=PARAMETER_TYPE, period=period
                    ).delete(synchronize_session=False)

                    db.session.add_all([
                        GisLayer(
                            farm_id=farm.id,
                            coordinate=f"SRID=4326;POINT({c['lon']} {c['lat']})",
                            parameter_type=PARAMETER_TYPE,
                            period=period,
                            numerical_value=round(c['agb'], 3),
                            unit=BiomassService.UNIT,
                            is_anomaly=(c['agb'] < BiomassService.ANOMALY_THRESH_MG_HA),
                            source=source,
                        )
                        for c in cells
                    ])
                total_written += len(cells)

            mean_agb = sum(c['agb'] for c in cells) / len(cells)
            outside = sum(1 for c in cells if not c['dalam_aoa'])
            print(f"  {farm.name}: {len(cells)} sel x {len(periods)} periode, "
                  f"rerata AGB {mean_agb:.2f} Mg/ha, {outside} sel di luar AoA")

        if args.dry_run:
            db.session.rollback()
            print(f"\n[DRY RUN] {total_written} baris akan ditulis. Tidak ada perubahan disimpan.")
        else:
            db.session.commit()
            print(f"\nSelesai: {total_written} baris biomassa tertulis.")

        print(f"Sumber tercatat: {source}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
