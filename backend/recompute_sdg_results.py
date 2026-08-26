"""Hitung ulang AssessmentSdgResult untuk semua assessment completed.

Dipakai setelah perbaikan formula skor (rata-rata tertimbang jawaban, skala
0-100 tanpa pengali ganda) agar data historis konsisten dengan engine baru.

Usage:
    python recompute_sdg_results.py
"""
import sys

from app import create_app
from app.db.database import db
from app.db.models import TraceAssessment
from app.services.assessment_service import _calculate_sdg

app = create_app()

with app.app_context():
    assessments = TraceAssessment.query.filter_by(status='completed').all()
    if not assessments:
        print("Tidak ada assessment completed.")
        sys.exit(0)

    for a in assessments:
        _calculate_sdg(a)
        print(f"[OK] {a.id} ({a.questionnaire.name if a.questionnaire else '?'}) dihitung ulang")

    db.session.commit()
    print(f"Selesai: {len(assessments)} assessment diperbarui.")
