#!/usr/bin/env python
"""
Migration 002: Add sustainability narrative columns to profile_traceability_profiles.

Menambah kolom narrative untuk Sustainability Impact:
- social_narrative
- economic_narrative
- environmental_narrative

Run manual:  py -3.13 migrations/002_add_narrative_columns.py
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
    """Add narrative columns to project_traceability_profiles."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        # Idempotent: ADD COLUMN IF NOT EXISTS
        columns = [
            "social_narrative",
            "economic_narrative",
            "environmental_narrative",
        ]
        for col in columns:
            sql = (
                f"ALTER TABLE project_traceability_profiles "
                f"ADD COLUMN IF NOT EXISTS {col} TEXT;"
            )
            cur.execute(sql)
            print(f"   ✅ Column '{col}' siap/ada")

        conn.commit()

        # Verify
        cur.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.columns
            WHERE table_name = 'project_traceability_profiles'
            ORDER BY ordinal_position;
        """)
        cols = [r[0] for r in cur.fetchall()]

        cur.close()
        conn.close()

        print("\n✅ Migration 002 completed successfully!")
        print(f"   Kolom tabel project_traceability_profiles: {', '.join(cols)}")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 002: add narrative columns...")
    success = run_migration()
    exit(0 if success else 1)