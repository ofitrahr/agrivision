import json
import logging
from datetime import timedelta

import numpy as np
from app.core.period_utils import current_period_id, period_date_range
from app.core.spectral_indices import compute_ndvi
from app.db.database import db
from app.db.models import Farm, GisLayer
from app.services.gee_service import GEEService
from app.services.npk_service import NPKService
from app.services.soc_service import SOCService
from geoalchemy2.functions import ST_AsGeoJSON

logger = logging.getLogger(__name__)

class AgronomyPipelineService:
    @staticmethod
    def run_pipeline_for_farm(farm_id, period=None):
        period = period or current_period_id()

        # Cari Lahan di Database
        farm = Farm.query.get(farm_id)
        if not farm:
            raise ValueError(f"Lahan dengan ID {farm_id} tidak ditemukan.")
        if farm.boundary is None:
            raise ValueError(f"Lahan '{farm.name}' belum memiliki koordinat batas (boundary).")

        # Ekstrak Geometri PostGIS menjadi GeoJSON
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if not geojson_str:
            raise ValueError(f"Gagal mengonversi geometri lahan '{farm.name}' ke format GeoJSON.")

        geojson_data = json.loads(geojson_str)
        geom_type = geojson_data.get('type')

        if geom_type == 'Polygon':
            coords = geojson_data['coordinates'][0]
        elif geom_type == 'MultiPolygon':
            coords = geojson_data['coordinates'][0][0]
        else:
            raise ValueError(f"Tipe geometri '{geom_type}' tidak didukung untuk ekstraksi citra satelit.")

        # Rentang tanggal 1 bulan penuh untuk periode ini
        start_date, end_date_inclusive = period_date_range(period)
        end_date_exclusive = end_date_inclusive + timedelta(days=1)  # GEE filterDate() bersifat exclusive di ujung akhir

        # Ambil Kumpulan Piksel Spasial dari GEE
        logger.info(
            f"Mengambil piksel spasial GEE untuk lahan '{farm.name}' (ID: {farm.id}), "
            f"periode {period} ({start_date} s/d {end_date_inclusive})..."
        )
        pixel_samples, scene_info = GEEService.get_farm_pixel_samples_from_gee(
            coords, scale=10, start_date=start_date, end_date=end_date_exclusive
        )
        if not pixel_samples:
            raise ValueError(
                f"Tidak ada piksel citra satelit yang berhasil diambil untuk area lahan ini pada periode {period}."
            )

        # Inferensi Model ONNX SOC Secara Paralel (Batch)
        logger.info(f"Menjalankan inferensi ANN ONNX untuk {len(pixel_samples)} titik piksel lahan '{farm.name}'...")
        props_list = [p['properties'] for p in pixel_samples]
        soc_service = SOCService()
        predictions = soc_service.predict_soc_batch(props_list)

        # Inferensi Model Regresi NPK (Nitrogen, Phosphorus, Potassium) - batch, titik piksel yang sama
        logger.info(f"Menjalankan inferensi regresi NPK untuk {len(pixel_samples)} titik piksel lahan '{farm.name}'...")
        npk_service = NPKService()
        npk_predictions = npk_service.predict_npk_batch(props_list)

        # Hitung NDVI langsung dari band Sentinel-2 (deterministik, tanpa model AI).
        # NDVI adalah rasio band sehingga tidak perlu rescale DN->reflektansi (skala-invarian).
        b4_arr = np.array([float(p.get('B4', 0.0)) for p in props_list], dtype=np.float64)
        b8_arr = np.array([float(p.get('B8', 0.0)) for p in props_list], dtype=np.float64)
        ndvi_arr = compute_ndvi(b8_arr, b4_arr)

        # Catatan: Biomassa (AGB) dan Yield BELUM memiliki model resmi terlatih - jangan
        # simpan estimasi fiktif ke gis_layers. Tunggu model R&D sebelum mengaktifkan lagi.

        # Hapus record layer lama untuk periode ini agar tidak duplikat
        GisLayer.query.filter(
            GisLayer.farm_id == farm.id,
            GisLayer.period == period,
            GisLayer.parameter_type.in_([
                'soc', 'ndvi', 'nitrogen', 'phosphorus', 'potassium', 'soilnpk'
            ])
        ).delete(synchronize_session=False)

        # Simpan seluruh titik piksel spasial ke tabel gis_layers
        new_layers = []
        for p, soc_val, npk_val, ndvi_val in zip(
            pixel_samples, predictions, npk_predictions, ndvi_arr
        ):
            new_layers.append(GisLayer(
                farm_id=farm.id,
                coordinate=f"SRID=4326;POINT({p['lon']} {p['lat']})",
                parameter_type='soc',
                period=period,
                numerical_value=round(soc_val, 3),
                unit="Ton C/Ha",
                is_anomaly=(soc_val < 30.0),
                source="GEE Sentinel-2 + NASA SRTM + ANN ONNX"
            ))

            new_layers.append(GisLayer(
                farm_id=farm.id,
                coordinate=f"SRID=4326;POINT({p['lon']} {p['lat']})",
                parameter_type='ndvi',
                period=period,
                numerical_value=round(float(ndvi_val), 4),
                unit="index",
                is_anomaly=(ndvi_val < 0.40),
                source="GEE Sentinel-2 (NDVI Band Ratio)"
            ))

            n_val, p_val, k_val = npk_val['nitrogen'], npk_val['phosphorus'], npk_val['potassium']
            for nutrient, val in (('nitrogen', n_val), ('phosphorus', p_val), ('potassium', k_val)):
                new_layers.append(GisLayer(
                    farm_id=farm.id,
                    coordinate=f"SRID=4326;POINT({p['lon']} {p['lat']})",
                    parameter_type=nutrient,
                    period=period,
                    numerical_value=round(val, 3),
                    unit=NPKService.UNITS[nutrient],
                    is_anomaly=(val < NPKService.ANOMALY_THRESH[nutrient]),
                    source="GEE Sentinel-2 + Regresi Linear NPK Kadatuan"
                ))

            # Layer komposit 'soilnpk': indikator gabungan (rata-rata sederhana N/P/K per piksel)
            # dipakai untuk ringkasan peta/statistik, BUKAN nilai fisik ternormalisasi satuan
            # (N dalam %, P & K dalam mg/kg berbeda satuan).
            composite_npk = (n_val + p_val + k_val) / 3.0
            new_layers.append(GisLayer(
                farm_id=farm.id,
                coordinate=f"SRID=4326;POINT({p['lon']} {p['lat']})",
                parameter_type='soilnpk',
                period=period,
                numerical_value=round(composite_npk, 3),
                unit="kg NPK/Ha",
                is_anomaly=(composite_npk < 100.0),
                source="GEE Sentinel-2 + Regresi Linear NPK Kadatuan (komposit)"
            ))

        db.session.add_all(new_layers)
        db.session.commit()

        # Statistik Ringkasan NPK
        n_mean = float(np.mean([v['nitrogen'] for v in npk_predictions]))
        p_mean = float(np.mean([v['phosphorus'] for v in npk_predictions]))
        k_mean = float(np.mean([v['potassium'] for v in npk_predictions]))

        # Statistik Ringkasan NDVI
        ndvi_mean = float(np.mean(ndvi_arr))

        # Hitung Statistik Spasial
        mean_val = float(np.mean(predictions))
        min_val = float(np.min(predictions))
        max_val = float(np.max(predictions))
        std_val = float(np.std(predictions)) if len(predictions) > 1 else 0.0

        # Rata-rata Topografi untuk Metadata
        elev_avg = float(np.mean([p['properties'].get('elevation', 0) for p in pixel_samples]))
        slope_avg = float(np.mean([p['properties'].get('slope', 0) for p in pixel_samples]))
        aspect_avg = float(np.mean([p['properties'].get('aspect', 0) for p in pixel_samples]))
        twi_avg = float(np.mean([p['properties'].get('TWI', 0) for p in pixel_samples]))

        topography_summary = {
            "elevation": round(elev_avg, 1),
            "slope": round(slope_avg, 1),
            "aspect": round(aspect_avg, 1),
            "TWI": round(twi_avg, 2)
        }

        logger.info(
            f"Analisis spasial lahan '{farm.name}' selesai! "
            f"Piksel: {len(predictions)}, Mean SOC: {mean_val:.2f}, Min: {min_val:.2f}, Max: {max_val:.2f}, Std: {std_val:.2f}, "
            f"Mean NDVI: {ndvi_mean:.2f}, "
            f"Mean N: {n_mean:.2f}%, Mean P: {p_mean:.2f} mg/kg, Mean K: {k_mean:.2f} mg/kg"
        )

        return {
            "success": True,
            "farm_id": str(farm.id),
            "farm_name": farm.name,
            "period": period,
            "soc_prediction": round(mean_val, 2),
            "min_soc": round(min_val, 2),
            "max_soc": round(max_val, 2),
            "std_soc": round(std_val, 2),
            "pixel_count": len(predictions),
            "unit": "Ton C/Ha",
            "is_anomaly": mean_val < 30.0,
            "ndvi_prediction": round(ndvi_mean, 2),
            "biomass_prediction": None,  # Belum ada model resmi
            "yield_prediction": None,    # Belum ada model resmi
            "npk_prediction": {
                "nitrogen": round(n_mean, 2),
                "phosphorus": round(p_mean, 1),
                "potassium": round(k_mean, 1),
                "unit": NPKService.UNITS,
            },
            "topography_captured": topography_summary,
            "scene_info": scene_info
        }
