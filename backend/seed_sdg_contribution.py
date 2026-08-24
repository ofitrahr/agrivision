"""
Seed System Assessment Kontribusi Project terhadap SDGs (plan revisi terbaru).

Mem-parse soal.md (hasil analisis 302 indikator SDG) menjadi:
- SdgMaster (17 goal) + konfigurasi threshold per goal (configurable).
- SdgIndicator (metadata indikator, klasifikasi asli, is_applicable).
- Questionnaire berisi semua pertanyaan APPLICABLE (satu pertanyaan = satu SDG,
  SINGLE_CHOICE, skala 0/25/50/75/100) dengan QuestionIndicator mapping
  (1 question -> 1 SDG -> 1+ indicator dari SDG yang sama).

Idempoten: dapat dijalankan berulang tanpa duplikasi.
PENTING: parser menjaga prinsip "satu pertanyaan = satu SDG"; pertanyaan dengan
teks identik dalam satu goal di-merge menjadi satu question dgn beberapa
indicator mapping (plan revisi #7, #19.5).

Usage:
    python seed_sdg_contribution.py [path_to_soal.md]
Default path bila tidak diberikan: <repo>/../obsidian/quistioner_traceability/soal.md
Atau set env SOAL_MD_PATH.
"""
import os
import re
import sys
from decimal import Decimal

import yaml

from app import create_app
from app.db.database import db
from app.db.models import (
    SdgMaster,
    SdgIndicator,
    Questionnaire,
    QuestionSection,
    Question,
    QuestionOption,
    QuestionIndicator,
)
from app.services.assessment_service import SDG_CATALOG, seed_sdg_masters

QUESTIONNAIRE_NAME = "SDG Agricultural Contribution Assessment"
QUESTIONNAIRE_VERSION = "2.0"
DEFAULT_ANSWERS = [
    ("Tidak diterapkan", 0),
    ("Direncanakan", 25),
    ("Sebagian diterapkan", 50),
    ("Sudah diterapkan", 75),
    ("Sudah diterapkan dan dipantau", 100),
]

app = create_app()


# ---------------------------------------------------------------
# PARSING soal.md
# ---------------------------------------------------------------
def parse_soal_md(raw):
    """Ekstrak semua blok YAML `sdg:` dari file (fence ```yaml). Return list dict."""
    # Bersihkan karakter kontrol (ASCII 0-8,11,12,14-31; C1 0x80-0x9F) serta
    # invisible/format unicode (zero-width, LRM/RLM, BOM) yang kerap muncul dari
    # teks hasil paste dan ditolak oleh yaml.safe_load.
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u200b\u200c\u200d\u2060\ufeff]+', '', raw)
    blocks = re.findall(r"```yaml\n(.*?)```", raw, flags=re.DOTALL)
    docs = []
    for block in blocks:
        doc = yaml.safe_load(block)
        if isinstance(doc, dict) and 'sdg' in doc:
            docs.append(doc)
    return docs


