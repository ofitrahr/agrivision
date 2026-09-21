"""Nilai iklim ERA5 cadangan (rerata historis Pangalengan/Bandung).

Dipakai saat koleksi ERA5 belum tersedia untuk periode yang diminta - ERA5-Land
lagging beberapa hari sampai minggu - agar inferensi SOC tidak pernah gagal.
"""

ERA5_DEFAULTS = {
    'surface_net_solar_radiation': 1.4e7,
    'temperature_2m': 291.5,
    'total_precipitation': 0.008,
    'volumetric_soil_water_layer_1': 0.38,
    'temperature_2m_c': 18.35,
}

ERA5_FEATURES = tuple(ERA5_DEFAULTS.keys())
