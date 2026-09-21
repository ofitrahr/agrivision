import logging

import numpy as np
from app.db.models import Farm, HarvestRecord

logger = logging.getLogger(__name__)


class YieldService:
    DEFAULT_COFFEE_BASELINE_TON_HA = 0.15

    def estimate_yield_batch(self, farm_id, period, ndvi_array):
        ndvi = np.asarray(ndvi_array, dtype=np.float64)
        if ndvi.size == 0:
            return []

        baseline_ton_ha = self._resolve_baseline(farm_id, period)

        ndvi_mean = float(np.mean(ndvi))
        if ndvi_mean <= 0.05:
            return [0.0] * ndvi.size

        relative_health = np.clip(ndvi / ndvi_mean, 0.2, 2.5)
        yield_preds = np.clip(baseline_ton_ha * (relative_health ** 1.2), 0.01, 1.5)

        return [float(round(y, 3)) for y in yield_preds]

    def _resolve_baseline(self, farm_id, period):
        harvest = HarvestRecord.query.filter_by(farm_id=farm_id, period=period).first()
        yield_kg = float(harvest.yield_kg) if harvest and harvest.yield_kg else 0.0

        if yield_kg <= 0:
            logger.info(
                f"Tidak ada catatan panen untuk lahan {farm_id} periode {period}. "
                f"Memakai baseline kopi default {self.DEFAULT_COFFEE_BASELINE_TON_HA} Ton/Ha."
            )
            return self.DEFAULT_COFFEE_BASELINE_TON_HA

        farm = Farm.query.get(farm_id)
        area_ha = float(farm.total_area_ha) if farm and farm.total_area_ha else 1.0
        baseline = (yield_kg / 1000.0) / max(0.1, area_ha)
        logger.info(
            f"Baseline yield lahan {farm_id} periode {period}: {baseline:.3f} Ton/Ha "
            f"(kalibrasi {yield_kg:.0f} kg / {area_ha:.2f} Ha)."
        )
        return baseline
