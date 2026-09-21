import os

import h5py
import numpy as np
from app.core.spectral_indices import compute_ndre, compute_ndvi, compute_ndwi


class NPKService:
    MODEL_FILES = {
        'nitrogen': 'Nitrogen_Model_Kadatuan.h5',
        'phosphorus': 'Phosphorus_Model_Kadatuan.h5',
        'potassium': 'Kalium_Model_Kadatuan.h5',
    }
    UNITS = {
        'nitrogen': '%',
        'phosphorus': 'mg/kg',
        'potassium': 'mg/kg',
    }
    ANOMALY_THRESH = {
        'nitrogen': 15.0,
        'phosphorus': 10.0,
        'potassium': 20.0,
    }

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._loaded = False
            cls._instance = instance
        return cls._instance

    def __init__(self, models_dir=None):
        if self._loaded:
            return

        if not models_dir:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            default_dir = os.path.join(base_dir, "ml_models", "npk")
            models_dir = os.getenv("NPK_MODELS_DIR", default_dir)

        self.models = {}
        for nutrient, filename in self.MODEL_FILES.items():
            path = os.path.join(models_dir, filename)
            if not os.path.exists(path):
                raise FileNotFoundError(
                    f"Model NPK '{nutrient}' tidak ditemukan di: {path}. "
                    f"Pastikan file {filename} sudah tersedia di folder tersebut "
                    f"(atau set environment variable NPK_MODELS_DIR)."
                )
            self.models[nutrient] = self._load_model(path)

        self._loaded = True

    @staticmethod
    def _load_model(path):
        with h5py.File(path, 'r') as f:
            coef = np.array(f['coef'][:], dtype=np.float64)
            intercept = float(np.array(f['intercept'][:]).flatten()[0])
            features = [
                x.decode() if isinstance(x, bytes) else str(x)
                for x in f['features'][:]
            ]
        return {'coef': coef, 'intercept': intercept, 'features': features}

    @staticmethod
    def _compute_feature_matrix(samples_props_list):
        """Rescale band mentah GEE (DN 0-10000) menjadi reflektansi 0.0-1.0,
        lalu hitung indeks spektral NDVI/NDRE/NDWI secara vektor (NumPy).
        """
        def band(name):
            raw = np.array(
                [float(p.get(name, 0.0)) for p in samples_props_list], dtype=np.float64
            )
            return raw / 10000.0

        b3 = band('B3')
        b4 = band('B4')
        b5 = band('B5')
        b8 = band('B8')
        b8a = band('B8A')
        b11 = band('B11')
        b12 = band('B12')

        ndvi = compute_ndvi(b8, b4)
        ndre = compute_ndre(b8a, b5)
        ndwi = compute_ndwi(b3, b8)

        return {
            'B3': b3, 'B4': b4, 'B5': b5, 'B8': b8, 'B8A': b8a, 'B11': b11, 'B12': b12,
            'NDVI': ndvi, 'NDRE': ndre, 'NDWI': ndwi,
        }

    def _predict_one(self, nutrient, feature_matrix):
        model = self.models[nutrient]
        x = np.column_stack([feature_matrix[f] for f in model['features']])
        y = model['intercept'] + x @ model['coef']
        return np.maximum(0.0, y)

    def predict_npk_batch(self, samples_props_list):
        if not samples_props_list:
            return []

        feature_matrix = self._compute_feature_matrix(samples_props_list)

        n_vals = self._predict_one('nitrogen', feature_matrix)
        p_vals = self._predict_one('phosphorus', feature_matrix)
        k_vals = self._predict_one('potassium', feature_matrix)

        return [
            {'nitrogen': float(n), 'phosphorus': float(p), 'potassium': float(k)}
            for n, p, k in zip(n_vals, p_vals, k_vals)
        ]
