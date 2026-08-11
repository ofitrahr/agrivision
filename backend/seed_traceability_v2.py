"""
Seed data untuk arsitektur traceability BARU.

Membuat:
- SDG Master (17 goals, plan.md #34).
- Questionnaire "SDG Agricultural Sustainability Assessment v1.0" berisi
  16 pertanyaan (plan.md #31) dengan sections, options, dan Question-SDG weight.

Idempoten: jalankan berulang tanpa duplikasi.
"""
from app import create_app
from app.db.database import db
from app.db.models import (
    SdgMaster,
    Questionnaire,
    QuestionSection,
    Question,
    QuestionOption,
    QuestionSdg,
)
from app.services.assessment_service import SDG_CATALOG

app = create_app()


def _seed_sdg():
    """Seed/lengkapi 17 SDG Master (nama + description). Idempoten."""
    with app.app_context():
        created = 0
        updated = 0
        for num, name, description in SDG_CATALOG:
            sdg = SdgMaster.query.filter_by(goal_number=num).first()
            if not sdg:
                db.session.add(SdgMaster(
                    goal_number=num, name=name, description=description, threshold=70.00
                ))
                created += 1
            else:
                # lengkapi field yang kosong (mis. description) tanpa mengubah data lain
                changed = False
                if not sdg.description and description:
                    sdg.description = description
                    changed = True
                if not sdg.name or sdg.name != name:
                    sdg.name = name
                    changed = True
                if changed:
                    updated += 1
        db.session.commit()
        total = SdgMaster.query.count()
        print(f"SDG Master: {created} dibuat, {updated} dilengkapi. Total {total} dari 17.")


# ---------------------------------------------------------------
# Definisi questionnaire: 16 soal (plan.md #31, #14, #15, #16)
# ---------------------------------------------------------------

# format soal:
#  (code, type, text, [ (section, order) ], [ (option_text, score) ], { sdg_no: weight } )
# Weight per SDG dinyatakan GABUNGAN seluruh soal kontribusinya harus 100%.
# Karena tiap soal hanya menyumbang sebagian, berikut dipetakan sehingga total
# per SDG ~100%.

QUESTIONS = [
    # ---- SOCIAL ----
    ("Q01", "single_choice", "Apakah project memberikan dampak terhadap peningkatan pendapatan atau sumber penghasilan petani yang terlibat?",
     "Social", [
         ("Tidak memberikan dampak", 0),
         ("Dampak sangat terbatas", 25),
         ("Sebagian petani", 50),
         ("Sebagian besar petani", 75),
         ("Manfaat utama project", 100),
     ], {1: 40, 8: 30}),
    ("Q02", "single_choice", "Sejauh mana perempuan terlibat dalam kegiatan project?",
     "Social", [
         ("Tidak terlibat", 0),
         ("Keterlibatan sangat terbatas", 25),
         ("Sebagian anggota", 50),
         ("Sebagian besar terlibat", 75),
         ("Terlibat aktif penuh", 100),
     ], {5: 40, 10: 40, 1: 30}),
    ("Q03", "single_choice", "Bagaimana project memastikan kondisi kerja yang layak dan aman bagi pekerja/petani yang terlibat?",
     "Social", [
         ("Belum ada upaya", 0),
         ("Upaya terbatas", 25),
         ("Sebagian aspek terpenuhi", 50),
         ("Sebagian besar terpenuhi", 75),
         ("Kondisi kerja layak & aman", 100),
     ], {8: 30, 10: 30}),
    ("Q09", "single_choice", "Apakah perempuan dan kelompok petani lainnya memiliki kesempatan yang sama untuk memperoleh manfaat dari project?",
     "Social", [
         ("Tidak ada kesempatan yang sama", 0),
         ("Sangat terbatas", 25),
         ("Sebagian kelompok", 50),
         ("Sebagian besar", 75),
         ("Kesempatan sepenuhnya setara", 100),
     ], {5: 60, 10: 60}),
    # ---- ECONOMIC ----
    ("Q04", "single_choice", "Apakah project memiliki upaya untuk meningkatkan produktivitas atau hasil pertanian petani?",
     "Economic", [
         ("Tidak ada upaya", 0),
         ("Upaya terbatas", 25),
         ("Sebagian lahan", 50),
         ("Sebagian besar lahan", 75),
         ("Menjadi prioritas utama", 100),
     ], {2: 35}),
    ("Q05", "multiple_choice", "Praktik produksi berkelanjutan apa saja yang diterapkan pada project?",
     "Economic", [
         ("Pupuk organik", 20),
         ("Pengurangan bahan kimia", 20),
         ("Pengelolaan tanah", 15),
         ("Pengelolaan air", 15),
         ("Pengurangan limbah", 15),
         ("Reuse material", 15),
     ], {2: 35, 12: 30}),
    ("Q06", "multiple_choice", "Bagaimana project menjaga atau meningkatkan keberagaman tanaman dan ekosistem di sekitar lahan?",
     "Economic", [
         ("Penanaman multikultur", 20),
         ("Mempertahankan vegetasi alami", 20),
         ("Konservasi habitat", 20),
         ("Penyediaan koridor ekologi", 20),
         ("Tidak ada upaya", 0),
     ], {2: 30, 15: 30}),
    # ---- EDUCATION & CLIMATE ----
    ("Q07", "single_choice", "Apakah project memberikan pelatihan atau peningkatan kapasitas kepada petani?",
     "Education", [
         ("Tidak ada pelatihan", 0),
         ("Sangat jarang", 25),
         ("Sebagian petani", 50),
         ("Sebagian besar petani", 75),
         ("Pelatihan menyeluruh", 100),
     ], {4: 60}),
    ("Q08", "multiple_choice", "Topik apa saja yang diberikan dalam pelatihan kepada petani?",
     "Education", [
         ("Teknik budidaya berkelanjutan", 20),
         ("Pengelolaan iklim", 20),
         ("Pasca panen", 20),
         ("Manajemen usaha tani", 20),
         ("Kesehatan & keselamatan", 20),
     ], {4: 40, 13: 40}),
    # ---- ENVIRONMENT ----
    ("Q10", "single_choice", "Bagaimana project mengelola penggunaan air untuk kegiatan pertanian?",
     "Environmental", [
         ("Tidak terkelola", 0),
         ("Pengelolaan terbatas", 25),
         ("Sebagian aspek", 50),
         ("Sebagian besar terkelola", 75),
         ("Pengelolaan air berkelanjutan", 100),
     ], {6: 60, 12: 20}),
    ("Q11", "multiple_choice", "Apakah project melakukan tindakan untuk melindungi sumber air di sekitar area pertanian?",
     "Environmental", [
         ("Konservasi mata air", 20),
         ("Buffer zone sungai", 20),
         ("Pengelolaan DAS", 20),
         ("Pengurangan polusi air", 20),
         ("Tidak ada tindakan", 0),
     ], {6: 40, 15: 20}),
    ("Q12", "single_choice", "Bagaimana project mengelola penggunaan pupuk, pestisida, atau bahan kimia lainnya?",
     "Environmental", [
         ("Tidak terkelola", 0),
         ("Penggunaan berlebihan", 25),
         ("Pengelolaan standar", 50),
         ("Pengurangan bertahap", 75),
         ("Penggunaan minimal/berkelanjutan", 100),
     ], {12: 20, 15: 20}),
    ("Q13", "multiple_choice", "Bagaimana project menangani limbah yang dihasilkan dari kegiatan pertanian?",
     "Environmental", [
         ("Komposting", 20),
         ("Daur ulang kemasan", 20),
         ("Pengelolaan limbah", 20),
         ("Pemanfaatan residu", 20),
         ("Tidak ada penanganan", 0),
     ], {12: 30}),
    ("Q14", "multiple_choice", "Apakah project memiliki strategi untuk menghadapi risiko perubahan iklim seperti kekeringan, hujan ekstrem, atau perubahan pola musim?",
     "Climate", [
         ("Sistem irigasi adaptif", 20),
         ("Varietas tahan iklim", 20),
         ("Kalender tanam adaptif", 20),
         ("Asuransi iklim", 20),
         ("Tidak ada strategi", 0),
     ], {13: 30, 2: 30}),
    ("Q15", "multiple_choice", "Apakah project melakukan praktik yang bertujuan mengurangi dampak terhadap perubahan iklim?",
     "Climate", [
         ("Penurunan emisi karbon", 20),
         ("Konservasi energi", 20),
         ("Agroforestri/karbon", 20),
         ("Manajemen lahan rendah emisi", 20),
         ("Tidak ada praktik", 0),
     ], {13: 30, 15: 15, 12: 20}),
    ("Q16", "multiple_choice", "Praktik apa yang dilakukan project untuk menjaga kesehatan dan mencegah degradasi tanah?",
     "Environmental", [
         ("Erosi control / terasering", 20),
         ("Penutup tanah / mulsa", 20),
         ("Rotasi tanaman", 20),
         ("Pengomposan", 20),
         ("Tidak ada praktik", 0),
     ], {15: 20, 2: 30, 12: 30}),
]

