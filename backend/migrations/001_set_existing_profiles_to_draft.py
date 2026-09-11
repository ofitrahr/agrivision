#!/usr/bin/env python
"""
Migration: Set existing traceability profiles to draft status.

Run manually: python backend/migrations/001_set_existing_profiles_to_draft.py
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
    """Set all existing profiles to 'draft' status."""
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cursor = conn.cursor()

        # SQL: Set existing profiles to 'draft' if status is NULL or not 'published'
        sql = """
        UPDATE project_traceability_profiles
        SET status = 'draft'
        WHERE status IS NULL OR status != 'published'
        RETURNING id, status;
        """

        cursor.execute(sql)
        rows_updated = cursor.rowcount
        conn.commit()

        print(f"✅ Migration completed successfully!")
        print(f"   Updated {rows_updated} profile(s) to 'draft' status")

        # Show updated records
        cursor.execute("""
        SELECT id, status, updated_at FROM project_traceability_profiles
        ORDER BY updated_at DESC LIMIT 5;
        """)

        print("\n📋 Last 5 updated profiles:")
        for row in cursor.fetchall():
            print(f"   ID: {row[0]}, Status: {row[1]}, Updated: {row[2]}")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

    return True

if __name__ == '__main__':
    print("🔄 Running migration: Set existing profiles to draft...")
    success = run_migration()
    exit(0 if success else 1)
