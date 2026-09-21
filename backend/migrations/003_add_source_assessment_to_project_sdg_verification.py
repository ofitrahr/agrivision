#!/usr/bin/env python
"""
Migration 003: Add source_assessment_id to project_sdg_verifications.

Admin kini dapat memilih assessment (questionnaire ke-N) mana yang menjadi
sumber SDG project. Kolom ini mencatat pilihan tersebut agar hasil yang
ditampilkan konsisten dengan pilihan admin, bukan selalu assessment terbaru.

Backfill: verification yang sudah ada menunjuk assessment completed terbaru
milik project-nya (perilaku lama).

Run manual:  python migrations/003_add_source_assessment_to_project_sdg_verification.py
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_NAME = os.getenv('DB_NAME', 'agrivision')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5433')


def run_migration():
    """Add source_assessment_id column + backfill to latest completed assessment."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        # 1. Idempotent: tambah kolom jika belum ada
        cur.execute("""
            ALTER TABLE project_sdg_verifications
            ADD COLUMN IF NOT EXISTS source_assessment_id UUID;
        """)
        conn.commit()
        print("   ✅ Kolom 'source_assessment_id' siap/ada")

        # 2. FK + index (idempotent)
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_psv_source_assessment'
                ) THEN
                    ALTER TABLE project_sdg_verifications
                        ADD CONSTRAINT fk_psv_source_assessment
                        FOREIGN KEY (source_assessment_id)
                        REFERENCES trace_assessments(id)
                        ON DELETE SET NULL;
                END IF;
            END $$;
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_psv_source_assessment
            ON project_sdg_verifications(source_assessment_id);
        """)
        conn.commit()
        print("   ✅ FK + index siap/ada")

        # 3. Backfill: verification tanpa source -> assessment completed terbaru
        cur.execute("""
            UPDATE project_sdg_verifications v
            SET source_assessment_id = t.id
            FROM (
                SELECT DISTINCT ON (project_traceability_id)
                    project_traceability_id, id
                FROM trace_assessments
                WHERE status = 'completed'
                ORDER BY project_traceability_id, completed_at DESC, created_at DESC
            ) t
            WHERE t.project_traceability_id = v.project_traceability_id
              AND v.source_assessment_id IS NULL;
        """)
        backfilled = cur.rowcount
        conn.commit()
        print(f"   ✅ Backfill: {backfilled} verification ditautkan ke assessment terbaru")

        # Verify
        cur.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.columns
            WHERE table_name = 'project_sdg_verifications'
            ORDER BY ordinal_position;
        """)
        cols = [r[0] for r in cur.fetchall()]

        cur.close()
        conn.close()

        print("\n✅ Migration 003 completed successfully!")
        print(f"   Kolom tabel project_sdg_verifications: {', '.join(cols)}")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 003: add source_assessment_id...")
    success = run_migration()
    exit(0 if success else 1)
