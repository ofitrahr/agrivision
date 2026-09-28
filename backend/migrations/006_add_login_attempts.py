#!/usr/bin/env python
import os
import sys

import psycopg2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import Config


def run_migration():
    try:
        dsn = Config.SQLALCHEMY_DATABASE_URI.replace('postgresql+psycopg2://', 'postgresql://')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                id UUID PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                username VARCHAR(100) NOT NULL,
                created_at TIMESTAMP NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_login_attempts_ip_address ON login_attempts (ip_address);
            CREATE INDEX IF NOT EXISTS ix_login_attempts_username ON login_attempts (username);
            CREATE INDEX IF NOT EXISTS ix_login_attempts_created_at ON login_attempts (created_at);
        """)
        conn.commit()
        print("   ✅ Tabel 'login_attempts' siap/ada")

        cur.close()
        conn.close()
        print("\n✅ Migration 006 completed successfully!")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 006: add login_attempts...")
    success = run_migration()
    exit(0 if success else 1)
