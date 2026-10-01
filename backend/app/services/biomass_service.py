import logging
import os

import h5py
import numpy as np

logger = logging.getLogger(__name__)


class BiomassService:
    DATASET_FILE = 'agb_kadatuan_10m_v3.h5'
    UNIT = 'Ton/Ha'
    ANOMALY_THRESH_MG_HA = 10.0

    DEFAULT_CARBON_FACTORS = {'rasio_bgb': 0.26, 'fraksi_karbon': 0.47, 'co2_per_c': 44 / 12}

    _instance = None

    @classmethod
    def carbon_factors(cls):
        try:
            meta = cls().meta
        except (OSError, KeyError, ValueError) as e:
            logger.warning(f"Dataset biomassa tidak bisa dibaca, memakai faktor karbon bawaan: {e}")
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
            pred = f['prediksi']

            self.plots = [
                {
                    'plot_id': f['aoi/plot_id'][i].decode().strip(),
                    'pj': f['aoi/pj'][i].decode().strip(),
                    'area_ha': float(f['aoi/luas_ha'][i]),
                }
                for i in range(f['aoi/plot_id'].shape[0])
            ]

            cell_plot = np.array([self._decode(s).strip() for s in f['grid/plot_id'][:]])
            valid_ids = {p['plot_id'] for p in self.plots}
            keep = np.array([pid in valid_ids for pid in cell_plot]) & (f['grid/frac_aoi'][:] > 0)
            n_keep = int(keep.sum())

            def column(*names, default=None):
                # v1 and v3 name some predictions differently; v3 has no satellite AOA or extrapolation flags
                for name in names:
                    if name in pred:
                        return pred[name][:][keep]
                return np.full(n_keep, default)

            self.cells = {
                'plot_id': cell_plot[keep],
                'lat': f['grid/lat'][:][keep].astype(float),
                'lon': f['grid/lon'][:][keep].astype(float),
                'area_ha': f['grid/luas_ha_sel'][:][keep].astype(float),
                'agb': pred['agb_mg_ha'][:][keep].astype(float),
                'bgb': pred['bgb_mg_ha'][:][keep].astype(float),
                'biomassa': pred['biomassa_mg_ha'][:][keep].astype(float),
                'karbon': pred['karbon_ton_ha'][:][keep].astype(float),
                'co2e': pred['co2e_ton_ha'][:][keep].astype(float),
                'sd': column('sd_agb_mg_ha', 'sd_mg_ha', default=np.nan).astype(float),
                'dalam_aoa': column('dalam_aoa', default=1).astype(int),
                'ekstrapolasi': column('flag_ekstrapolasi', default=0).astype(int),
                'tier': column('tier', default=0).astype(int),
            }
            self.dropped_cells = int((~keep).sum())

            if 'ringkasan' in f:
                self.summary = {k: float(v) for k, v in f['ringkasan'].attrs.items()}
            else:
                agb_total = float(np.sum(self.cells['agb'] * self.cells['area_ha']))
                area_total = float(np.sum(self.cells['area_ha']))
                self.summary = {
                    'agb_total_ton': agb_total,
                    'agb_rerata_mg_ha': agb_total / area_total if area_total else 0.0,
                    'jumlah_sel': float(n_keep),
                }

        logger.info(
            f"Dataset biomassa dimuat: {n_keep} sel valid "
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
                'tier': int(self.cells['tier'][i]),
            }
            for i in np.flatnonzero(mask)
        ]

    def _plot_candidates(self, plot, farms, area_tolerance_ha):
        candidates = []
        for farm in farms:
            if not farm.total_area_ha:
                continue
            pj_match = plot['pj'].lower() in (farm.name or '').lower()
            area_gap = abs(float(farm.total_area_ha) - plot['area_ha'])
            if pj_match and area_gap <= area_tolerance_ha:
                candidates.append((area_gap, farm))
        return sorted(candidates, key=lambda c: c[0])

    def plots_for_farm(self, farm, geojson=None, min_share=0.5, area_tolerance_ha=0.05):
        # By location when the farm boundary is known: a plot belongs to the farm when most of its
        # cell centres fall inside the boundary. Otherwise fall back to the PJ name and area.
        if geojson:
            import shapely
            from shapely.geometry import shape

            inside = shapely.contains_xy(shape(geojson), self.cells['lon'], self.cells['lat'])
            plot_ids = []
            for plot in self.plots:
                mask = self.cells['plot_id'] == plot['plot_id']
                if mask.any() and inside[mask].mean() >= min_share:
                    plot_ids.append(plot['plot_id'])
            if plot_ids:
                return plot_ids

        best = None
        for plot in self.plots:
            candidates = self._plot_candidates(plot, [farm], area_tolerance_ha)
            if candidates and (best is None or candidates[0][0] < best[0]):
                best = (candidates[0][0], plot['plot_id'])
        return [best[1]] if best else []

    def layer_rows(self, farm_id, plot_ids, period, only_aoa=False):
        cells = [c for plot_id in plot_ids for c in self.cells_for_plot(plot_id)]
        if only_aoa:
            cells = [c for c in cells if c['dalam_aoa']]
        source = self.provenance()
        return [
            {
                'farm_id': farm_id,
                'coordinate': f"SRID=4326;POINT({c['lon']} {c['lat']})",
                'parameter_type': 'biomass',
                'period': period,
                'numerical_value': round(c['agb'], 3),
                'unit': self.UNIT,
                'is_anomaly': bool(c['agb'] < self.ANOMALY_THRESH_MG_HA),
                'source': source,
            }
            for c in cells
        ]

    def provenance(self):
        if 'model' not in self.meta:
            return (
                f"{self.meta.get('judul', 'AGB Kadatuan 10m')} "
                f"(dibuat {self.meta.get('dibuat', '-')}; tier 1 pohon terukur, tier 2 laju sensus)"
            )
        return (
            f"AGB Kadatuan 10m ({self.meta.get('model')}, "
            f"komposit {self.meta.get('jendela_citra', '-')}, "
            f"R2 blok spasial {float(self.meta.get('r2_blok_spasial', 0)):.3f})"
        )
