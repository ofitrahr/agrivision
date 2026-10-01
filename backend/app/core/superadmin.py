import os
import secrets
import string

SUPERADMIN_USERNAME = "superadmin"
PASSWORD_SYMBOLS = "!@%^*-_=+.~"
GENERATED_PASSWORD_LENGTH = 20


def generate_strong_password(length=GENERATED_PASSWORD_LENGTH):
    pools = [string.ascii_lowercase, string.ascii_uppercase, string.digits, PASSWORD_SYMBOLS]
    alphabet = "".join(pools)
    chars = [secrets.choice(pool) for pool in pools]
    chars += [secrets.choice(alphabet) for _ in range(length - len(pools))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def resolve_superadmin_password():
    password = os.getenv("SUPERADMIN_PASSWORD", "").strip()
    if password:
        return password, False
    return generate_strong_password(), True
