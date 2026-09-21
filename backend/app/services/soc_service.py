import os

import joblib
import numpy as np
import onnxruntime as ort
import pandas as pd

# harusnya bukan per stock tapi gram / kg

class SOCService:
    FEATURE_ORDER = [
        'elevation', 'slope', 'aspect', 'TWI', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12',
        'NDVI', 'SAVI', 'EVI2', 'GNDVI', 'NDMI', 'NDI45', 'MCARI', 'IRECI', 'CMR', 'NDTI', 'BSI', 'SBI'
    ]

    def __init__(self, models_dir=None):
        if not models_dir:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            default_dir = os.path.join(base_dir, "ml_models", "soc")
            models_dir = os.getenv("ML_MODELS_DIR", default_dir)

        onnx_path = os.path.join(models_dir, "best_model_ann.onnx")
        scaler_path = os.path.join(models_dir, "scaler_ann.joblib")

        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Scaler tidak ditemukan di: {scaler_path}")
        if not os.path.exists(onnx_path):
            raise FileNotFoundError(f"Model ONNX tidak ditemukan di: {onnx_path}. Jalankan convert_h5_to_onnx.py terlebih dahulu.")

        self.scaler = joblib.load(scaler_path)
        self.session = ort.InferenceSession(onnx_path)
        self.input_name = self.session.get_inputs()[0].name

    def predict_soc_batch(self, samples_props_list):
        """
        Prediksi nilai SOC untuk batch piksel spasial secara paralel (vektor).
        """
        if not samples_props_list:
            return []

        b2 = np.array([float(p.get('B2', 0.0)) for p in samples_props_list], dtype=np.float32)
        b3 = np.array([float(p.get('B3', 0.0)) for p in samples_props_list], dtype=np.float32)
        b4 = np.array([float(p.get('B4', 0.0)) for p in samples_props_list], dtype=np.float32)
        b5 = np.array([float(p.get('B5', 0.0)) for p in samples_props_list], dtype=np.float32)
        b6 = np.array([float(p.get('B6', 0.0)) for p in samples_props_list], dtype=np.float32)
        b7 = np.array([float(p.get('B7', 0.0)) for p in samples_props_list], dtype=np.float32)
        b8 = np.array([float(p.get('B8', 0.0)) for p in samples_props_list], dtype=np.float32)
        b8a = np.array([float(p.get('B8A', 0.0)) for p in samples_props_list], dtype=np.float32)
        b11 = np.array([float(p.get('B11', 0.0)) for p in samples_props_list], dtype=np.float32)
        b12 = np.array([float(p.get('B12', 0.0)) for p in samples_props_list], dtype=np.float32)

        elev = np.array([float(p.get('elevation', 0.0)) for p in samples_props_list], dtype=np.float32)
        slope = np.array([float(p.get('slope', 0.0)) for p in samples_props_list], dtype=np.float32)
        aspect = np.array([float(p.get('aspect', 0.0)) for p in samples_props_list], dtype=np.float32)
        twi = np.array([float(p.get('TWI', 0.0)) for p in samples_props_list], dtype=np.float32)

        eps = 1e-6
        ndvi = (b8 - b4) / (b8 + b4 + eps)
        savi = ((b8 - b4) / (b8 + b4 + 0.5)) * 1.5
        evi2 = 2.5 * (b8 - b4) / (b8 + 2.4 * b4 + 1.0 + eps)
        gndvi = (b8 - b3) / (b8 + b3 + eps)
        ndmi = (b8 - b11) / (b8 + b11 + eps)
        ndi45 = (b5 - b4) / (b5 + b4 + eps)
        mcari = ((b5 - b4) - 0.2 * (b5 - b3)) * (b5 / (b4 + eps))
        ireci = (b7 - b4) / ((b5 / (b6 + eps)) + eps)
        cmr = b11 / (b12 + eps)
        ndti = (b11 - b12) / (b11 + b12 + eps)
        bsi = ((b11 + b4) - (b8 + b2)) / ((b11 + b4) + (b8 + b2) + eps)
        sbi = (b4 + b3 + b2) / 3.0

        raw_matrix = np.column_stack([
            elev, slope, aspect, twi,
            b2, b3, b4, b5, b6, b7, b8, b8a, b11, b12,
            ndvi, savi, evi2, gndvi, ndmi, ndi45, mcari, ireci, cmr, ndti, bsi, sbi
        ])

        df = pd.DataFrame(raw_matrix, columns=self.FEATURE_ORDER)
        scaled_matrix = self.scaler.transform(df).astype(np.float32)

        outputs = self.session.run(None, {self.input_name: scaled_matrix})
        soc_preds = outputs[0].flatten()
        return [float(max(0.0, val)) for val in soc_preds]

    def predict_soc(self, topo_data, band_data):
        merged = {**topo_data, **band_data}
        preds = self.predict_soc_batch([merged])
        return preds[0] if preds else 0.0
