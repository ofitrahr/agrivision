#!/usr/bin/env python
import os
import sys

import psycopg2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import Config

MASTER_COMPANY_NAME = 'Agrivision Master'


def migrate(cur):
    cur.execute("""
        UPDATE users SET project_id = NULL
        WHERE role = 'super_admin' AND project_id IS NOT NULL
        RETURNING username
    """)
    detached = [r[0] for r in cur.fetchall()]
    print(f"   ✅ {len(detached)} akun super admin dilepas dari project: {', '.join(detached) or '-'}")

    cur.execute("SELECT id FROM companies WHERE name = %s", (MASTER_COMPANY_NAME,))
    removed, kept = 0, 0
    for (company_id,) in cur.fetchall():
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM users u JOIN projects p ON p.id = u.project_id WHERE p.company_id = %(c)s),
                (SELECT COUNT(*) FROM farms f JOIN projects p ON p.id = f.project_id WHERE p.company_id = %(c)s),
                (SELECT COUNT(*) FROM financial_records WHERE company_id = %(c)s),
                (SELECT COUNT(*) FROM harvest_records WHERE company_id = %(c)s)
        """, {'c': company_id})
        users, farms, financials, harvests = cur.fetchone()

        if users or farms or financials or harvests:
            kept += 1
            print(f"   ⚠️  Company '{MASTER_COMPANY_NAME}' ({company_id}) masih dipakai "
                  f"(user: {users}, lahan: {farms}, keuangan: {financials}, panen: {harvests}), tidak dihapus.")
            continue

        cur.execute("DELETE FROM companies WHERE id = %s", (company_id,))
        removed += 1

    print(f"   ✅ Company '{MASTER_COMPANY_NAME}' dihapus: {removed}, dipertahankan: {kept}")
    return detached, removed, kept


def run_migration():
    try:
        dsn = Config.SQLALCHEMY_DATABASE_URI.replace('postgresql+psycopg2://', 'postgresql://')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()

        migrate(cur)
        conn.commit()

        cur.close()
        conn.close()
        print("\n✅ Migration 007 completed successfully!")
        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == '__main__':
    print("🔄 Running migration 007: detach super admin from company...")
    success = run_migration()
    exit(0 if success else 1)
