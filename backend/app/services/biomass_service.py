import logging
import os

import h5py
import numpy as np

logger = logging.getLogger(__name__)


class BiomassService:
    DATASET_FILE = 'agb_kadatuan_10m.h5'
    UNIT = 'Ton/Ha'
    ANOMALY_THRESH_MG_HA = 10.0

    DEFAULT_CARBON_FACTORS = {'rasio_bgb': 0.26, 'fraksi_karbon': 0.47, 'co2_per_c': 44 / 12}

    _instance = None

    @classmethod
    def carbon_factors(cls):
        """Faktor konversi AGB -> karbon dari metadata dataset (BGB = rasio x AGB)."""
        try:
            meta = cls().meta
        except FileNotFoundError:
            return dict(cls.DEFAULT_CARBON_FACTORS)
        return {k: float(meta.get(k, v)) for k, v in cls.DEFAULT_CARBON_FACTORS.items()}

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def __init__(self, dataset_path=None):
        if self._loaded and dataset_path is None:
            return

        if not dataset_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            default_dir = os.path.join(base_dir, 'ml_models', 'biomass')
            dataset_path = os.getenv('BIOMASS_DATASET', os.path.join(default_dir, self.DATASET_FILE))

        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset biomassa tidak ditemukan di: {dataset_path}")

        self.dataset_path = dataset_path
        self._read(dataset_path)
        self._loaded = True

    def _read(self, path):
        with h5py.File(path, 'r') as f:
            self.meta = {k: self._decode(v) for k, v in f.attrs.items()}
            self.summary = {k: float(v) for k, v in f['ringkasan'].attrs.items()}

            self.plots = [
                {
                    'plot_id': f['aoi/plot_id'][i].decode().strip(),
                    'pj': f['aoi/pj'][i].decode().strip(),
                    'area_ha': float(f['aoi/luas_ha'][i]),
                }
                for i in range(f['aoi/plot_id'].shape[0])
            ]

            cell_plot = np.array([s.decode().strip() for s in f['grid/plot_id'][:]])
            valid_ids = {p['plot_id'] for p in self.plots}
            keep = np.array([pid in valid_ids for pid in cell_plot]) & (f['grid/frac_aoi'][:] > 0)

            self.cells = {
                'plot_id': cell_plot[keep],
                'lat': f['grid/lat'][:][keep].astype(float),
                'lon': f['grid/lon'][:][keep].astype(float),
                'agb': f['prediksi/agb_mg_ha'][:][keep].astype(float),
                'bgb': f['prediksi/bgb_mg_ha'][:][keep].astype(float),
                'biomassa': f['prediksi/biomassa_mg_ha'][:][keep].astype(float),
                'karbon': f['prediksi/karbon_ton_ha'][:][keep].astype(float),
                'co2e': f['prediksi/co2e_ton_ha'][:][keep].astype(float),
                'sd': f['prediksi/sd_agb_mg_ha'][:][keep].astype(float),
                'dalam_aoa': f['prediksi/dalam_aoa'][:][keep].astype(int),
                'ekstrapolasi': f['prediksi/flag_ekstrapolasi'][:][keep].astype(int),
            }
            self.dropped_cells = int((~keep).sum())

        logger.info(
            f"Dataset biomassa dimuat: {len(self.cells['agb'])} sel valid "
            f"({self.dropped_cells} sel di luar AOI dibuang), {len(self.plots)} plot."
        )

    @staticmethod
    def _decode(v):
        if isinstance(v, bytes):
            return v.decode()
        if isinstance(v, np.generic):
            return v.item()
        return v

    def cells_for_plot(self, plot_id):
        mask = self.cells['plot_id'] == plot_id
        return [
            {
                'lat': float(self.cells['lat'][i]),
                'lon': float(self.cells['lon'][i]),
                'agb': float(self.cells['agb'][i]),
                'bgb': float(self.cells['bgb'][i]),
                'biomassa': float(self.cells['biomassa'][i]),
                'karbon': float(self.cells['karbon'][i]),
                'co2e': float(self.cells['co2e'][i]),
                'sd': float(self.cells['sd'][i]),
                'dalam_aoa': bool(self.cells['dalam_aoa'][i]),
                'ekstrapolasi': bool(self.cells['ekstrapolasi'][i]),
            }
            for i in np.flatnonzero(mask)
        ]

    def match_plots_to_farms(self, farms, area_tolerance_ha=0.05):
        mapping = {}
        used = set()

        for plot in self.plots:
            candidates = []
            for farm in farms:
                if farm.id in used or not farm.total_area_ha:
                    continue
                pj_match = plot['pj'].lower() in (farm.name or '').lower()
                area_gap = abs(float(farm.total_area_ha) - plot['area_ha'])
                if pj_match and area_gap <= area_tolerance_ha:
                    candidates.append((area_gap, farm))

            if not candidates:
                raise ValueError(
                    f"Plot {plot['plot_id']} ({plot['pj']}, {plot['area_ha']:.3f} Ha) "
                    f"tidak cocok dengan lahan mana pun. Periksa nama dan luas lahan."
                )
            candidates.sort(key=lambda c: c[0])
            if len(candidates) > 1 and abs(candidates[0][0] - candidates[1][0]) < 1e-6:
                raise ValueError(
                    f"Plot {plot['plot_id']} cocok dengan lebih dari satu lahan pada jarak luas yang sama."
                )

            farm = candidates[0][1]
            mapping[plot['plot_id']] = farm
            used.add(farm.id)

        return mapping

    def provenance(self):
        return (
            f"AGB Kadatuan 10m ({self.meta.get('model', 'RandomForest')}, "
            f"komposit {self.meta.get('jendela_citra', '-')}, "
            f"R2 blok spasial {float(self.meta.get('r2_blok_spasial', 0)):.3f})"
        )