def normalize_text(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


# ---------------------------------------------------------------
# SEED
# ---------------------------------------------------------------
def _goal_section_name(goal_number, goal_name):
    return f"SDG {str(goal_number).zfill(2)} - {goal_name}"


def seed_questionnaire_from(docs):
    """Tanam indikator & pertanyaan. Idempoten. Return ringkasan."""
    counters = {"indicators": 0, "questions": 0, "mappings": 0, "goals": 0}

    questionnaire = Questionnaire.query.filter_by(name=QUESTIONNAIRE_NAME).first()
    if not questionnaire:
        questionnaire = Questionnaire(
            name=QUESTIONNAIRE_NAME,
            description=(
                "Assessment kontribusi project Agrivision terhadap SDGs. Satu "
                "pertanyaan mewakili satu SDG; hasil dihitung otomatis via scoring "
                "dan threshold configurable per goal."
            ),
            version=QUESTIONNAIRE_VERSION,
            is_active=True,
        )
        db.session.add(questionnaire)
        db.session.flush()
        counters["goals"] += 1

    # Pastikan hanya questionnaire ini yg aktif
    for other in Questionnaire.query.filter(~(Questionnaire.id == questionnaire.id)).all():
        if other.is_active:
            other.is_active = False

    # peta section & pertanyaan per goal (untuk dedup teks identik dalam goal)
    section_cache = {}
    question_by_goal = {}  # goal_number -> {normalized_text: Question}

    for doc in docs:
        sdg = doc['sdg']
        goal_number = int(str(sdg['goal']).zfill(2))
        sdg_master = SdgMaster.query.filter_by(goal_number=goal_number).first()
        if not sdg_master:
            continue

        target = doc.get('target', {}) or {}
        indicator = doc.get('indicator', {}) or {}
        indicator_code = indicator.get('code')
        indicator_name = indicator.get('name')
        classification = doc.get('classification')

        # ---------- Upsert SdgIndicator ----------
        ind = SdgIndicator.query.filter_by(
            goal_id=sdg_master.id, indicator_code=indicator_code
        ).first()
        if not ind:
            ind = SdgIndicator(
                goal_id=sdg_master.id,
                target_code=target.get('code'),
                target_name=target.get('name'),
                indicator_code=indicator_code,
                indicator_name=indicator_name,
                classification=classification,
            )
            db.session.add(ind)
            counters["indicators"] += 1
        else:
            changed = False
            if target.get('code') and ind.target_code != target.get('code'):
                ind.target_code = target.get('code'); changed = True
            if target.get('name') and ind.target_name != target.get('name'):
                ind.target_name = target.get('name'); changed = True
            if classification and ind.classification != classification:
                ind.classification = classification; changed = True
            if indicator_name and ind.indicator_name != indicator_name:
                ind.indicator_name = indicator_name; changed = True

        is_applicable = doc.get('assessment_status') == 'APPLICABLE'
        if ind.is_applicable != is_applicable:
            ind.is_applicable = is_applicable

        # ---------- Pertanyaan (hanya APPLICABLE) ----------
        if not is_applicable:
            continue

        question = doc.get('question', {}) or {}
        question_text = (question.get('text') or '').strip()
        if not question_text:
            continue
        purpose = question.get('purpose')

        if goal_number not in section_cache:
            section = QuestionSection.query.filter_by(
                questionnaire_id=questionnaire.id,
                name=_goal_section_name(goal_number, sdg_master.name),
            ).first()
            if not section:
                section = QuestionSection(
                    questionnaire_id=questionnaire.id,
                    name=_goal_section_name(goal_number, sdg_master.name),
                    description=sdg_master.description,
                    section_order=goal_number,
                )
                db.session.add(section)
                db.session.flush()
            section_cache[goal_number] = section
        section = section_cache[goal_number]

        key = normalize_text(question_text)
        existing = None
        if goal_number not in question_by_goal and not question_by_goal.get(goal_number):
            question_by_goal[goal_number] = {}
        existing = question_by_goal[goal_number].get(key)
        if existing is None:
            # cek di DB (idempotency antar-run)
            existing = Question.query.filter_by(
                questionnaire_id=questionnaire.id,
                section_id=section.id,
                sdg_id=sdg_master.id,
            ).filter(Question.question_text == question_text).first()

        if existing is None:
            q = Question(
                questionnaire_id=questionnaire.id,
                section_id=section.id,
                sdg_id=sdg_master.id,
                question_text=question_text,
                purpose=purpose,
                question_type='single_choice',
                weight=Decimal(1),
                question_order=len(question_by_goal[goal_number]) + 1,
                is_required=True,
                is_active=True,
            )
            db.session.add(q)
            db.session.flush()

            for opt_idx, (opt_text, score) in enumerate(DEFAULT_ANSWERS, start=1):
                db.session.add(QuestionOption(
                    question_id=q.id,
                    option_text=opt_text,
                    score=score,
                    option_order=opt_idx,
                ))
            counters["questions"] += 1
            question_by_goal[goal_number][key] = q
            existing = q
        else:
            if not existing.purpose and purpose:
                existing.purpose = purpose
            question_by_goal[goal_number][key] = existing

        # mapping indikator ke pertanyaan (dalam SDG yg sama)
        has_map = QuestionIndicator.query.filter_by(
            question_id=existing.id, indicator_id=ind.id
        ).first()
        if not has_map:
            db.session.add(QuestionIndicator(question_id=existing.id, indicator_id=ind.id))
            counters["mappings"] += 1

    db.session.commit()
    return counters


def run(soal_path=None):
    _default = (
        os.path.join(os.path.dirname(__file__), '..', 'obsidian', 'quistioner_traceability', 'soal.md')
    )
    _fallback = r'C:\obsidian\quistioner_traceability\soal.md'
    # 1) arg eksplisit, 2) env, 3) path relatif repo, 4) fallback absolut
    if soal_path and os.path.isfile(soal_path):
        resolved = soal_path
    elif os.getenv('SOAL_MD_PATH') and os.path.isfile(os.getenv('SOAL_MD_PATH')):
        resolved = os.getenv('SOAL_MD_PATH')
    elif os.path.isfile(_default):
        resolved = _default
    elif os.path.isfile(_fallback):
        resolved = _fallback
    else:
        print(f"[ERROR] File soal.md tidak ditemukan. Coba: {_default} atau {_fallback}")
        sys.exit(1)
    soal_path = resolved

    with open(soal_path, encoding='utf-8') as f:
        raw = f.read()

    docs = parse_soal_md(raw)
    print(f"Blok indikator diparsing: {len(docs)}")

    with app.app_context():
        seed_sdg_masters()
        include_count = sum(1 for d in docs if d.get('assessment_status') == 'APPLICABLE')
        print(f"Indikator APPLICABLE (menjadi pertanyaan): {include_count}")
        counters = seed_questionnaire_from(docs)
        total_questions = Question.query.filter_by(questionnaire_id=None).count()
        # hitung ulang
        qn = Questionnaire.query.filter_by(name=QUESTIONNAIRE_NAME).first()
        tq = Question.query.filter_by(questionnaire_id=qn.id).count() if qn else 0
        ti = SdgIndicator.query.count()
        print("Seed selesai:")
        print(f"  SDG Goals          : {SdgMaster.query.count()} (dari 17)")
        print(f"  SdgIndicator total : {ti} (baru ditambah {counters['indicators']})")
        print(f"  Questionnaire       : {qn.name if qn else '-'} v{qn.version if qn else '-'}")
        print(f"  Question  total     : {tq} (baru {counters['questions']})")
        print(f"  Indicator mappings  : {counters['mappings']}")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        run(sys.argv[1])
    else:
        run()