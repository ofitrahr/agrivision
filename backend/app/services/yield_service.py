import logging

import numpy as np
from app.db.database import db
from app.db.models import Farm, HarvestRecord

logger = logging.getLogger(__name__)


class YieldService:
    DEFAULT_COFFEE_BASELINE_TON_HA = 0.15

    def __init__(self):
        self.last_baseline = None
        self.last_source = None

    def estimate_yield_batch(self, farm_id, period, ndvi_array):
        ndvi = np.asarray(ndvi_array, dtype=np.float64)
        if ndvi.size == 0:
            return []

        baseline_ton_ha, _ = self.resolve_baseline(farm_id, period)

        ndvi_mean = float(np.mean(ndvi))
        if ndvi_mean <= 0.05:
            return [0.0] * ndvi.size

        relative_health = np.clip(ndvi / ndvi_mean, 0.2, 2.5)
        yield_preds = np.clip(baseline_ton_ha * (relative_health ** 1.2), 0.01, 1.5)

        return [float(round(y, 3)) for y in yield_preds]

    def resolve_baseline(self, farm_id, period):
        """Urutan: panen lahan ini -> panen kebun bulan yang sama -> rata-rata kebun -> default."""
        farm = Farm.query.get(farm_id)
        project_id = farm.project_id if farm else None

        baseline = self._farm_baseline(farm_id, period)
        source = 'panen lahan'

        if baseline is None and project_id:
            baseline = self._project_baseline(project_id, period=period)
            source = 'panen kebun bulan sama'

        if baseline is None and project_id:
            baseline = self._project_baseline(project_id, period=None)
            source = 'rata-rata panen kebun'

        if baseline is None:
            baseline = self.DEFAULT_COFFEE_BASELINE_TON_HA
            source = 'default kopi arabika'

        self.last_baseline, self.last_source = baseline, source
        logger.info(f"Baseline yield lahan {farm_id} periode {period}: {baseline:.4f} Ton/Ha ({source}).")
        return baseline, source

    @staticmethod
    def _farm_baseline(farm_id, period):
        row = db.session.query(HarvestRecord.yield_kg, Farm.total_area_ha).join(
            Farm, Farm.id == HarvestRecord.farm_id
        ).filter(HarvestRecord.farm_id == farm_id, HarvestRecord.period == period).first()
        return YieldService._to_ton_ha(row)

    @staticmethod
    def _project_baseline(project_id, period=None):
        q = db.session.query(HarvestRecord.yield_kg, Farm.total_area_ha).join(
            Farm, Farm.id == HarvestRecord.farm_id
        ).filter(Farm.project_id == project_id)
        if period:
            q = q.filter(HarvestRecord.period == period)

        values = [v for v in (YieldService._to_ton_ha(r) for r in q.all()) if v is not None]
        return float(np.mean(values)) if values else None

    @staticmethod
    def _to_ton_ha(row):
        if not row or not row[0] or not row[1]:
            return None
        kg, area = float(row[0]), float(row[1])
        if kg <= 0 or area <= 0:
            return None
        return (kg / 1000.0) / max(0.1, area)
