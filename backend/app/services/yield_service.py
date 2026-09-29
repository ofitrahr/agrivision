import logging

import numpy as np
from app.db.database import db
from app.db.models import Farm, FinancialRecord
from sqlalchemy import func

logger = logging.getLogger(__name__)


class YieldService:
    BASELINE_SOURCE = 'produksi lahan (Catatan Keuangan)'

    def __init__(self):
        self.last_baseline = None
        self.last_source = None

    def estimate_yield_batch(self, farm_id, period, ndvi_array):
        ndvi = np.asarray(ndvi_array, dtype=np.float64)
        if ndvi.size == 0:
            return []

        baseline_ton_ha = self.resolve_baseline(farm_id, period)
        if baseline_ton_ha is None:
            return []

        ndvi_mean = float(np.mean(ndvi))
        if ndvi_mean <= 0.05:
            return [0.0] * ndvi.size

        relative_health = np.clip(ndvi / ndvi_mean, 0.2, 2.5)
        yield_preds = np.clip(baseline_ton_ha * (relative_health ** 1.2), 0.01, 1.5)

        return [float(round(y, 3)) for y in yield_preds]

    def resolve_baseline(self, farm_id, period):
        baseline = self._farm_baseline(farm_id, period)
        self.last_baseline = baseline
        self.last_source = self.BASELINE_SOURCE if baseline is not None else None

        if baseline is None:
            logger.info(f"Lahan {farm_id} periode {period} belum punya Total Produksi di Catatan Keuangan. Yield dilewati.")
        else:
            logger.info(f"Baseline yield lahan {farm_id} periode {period}: {baseline:.4f} Ton/Ha ({self.BASELINE_SOURCE}).")
        return baseline

    @staticmethod
    def _farm_baseline(farm_id, period):
        total_kg = db.session.query(func.sum(FinancialRecord.total_production_kg)).filter(
            FinancialRecord.farm_id == farm_id, FinancialRecord.period == period
        ).scalar()
        farm = db.session.get(Farm, farm_id)
        if not total_kg or not farm or not farm.total_area_ha:
            return None

        kg, area = float(total_kg), float(farm.total_area_ha)
        if kg <= 0 or area <= 0:
            return None
        return (kg / 1000.0) / max(0.1, area)
