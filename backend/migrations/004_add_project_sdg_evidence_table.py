#!/usr/bin/env python
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_NAME = os.getenv('DB_NAME', 'agrivision')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5433')


def run_migration():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS project_sdg_evidence (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                verification_id UUID NOT NULL
                    REFERENCES project_sdg_verifications(id) ON DELETE CASCADE,
                file_url TEXT NOT NULL,
                file_type VARCHAR(20),
                original_name VARCHAR(255),
                uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """)
        conn.commit()
        print("   ✅ Tabel 'project_sdg_evidence' siap/ada")

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_project_sdg_evidence_verification
            ON project_sdg_evidence(verification_id);
        """)
        conn.commit()
        print("   ✅ Index verification_id siap/ada")

        cur.execute("""
            ALTER TABLE project_sdg_verifications
            ADD COLUMN IF NOT EXISTS save_state VARCHAR(20) NOT NULL DEFAULT 'unsaved';
        """)
        conn.commit()
        print("   ✅ Kolom 'save_state' siap/ada")

        cur.execute("""
            INSERT INTO project_sdg_evidence (verification_id, file_url, file_type, uploaded_at)
            SELECT v.id, v.evidence_file_url, v.evidence_file_type, COALESCE(v.assessment_date, NOW())
            FROM project_sdg_verifications v
            WHERE v.evidence_file_url IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM project_sdg_evidence e WHERE e.verification_id = v.id
              );
        """)
        backfilled = cur.rowcount
        conn.commit()
        print(f"   ✅ Backfill: {backfilled} evidence lama dimigrasi ke tabel baru")

        cur.execute("""
            UPDATE project_sdg_verifications
            SET evidence_file_url = NULL, evidence_file_type = NULL
            WHERE evidence_file_url IS NOT NULL;
        """)
        cleared = cur.rowcount
        conn.commit()
        print(f"   ✅ Kolom lama dikosongkan pada {cleared} verification")

        cur.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.columns
            WHERE table_name = 'project_sdg_evidence'
            ORDER BY ordinal_position;
        """)
        cols = [r[0] for r in cur.fetchall()]

        cur.close()
        conn.close()

        print("\n✅ Migration 004 completed successfully!")
        print(f"   Kolom project_sdg_evidence: {', '.join(cols)}")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 004: create project_sdg_evidence table...")
    success = run_migration()
    exit(0 if success else 1)
