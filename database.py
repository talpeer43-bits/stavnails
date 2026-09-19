import sqlite3
import os
from datetime import datetime, time, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "salon.db")

# Support PostgreSQL on Railway / Render via DATABASE_URL env variable
DATABASE_URL = os.environ.get("DATABASE_URL", "")

def _use_postgres():
    return bool(DATABASE_URL)

def get_db_connection():
    if _use_postgres():
        import psycopg2
        import psycopg2.extras
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def _ph():
    return "%s" if _use_postgres() else "?"

def _rowcount(cursor):
    row = cursor.fetchone()
    if row is None:
        return 0
    if isinstance(row, dict):
        return list(row.values())[0]
    return row[0]

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    if _use_postgres():
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            salon_name_he TEXT NOT NULL,
            salon_name_en TEXT NOT NULL,
            phone TEXT NOT NULL,
            whatsapp_number TEXT NOT NULL,
            address_he TEXT NOT NULL,
            address_en TEXT NOT NULL,
            instagram TEXT,
            admin_pin TEXT NOT NULL DEFAULT '1234',
            cancellation_policy_he TEXT,
            cancellation_policy_en TEXT,
            currency_symbol TEXT DEFAULT 'â‚ª',
            slot_interval_minutes INTEGER DEFAULT 30
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            category TEXT NOT NULL,
            name_he TEXT NOT NULL,
            name_en TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            price REAL NOT NULL,
            description_he TEXT,
            description_en TEXT,
            badge_he TEXT,
            badge_en TEXT,
            icon TEXT,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS business_hours (
            day_of_week INTEGER PRIMARY KEY,
            day_name_he TEXT NOT NULL,
            day_name_en TEXT NOT NULL,
            is_open INTEGER NOT NULL DEFAULT 1,
            open_time TEXT NOT NULL DEFAULT '09:00',
            close_time TEXT NOT NULL DEFAULT '19:00',
            break_start TEXT DEFAULT '13:00',
            break_end TEXT DEFAULT '13:30'
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id SERIAL PRIMARY KEY,
            booking_code TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            client_email TEXT,
            service_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (service_id) REFERENCES services(id)
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocked_slots (
            id SERIAL PRIMARY KEY,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            reason TEXT
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            client_name TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_approved INTEGER DEFAULT 1
        );""")
    else:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            salon_name_he TEXT NOT NULL,
            salon_name_en TEXT NOT NULL,
            phone TEXT NOT NULL,
            whatsapp_number TEXT NOT NULL,
            address_he TEXT NOT NULL,
            address_en TEXT NOT NULL,
            instagram TEXT,
            admin_pin TEXT NOT NULL DEFAULT '1234',
            cancellation_policy_he TEXT,
            cancellation_policy_en TEXT,
            currency_symbol TEXT DEFAULT '₪',
            slot_interval_minutes INTEGER DEFAULT 30
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name_he TEXT NOT NULL,
            name_en TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            price REAL NOT NULL,
            description_he TEXT,
            description_en TEXT,
            badge_he TEXT,
            badge_en TEXT,
            icon TEXT,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS business_hours (
            day_of_week INTEGER PRIMARY KEY,
            day_name_he TEXT NOT NULL,
            day_name_en TEXT NOT NULL,
            is_open INTEGER NOT NULL DEFAULT 1,
            open_time TEXT NOT NULL DEFAULT '09:00',
            close_time TEXT NOT NULL DEFAULT '19:00',
            break_start TEXT DEFAULT '13:00',
            break_end TEXT DEFAULT '13:30'
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_code TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            client_email TEXT,
            service_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (service_id) REFERENCES services(id)
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocked_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            reason TEXT
        );""")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_approved INTEGER DEFAULT 1
        );""")

    conn.commit()

    ph = _ph()
    cursor.execute("SELECT COUNT(*) FROM settings")
    if _rowcount(cursor) == 0:
        cursor.execute("""
        INSERT INTO settings (id, salon_name_he, salon_name_en, phone, whatsapp_number,
            address_he, address_en, instagram, admin_pin, cancellation_policy_he, cancellation_policy_en
        ) VALUES (1, 'ציפורניים של סתיו', 'Stav''s Nails', '050-1234567', '972501234567',
            'רחוב דיזנגוף 100, תל אביב', '100 Dizengoff St, Tel Aviv', '@stav_nails', '1234',
            'ביטול תור יתאפשר עד 24 שעות לפני מועד הטיפול ללא חיוב.',
            'Cancellations allowed up to 24 hours prior to appointment.')
        """)

    cursor.execute("SELECT COUNT(*) FROM business_hours")
    if _rowcount(cursor) == 0:
        days = [
            (0, 'ראשון', 'Sunday', 1, '09:00', '19:00', '13:00', '13:30'),
            (1, 'שני', 'Monday', 1, '09:00', '19:00', '13:00', '13:30'),
            (2, 'שלישי', 'Tuesday', 1, '09:00', '19:00', '13:00', '13:30'),
            (3, 'רביעי', 'Wednesday', 1, '09:00', '19:00', '13:00', '13:30'),
            (4, 'חמישי', 'Thursday', 1, '09:00', '20:00', '13:00', '13:30'),
            (5, 'שישי', 'Friday', 1, '08:30', '14:30', '', ''),
            (6, 'שבת', 'Saturday', 0, '10:00', '16:00', '', '')
        ]
        for d in days:
            cursor.execute(f"""
            INSERT INTO business_hours (day_of_week, day_name_he, day_name_en, is_open,
                open_time, close_time, break_start, break_end)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""", d)

    cursor.execute("SELECT COUNT(*) FROM services")
    if _rowcount(cursor) == 0:
        services = [
            ('gel', "לק ג'ל ומניקור רוסי", 'Russian Manicure & Gel Polish', 60, 140,
             "מניקור מכשירי מדויק, מבנה אנטומי מושלם, ולק ג'ל עד 4 שבועות.",
             'Precision dry Russian manicure with clean under-cuticle gel lasting up to 4 weeks.',
             'הכי פופולרי ✨', 'Most Popular ✨', 'sparkles', 1, 1),
            ('gel', 'מבנה אנטומי וחיזוק ציפורן טבעית', 'Rubber Base Builder & Natural Strengthening', 75, 160,
             "חיזוק לציפורניים חלשות עם ראבר בייס.",
             'Reinforcement for thin nails using builder/rubber base.',
             'מומלץ לציפורן שברירית', 'Recommended for weak nails', 'shield', 1, 2),
            ('extensions', "בנייה חדשה (ג'ל / אקריל / פוליג'ל)", 'Full New Set Nail Extensions', 105, 240,
             'הארכת ציפורניים בכל צורה ואורך לבחירתך.',
             'Custom nail lengthening in your preferred shape.',
             'מראה מהמם 💅', 'Stunning Look 💅', 'hand', 1, 3),
            ('extensions', "מילוי ציפורניים (ג'ל / אקריל)", 'Nail Extension Refill', 75, 160,
             'חידוש ומילוי בנייה קיימת ומריחת צבע חדש.',
             'Refill of existing extensions with fresh gel color.',
             '', '', 'refresh', 1, 4),
            ('pedicure', "פדיקור אסתטי מלא כולל לק ג'ל", 'Full Aesthetic Pedicure & Gel', 60, 180,
             "פילינג, גזירה ושיוף, ולק ג'ל.",
             'Exfoliation, shaping and gel polish.',
             'חווית פינוק 🌸', 'Pampering 🌸', 'heart', 1, 5),
            ('pedicure', "מיני פדיקור ולק ג'ל ברגליים", 'Express Pedicure & Gel', 45, 130,
             "טיפול מהיר בציפורני הרגליים ולק ג'ל.",
             'Quick toe nail shaping and gel polish.',
             '', '', 'clock', 1, 6),
            ('art', "עיצוב ציפורניים / פרנץ' / נייל ארט", 'Nail Art / French / Chrome / Ombré', 20, 35,
             "פרנץ', כרום, ציורי יד, אומברה.",
             'French tip, chrome, freehand designs or ombré.',
             'תוספת שדרוג 💎', 'Add-on 💎', 'palette', 1, 7),
            ('care', "הסרת ג'ל / בנייה ישנה ושיקום", 'Safe Gel / Acrylic Removal & Treatment', 30, 50,
             'הסרה עדינה ומבוקרת ללא שיוף אגרסיבי.',
             'Gentle removal without damaging natural nails.',
             '', '', 'feather', 1, 8),
        ]
        for svc in services:
            cursor.execute(f"""
            INSERT INTO services (category, name_he, name_en, duration_minutes, price,
                description_he, description_en, badge_he, badge_en, icon, is_active, sort_order)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})""", svc)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")