SECTION_DESCRIPTIONS = {
    "Social": "Dimensi sosial & kesetaraan",
    "Economic": "Dimensi ekonomi & produktivitas",
    "Education": "Dimensi pendidikan & pelatihan",
    "Environmental": "Dimensi lingkungan & sumber daya",
    "Climate": "Dimensi iklim",
}


def seed_questionnaire():
    with app.app_context():
        if Questionnaire.query.filter_by(name="SDG Agricultural Sustainability Assessment").first():
            print("Questionnaire v1 sudah ada, lewati.")
            return

        q = Questionnaire(
            name="SDG Agricultural Sustainability Assessment",
            description="Digital assessment berbasis wawancara Admin-Assessor dengan Manager (Respondent).",
            version="1.0",
            is_active=True,
        )
        db.session.add(q)
        db.session.flush()

        created_sections = {}

        for idx, (code, qtype, text, section_name, options, sdg_map) in enumerate(QUESTIONS, start=1):
            if section_name not in created_sections:
                section = QuestionSection(
                    questionnaire_id=q.id,
                    name=section_name,
                    description=SECTION_DESCRIPTIONS.get(section_name, ""),
                    section_order=len(created_sections) + 1,
                )
                db.session.add(section)
                db.session.flush()
                created_sections[section_name] = section
            section = created_sections[section_name]

            question = Question(
                questionnaire_id=q.id,
                section_id=section.id,
                question_text=text,
                question_type=qtype,
                question_order=idx,
                is_required=True,
                is_active=True,
            )
            db.session.add(question)
            db.session.flush()

            for opt_idx, (opt_text, score) in enumerate(options, start=1):
                db.session.add(QuestionOption(
                    question_id=question.id,
                    option_text=opt_text,
                    score=score,
                    option_order=opt_idx,
                ))

            for sdg_no, weight in sdg_map.items():
                sdg = SdgMaster.query.filter_by(goal_number=sdg_no).first()
                if not sdg:
                    continue
                db.session.add(QuestionSdg(
                    question_id=question.id,
                    sdg_id=sdg.id,
                    weight=weight,
                ))

        db.session.commit()
        print("Berhasil seed Questionnaire v1 dengan 16 pertanyaan.")


if __name__ == "__main__":
    _seed_sdg()
    seed_questionnaire()
    print("Seed traceability v2 selesai.")