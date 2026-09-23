#!/usr/bin/env python
"""
Migration 005: Kolom users.preferences (JSON) untuk sinkronisasi Platform Settings.

Run manual:  python migrations/005_add_user_preferences.py
"""

import os
import sys

import psycopg2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import Config  # noqa: E402


def run_migration():
    try:
        # Pakai DB yang sama dengan aplikasi (DATABASE_URL)
        dsn = Config.SQLALCHEMY_DATABASE_URI.replace('postgresql+psycopg2://', 'postgresql://')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()

        cur.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS preferences JSON NOT NULL DEFAULT '{}'::json;
        """)
        conn.commit()
        print("   ✅ Kolom 'preferences' siap/ada")

        cur.close()
        conn.close()
        print("\n✅ Migration 005 completed successfully!")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 005: add users.preferences...")
    success = run_migration()
    exit(0 if success else 1)
