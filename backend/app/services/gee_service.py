import base64
import json
import logging
import os

import ee
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


def _sanitize_properties(props):
    return {k: (0.0 if v is None else v) for k, v in (props or {}).items()}


class GEEService:
    _initialized = False

    @classmethod
    def initialize(cls):
        if cls._initialized:
            return True

        from dotenv import dotenv_values
        env_dict = dotenv_values('/app/.env') or dotenv_values(os.path.join(os.path.dirname(__file__), '../../.env'))
        b64_key = env_dict.get("GEE_SERVICE_ACCOUNT_B64") or os.getenv("GEE_SERVICE_ACCOUNT_B64")

        if not b64_key:
            raise ValueError("Environment variable GEE_SERVICE_ACCOUNT_B64 belum diatur di .env")

        try:
            b64_key_stripped = b64_key.strip()
            b64_key_padded = b64_key_stripped + '=' * (-len(b64_key_stripped) % 4)
            sa_info = json.loads(base64.b64decode(b64_key_padded).decode('utf-8'))
            scopes = [
                'https://www.googleapis.com/auth/earthengine',
                'https://www.googleapis.com/auth/cloud-platform'
            ]
            credentials = service_account.Credentials.from_service_account_info(
                sa_info,
                scopes=scopes
            )

            project_id = sa_info.get('project_id', 'potent-odyssey-501602-f4')
            ee.Initialize(credentials=credentials, project=project_id)
            cls._initialized = True
            logger.info(f"Koneksi Google Earth Engine berhasil diinisialisasi (Project: {project_id})")
            return True
        except Exception as e:
            logger.error(f"Gagal inisialisasi GEE: {str(e, encoding='utf-8')}")
            raise

    DEFAULT_12_BANDS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12']

    @classmethod
    def get_sentinel_image(cls, polygon_coords, max_cloud=20, collection='COPERNICUS/S2_SR_HARMONIZED'):
        cls.initialize()
        aoi = ee.Geometry.Polygon(polygon_coords)
        image = (ee.ImageCollection(collection)
                 .filterBounds(aoi)
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud))
                 .sort('system:time_start', False)
                 .first()
                 .clip(aoi))
        return image, aoi

    @classmethod
    def get_image_numpy(cls, polygon_coords, bands=None, scale=10):
        import numpy as np

        if bands is None:
            bands = cls.DEFAULT_12_BANDS

        image, aoi = cls.get_sentinel_image(polygon_coords)

        base_proj = image.select('B4').projection()
        image_uniform = image.select(bands).resample('bilinear').reproject(crs=base_proj, scale=scale)

        pixel_data = image_uniform.sampleRectangle(aoi.bounds()).getInfo()['properties']

        channel_arrays = []
        for b in bands:
            if b in pixel_data:
                channel_arrays.append(np.array(pixel_data[b], dtype=np.float32))
            else:
                raise ValueError(f"Band {b} tidak ditemukan pada citra satelit.")

        image_array = np.stack(channel_arrays, axis=-1)
        return image_array, aoi

    @classmethod
    def get_farm_features_from_gee(cls, polygon_coords, bands=None):
        import math
        cls.initialize()
        aoi = ee.Geometry.Polygon(polygon_coords)

        if bands is None:
            bands = cls.DEFAULT_12_BANDS

        s2_image = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                    .filterBounds(aoi)
                    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                    .sort('system:time_start', False)
                    .first()
                    .clip(aoi)
                    .select(bands))

        # DEM tidak di-clip: kernel 3x3 slope/aspect butuh tetangga di luar AOI
        dem = ee.Image('USGS/SRTMGL1_003')
        elevation = dem.select('elevation')
        slope = ee.Terrain.slope(elevation).rename('slope')
        aspect = ee.Terrain.aspect(elevation).rename('aspect')

        # Kalkulasi Topographic Wetness Index (TWI)
        slope_rad = slope.multiply(3.14159 / 180)
        tan_slope = slope_rad.tan().max(0.001)
        twi = elevation.multiply(0).add(100).divide(tan_slope).log().rename('TWI')

        topo_image = elevation.addBands([slope, aspect, twi])

        # Hitung rata-rata regional
        s2_stats_raw = s2_image.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=aoi, scale=10, maxPixels=1e9
        ).getInfo() or {}

        topo_stats_raw = topo_image.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=aoi, scale=10, maxPixels=1e9
        ).getInfo() or {}

        # Filter jika kosong
        clean_bands = {}
        for k, v in s2_stats_raw.items():
            if v is not None:
                try:
                    f_val = float(v)
                    if not math.isnan(f_val):
                        clean_bands[k] = f_val
                except (ValueError, TypeError):
                    continue

        clean_topo = {}
        for k, v in topo_stats_raw.items():
            if v is not None:
                try:
                    f_val = float(v)
                    if not math.isnan(f_val):
                        clean_topo[k] = f_val
                except (ValueError, TypeError):
                    continue

        return clean_topo, clean_bands

    @classmethod
    def get_farm_pixel_samples_from_gee(cls, polygon_coords, scale=10, max_cloud=20, start_date=None, end_date=None):
        import math
        cls.initialize()
        aoi = ee.Geometry.Polygon(polygon_coords)

        area_m2 = aoi.area().getInfo()
        if area_m2 < 15000:
            scale = max(3, math.floor(math.sqrt(area_m2 / 80)))
            logger.info(f"Lahan sempit ({area_m2/10000:.2f} Ha). Menggunakan micro-scale: {scale}m.")
        # Lahan besar tetap scale native 10m - numPixels di bawah yang membatasi jumlah titik.

        s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                          .filterBounds(aoi)
                          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud)))
        if start_date and end_date:
            s2_collection = s2_collection.filterDate(str(start_date), str(end_date))

        collection_size = s2_collection.size().getInfo()
        if collection_size == 0:
            period_desc = f" pada rentang {start_date} s/d {end_date}" if start_date and end_date else ""
            raise ValueError(
                f"Tidak ditemukan citra Sentinel-2 dengan tutupan awan di bawah {max_cloud}% "
                f"untuk area lahan ini{period_desc}. Coba pilih periode/bulan lain."
            )

        s2_image = s2_collection.sort('system:time_start', False).first()

        scene_info = {
            'scene_id': str(s2_image.get('system:index').getInfo()),
            'date': str(s2_image.date().format('YYYY-MM-dd HH:mm:ss').getInfo()),
            'cloud_percentage': round(float(s2_image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()), 2)
        }

        s2_selected = s2_image.select(cls.DEFAULT_12_BANDS)

        # DEM tidak di-clip: kernel 3x3 slope/aspect butuh tetangga di luar AOI, kalau
        # di-clip seluruh slope/aspect/TWI jadi NULL di lahan sempit dan dropNulls=True
        # membuang semua titik sampelnya.
        dem = ee.Image('USGS/SRTMGL1_003')
        elevation = dem.select('elevation')
        slope = ee.Terrain.slope(elevation).rename('slope')
        aspect = ee.Terrain.aspect(elevation).rename('aspect')
        slope_rad = slope.multiply(3.14159 / 180)
        tan_slope = slope_rad.tan().max(0.001)
        twi = elevation.multiply(0).add(100).divide(tan_slope).log().rename('TWI')

        topo_image = elevation.addBands([slope, aspect, twi])
        combined = s2_selected.addBands(topo_image)

        buf_dist = max(10, int(scale * 1.5))
        buffered_aoi = aoi.buffer(buf_dist)

        MAX_SAMPLE_PIXELS = 4000
        samples_fc = combined.sample(
            region=buffered_aoi, scale=scale, geometries=True,
            numPixels=MAX_SAMPLE_PIXELS, seed=42, dropNulls=True
        )
        feats = samples_fc.getInfo().get('features', [])

        pixel_data = []
        for feat in feats:
            geom = feat.get('geometry', {})
            coords = geom.get('coordinates', [])
            props = feat.get('properties', {})
            if len(coords) >= 2 and props:
                pixel_data.append({
                    'lon': float(coords[0]),
                    'lat': float(coords[1]),
                    'properties': _sanitize_properties(props)
                })

        # Fallback jika lahan terlalu sempit untuk scale 10m sehingga 0 piksel terambil
        if not pixel_data:
            centroid = aoi.centroid()
            sampled_centroid = combined.reduceRegion(reducer=ee.Reducer.mean(), geometry=aoi, scale=scale).getInfo() or {}
            cent_coords = centroid.coordinates().getInfo() or [0.0, 0.0]
            pixel_data.append({
                'lon': float(cent_coords[0]),
                'lat': float(cent_coords[1]),
                'properties': _sanitize_properties(sampled_centroid)
            })

        return pixel_data, scene_info
