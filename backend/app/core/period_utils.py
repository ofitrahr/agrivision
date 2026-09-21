import calendar
from datetime import date

MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
MONTH_NAMES_ID_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]


def current_period_id():
    today = date.today()
    return f"{today.year:04d}-{today.month:02d}"


def parse_period_id(period_id):
    """'2026-01' -> (2026, 1)."""
    year_str, month_str = str(period_id).split('-')
    year, month = int(year_str), int(month_str)
    if not (1 <= month <= 12):
        raise ValueError(f"Bulan tidak valid pada periode: {period_id}")
    return year, month


def period_label(period_id, short=False):
    try:
        year, month = parse_period_id(period_id)
    except (ValueError, AttributeError, TypeError):
        return period_id
    names = MONTH_NAMES_ID_SHORT if short else MONTH_NAMES_ID
    return f"{names[month - 1]} {year}"


def shift_period(period_id, delta_months):
    year, month = parse_period_id(period_id)
    total = (year * 12 + (month - 1)) + delta_months
    new_year, new_month = divmod(total, 12)
    return f"{new_year:04d}-{new_month + 1:02d}"


def period_date_range(period_id):
    year, month = parse_period_id(period_id)
    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])
    return start, end
