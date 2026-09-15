import json
import logging
import numpy as np
from geoalchemy2.functions import ST_AsGeoJSON
from app.db.database import db
from app.db.models import Farm, GisLayer
from app.services.gee_service import GEEService
from app.services.soc_service import SOCService

logger = logging.getLogger(__name__)

class AgronomyPipelineService:
    @staticmethod
    def run_soc_prediction_for_farm(farm_id, period="Q1_2026"):
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

        # Ambil Kumpulan Piksel Spasial dari GEE 
        logger.info(f"Mengambil piksel spasial GEE untuk lahan '{farm.name}' (ID: {farm.id})...")
        pixel_samples, scene_info = GEEService.get_farm_pixel_samples_from_gee(coords, scale=20)
        if not pixel_samples:
            raise ValueError(f"Tidak ada piksel citra satelit yang berhasil diambil untuk area lahan ini.")

        # Inferensi Model ONNX SOC Secara Paralel (Batch)
        logger.info(f"Menjalankan inferensi ANN ONNX untuk {len(pixel_samples)} titik piksel lahan '{farm.name}'...")
        props_list = [p['properties'] for p in pixel_samples]
        soc_service = SOCService()
        predictions = soc_service.predict_soc_batch(props_list)

        # Hapus record SOC lama agar tidak duplikat
        GisLayer.query.filter_by(
            farm_id=farm.id,
            parameter_type='soc',
            period=period
        ).delete()

        # Simpan seluruh titik piksel spasial ke tabel gis_layers
        new_layers = []
        for p, soc_val in zip(pixel_samples, predictions):
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

        db.session.add_all(new_layers)
        db.session.commit()

        # Hitung Statistik Spasial (Mean, Min, Max, Std Dev)
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
            f"Piksel: {len(predictions)}, Mean SOC: {mean_val:.2f}, Min: {min_val:.2f}, Max: {max_val:.2f}, Std: {std_val:.2f}"
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
            "topography_captured": topography_summary,
            "scene_info": scene_info
        }
