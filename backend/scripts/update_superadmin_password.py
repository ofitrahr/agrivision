#!/usr/bin/env python
import os
import sys

import bcrypt
import psycopg2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import Config
from app.core.superadmin import SUPERADMIN_USERNAME

MIN_PASSWORD_LENGTH = 12


def main():
    password = os.getenv("SUPERADMIN_PASSWORD", "").strip()
    if not password:
        print("❌ SUPERADMIN_PASSWORD belum diset di environment / .env.")
        return 1
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"❌ SUPERADMIN_PASSWORD minimal {MIN_PASSWORD_LENGTH} karakter.")
        return 1

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    dsn = Config.SQLALCHEMY_DATABASE_URI.replace('postgresql+psycopg2://', 'postgresql://')

    try:
        with psycopg2.connect(dsn) as conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET password_hash = %s WHERE username = %s AND role = 'super_admin'",
                (password_hash, SUPERADMIN_USERNAME),
            )
            updated = cur.rowcount
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return 1

    if updated == 0:
        print(f"⚠️  Akun '{SUPERADMIN_USERNAME}' dengan role super_admin tidak ditemukan. Tidak ada yang diubah.")
        return 1

    print(f"✅ Password akun '{SUPERADMIN_USERNAME}' berhasil diperbarui dari SUPERADMIN_PASSWORD.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
