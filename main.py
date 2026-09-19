import os
import random
import string
from datetime import datetime, date, timedelta, time
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import get_db_connection, init_db

# Initialize database schema on startup
init_db()

app = FastAPI(title="Nail Salon Booking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Day of week conversion (Monday=0 in Python -> Sunday=0, Monday=1, ..., Saturday=6)
def get_salon_day_of_week(dt: date) -> int:
    return (dt.weekday() + 1) % 7

def time_to_minutes(t_str: str) -> int:
    parts = t_str.strip().split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time(m: int) -> str:
    hours = m // 60
    mins = m % 60
    return f"{hours:02d}:{mins:02d}"

def generate_booking_code() -> str:
    digits = "".join(random.choices(string.digits, k=4))
    letters = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    return f"NL-{letters}{digits}"

# Pydantic models
class AppointmentCreate(BaseModel):
    client_name: str
    client_phone: str
    client_email: Optional[str] = ""
    service_id: int
    addon_ids: Optional[List[int]] = []
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    notes: Optional[str] = ""

class AppointmentStatusUpdate(BaseModel):
    status: str  # confirmed, completed, cancelled, no_show
    notes: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None

class AdminLogin(BaseModel):
    pin: str

class ReviewCreate(BaseModel):
    client_name: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

class ServiceCreate(BaseModel):
    category: str
    name_he: str
    name_en: str
    duration_minutes: int
    price: float
    description_he: Optional[str] = ""
    description_en: Optional[str] = ""
    badge_he: Optional[str] = ""
    badge_en: Optional[str] = ""
    icon: Optional[str] = "sparkles"
    is_active: Optional[int] = 1
    sort_order: Optional[int] = 0

class SettingsUpdate(BaseModel):
    salon_name_he: str
    salon_name_en: str
    phone: str
    whatsapp_number: str
    address_he: str
    address_en: str
    instagram: Optional[str] = ""
    admin_pin: Optional[str] = "1234"
    cancellation_policy_he: Optional[str] = ""
    cancellation_policy_en: Optional[str] = ""
    slot_interval_minutes: Optional[int] = 30

class BusinessHourUpdate(BaseModel):
    day_of_week: int
    is_open: int
    open_time: str
    close_time: str
    break_start: Optional[str] = ""
    break_end: Optional[str] = ""

# Admin auth verification
def verify_admin_pin(x_admin_pin: Optional[str] = Header(None)):
    conn = get_db_connection()
    row = conn.execute("SELECT admin_pin FROM settings WHERE id = 1").fetchone()
    conn.close()
    expected_pin = row["admin_pin"] if row else "1234"
    if not x_admin_pin or x_admin_pin != expected_pin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin PIN")
    return True

# --- Public Endpoints ---

@app.get("/api/settings")
def get_public_settings():
    conn = get_db_connection()
    row = conn.execute("""
        SELECT salon_name_he, salon_name_en, phone, whatsapp_number,
               address_he, address_en, instagram, cancellation_policy_he,
               cancellation_policy_en, currency_symbol, slot_interval_minutes
        FROM settings WHERE id = 1
    """).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Settings not found")
    return dict(row)

@app.get("/api/services")
def get_services():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/availability")
def get_availability(
    date_str: str = Query(..., alias="date", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    service_id: int = Query(...),
    addons: Optional[str] = Query(None)
):
    try:
        req_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    now = datetime.now()
    today = now.date()

    if req_date < today:
        return {"is_open": False, "reason": "past_date", "slots": []}

    dow = get_salon_day_of_week(req_date)
    conn = get_db_connection()

    # Get working hours
    hour_row = conn.execute("SELECT * FROM business_hours WHERE day_of_week = ?", (dow,)).fetchone()
    if not hour_row or hour_row["is_open"] == 0:
        conn.close()
        return {"is_open": False, "reason": "closed_day", "slots": []}

    # Calculate requested total duration
    srv_row = conn.execute("SELECT duration_minutes FROM services WHERE id = ? AND is_active = 1", (service_id,)).fetchone()
    if not srv_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Service not found")

    total_duration = srv_row["duration_minutes"]
    if addons:
        addon_id_list = [int(x) for x in addons.split(",") if x.strip().isdigit()]
        if addon_id_list:
            placeholders = ",".join("?" for _ in addon_id_list)
            addon_rows = conn.execute(
                f"SELECT SUM(duration_minutes) as dur FROM services WHERE id IN ({placeholders})",
                addon_id_list
            ).fetchone()
            if addon_rows and addon_rows["dur"]:
                total_duration += addon_rows["dur"]

    # Fetch settings for slot interval
    setting_row = conn.execute("SELECT slot_interval_minutes FROM settings WHERE id = 1").fetchone()
    interval = setting_row["slot_interval_minutes"] if setting_row and setting_row["slot_interval_minutes"] else 30

    # Fetch existing appointments for the date
    existing_appts = conn.execute("""
        SELECT start_time, end_time FROM appointments
        WHERE date = ? AND status != 'cancelled'
    """, (date_str,)).fetchall()

    # Fetch blocked slots
    blocked_slots = conn.execute("""
        SELECT start_time, end_time FROM blocked_slots
        WHERE date = ?
    """, (date_str,)).fetchall()

    conn.close()

    open_min = time_to_minutes(hour_row["open_time"])
    close_min = time_to_minutes(hour_row["close_time"])
    break_start_min = time_to_minutes(hour_row["break_start"]) if hour_row["break_start"] else None
    break_end_min = time_to_minutes(hour_row["break_end"]) if hour_row["break_end"] else None

    # Busy ranges
    busy_intervals = []
    if break_start_min is not None and break_end_min is not None and break_end_min > break_start_min:
        busy_intervals.append((break_start_min, break_end_min))

    for a in existing_appts:
        busy_intervals.append((time_to_minutes(a["start_time"]), time_to_minutes(a["end_time"])))

    for b in blocked_slots:
        b_start = time_to_minutes(b["start_time"]) if b["start_time"] else open_min
        b_end = time_to_minutes(b["end_time"]) if b["end_time"] else close_min
        busy_intervals.append((b_start, b_end))

    # Calculate available slots
    available_slots = []
    current_time_min = now.hour * 60 + now.minute if req_date == today else -1

    slot_start = open_min
    while slot_start + total_duration <= close_min:
        slot_end = slot_start + total_duration

        # If booking today, don't show past times (require at least 45 minutes lead time)
        if req_date == today and slot_start <= current_time_min + 45:
            slot_start += interval
            continue

        # Check collision with busy intervals
        conflict = False
        for b_start, b_end in busy_intervals:
            # Overlap condition: slot_start < b_end and slot_end > b_start
            if slot_start < b_end and slot_end > b_start:
                conflict = True
                break

        if not conflict:
            available_slots.append({
                "time": minutes_to_time(slot_start),
                "endTime": minutes_to_time(slot_end)
            })

        slot_start += interval

    return {
        "is_open": True,
        "date": date_str,
        "total_duration": total_duration,
        "slots": available_slots
    }

@app.post("/api/appointments")
def create_appointment(payload: AppointmentCreate):
    conn = get_db_connection()

    # Verify service
    service = conn.execute("SELECT * FROM services WHERE id = ?", (payload.service_id,)).fetchone()
    if not service:
        conn.close()
        raise HTTPException(status_code=404, detail="Selected service not found")

    total_duration = service["duration_minutes"]
    service_names_he = [service["name_he"]]
    service_names_en = [service["name_en"]]
    total_price = service["price"]

    if payload.addon_ids:
        for aid in payload.addon_ids:
            addon = conn.execute("SELECT * FROM services WHERE id = ?", (aid,)).fetchone()
            if addon:
                total_duration += addon["duration_minutes"]
                total_price += addon["price"]
                service_names_he.append(f"+ {addon['name_he']}")
                service_names_en.append(f"+ {addon['name_en']}")

    start_min = time_to_minutes(payload.start_time)
    end_min = start_min + total_duration
    end_time_str = minutes_to_time(end_min)

    # Collision Check
    conflict = conn.execute("""
        SELECT id FROM appointments
        WHERE date = ? AND status != 'cancelled'
        AND NOT (end_time <= ? OR start_time >= ?)
    """, (payload.date, payload.start_time, end_time_str)).fetchone()

    if conflict:
        conn.close()
        raise HTTPException(status_code=409, detail="This time slot was just booked by someone else. Please choose another time.")

    code = generate_booking_code()
    notes_with_addons = payload.notes or ""
    if len(service_names_he) > 1:
        notes_with_addons = f"[{' | '.join(service_names_he)}] " + notes_with_addons

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO appointments (
            booking_code, client_name, client_phone, client_email,
            service_id, date, start_time, end_time, status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    """, (
        code,
        payload.client_name.strip(),
        payload.client_phone.strip(),
        payload.client_email.strip() if payload.client_email else "",
        payload.service_id,
        payload.date,
        payload.start_time,
        end_time_str,
        notes_with_addons.strip(),
        created_at
    ))
    conn.commit()

    # Salon settings for WhatsApp notification link
    settings = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()

    wa_num = settings["whatsapp_number"] if settings else ""
    salon_name = settings["salon_name_he"] if settings else "ציפורניים של סתיו"

    # Pre-filled WhatsApp message
    wa_text = (
        f"היי {salon_name}! קבעתי תור חדש באתר 💅\n"
        f"👤 שם: {payload.client_name}\n"
        f"📞 טלפון: {payload.client_phone}\n"
        f"✨ טיפול: {', '.join(service_names_he)}\n"
        f"📅 תאריך: {payload.date}\n"
        f"⏰ שעה: {payload.start_time} - {end_time_str}\n"
        f"🔖 קוד הזמנה: {code}\n"
        f"אשמח לקבל אישור, תודה!"
    )
    import urllib.parse
    wa_url = f"https://wa.me/{wa_num}?text={urllib.parse.quote(wa_text)}"

    return {
        "success": True,
        "booking_code": code,
        "client_name": payload.client_name,
        "date": payload.date,
        "start_time": payload.start_time,
        "end_time": end_time_str,
        "service_name_he": ", ".join(service_names_he),
        "service_name_en": ", ".join(service_names_en),
        "total_price": total_price,
        "duration_minutes": total_duration,
        "whatsapp_url": wa_url
    }

@app.get("/api/appointments/{booking_code}")
def get_appointment(booking_code: str):
    conn = get_db_connection()
    row = conn.execute("""
        SELECT a.*, s.name_he as service_name_he, s.name_en as service_name_en, s.price
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.booking_code = ?
    """, (booking_code,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return dict(row)

@app.get("/api/appointments/ics/{booking_code}")
def get_appointment_ics(booking_code: str):
    conn = get_db_connection()
    appt = conn.execute("""
        SELECT a.*, s.name_he as service_name_he, s.name_en as service_name_en
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.booking_code = ?
    """, (booking_code,)).fetchone()
    settings = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    salon_name = settings["salon_name_he"] if settings else "ציפורניים של סתיו"
    address = settings["address_he"] if settings else "תל אביב"

    # Dates for .ics (YYYYMMDDTHHMMSS)
    d = appt["date"].replace("-", "")
    s_time = appt["start_time"].replace(":", "") + "00"
    e_time = appt["end_time"].replace(":", "") + "00"

    dt_start = f"{d}T{s_time}"
    dt_end = f"{d}T{e_time}"
    created_dt = datetime.now().strftime("%Y%m%dT%H%M%SZ")

    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//{salon_name}//Nail Booking//HE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{booking_code}@glamnails
DTSTAMP:{created_dt}
DTSTART:{dt_start}
DTEND:{dt_end}
SUMMARY:💅 תור ל{appt['service_name_he']} - {salon_name}
DESCRIPTION:תור ב{salon_name}\\nטיפול: {appt['service_name_he']}\\nקוד הזמנה: {booking_code}\\nשם: {appt['client_name']}
LOCATION:{address}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:תזכורת: תור לציפורניים בעוד שעתיים
END:VALARM
END:VEVENT
END:VCALENDAR"""

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=nail_appointment_{booking_code}.ics"}
    )

# --- Reviews Public Endpoints ---

@app.get("/api/reviews")
def get_reviews():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, client_name, rating, comment, created_at
        FROM reviews
        WHERE is_approved = 1
        ORDER BY id DESC
    """).fetchall()
    
    total = len(rows)
    avg_rating = round(sum(r["rating"] for r in rows) / total, 1) if total > 0 else 5.0
    conn.close()
    return {
        "reviews": [dict(r) for r in rows],
        "total": total,
        "avg_rating": avg_rating
    }

@app.post("/api/reviews")
def create_review(payload: ReviewCreate):
    name = payload.client_name.strip()
    comment = payload.comment.strip()
    if not name or not comment:
        raise HTTPException(status_code=400, detail="נא למלא שם ותוכן חוות דעת")
    
    created_at = datetime.now().strftime("%d/%m/%Y")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reviews (client_name, rating, comment, created_at, is_approved)
        VALUES (?, ?, ?, ?, 1)
    """, (name, payload.rating, comment, created_at))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id, "message": "חוות הדעת נשמרה בהצלחה"}

# --- Admin Endpoints ---

@app.post("/api/admin/login")
def admin_login(payload: AdminLogin):
    conn = get_db_connection()
    row = conn.execute("SELECT admin_pin FROM settings WHERE id = 1").fetchone()
    conn.close()
    expected = row["admin_pin"] if row else "1234"
    if payload.pin == expected:
        return {"success": True, "token": expected}
    raise HTTPException(status_code=401, detail="קוד PIN שגוי")

@app.get("/api/admin/appointments")
def admin_get_appointments(
    date_filter: Optional[str] = Query(None, alias="date"),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    _: bool = Depends(verify_admin_pin)
):
    conn = get_db_connection()
    query = """
        SELECT a.*, s.name_he as service_name_he, s.name_en as service_name_en, s.price, s.duration_minutes
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE 1=1
    """
    params = []
    if date_filter:
        query += " AND a.date = ?"
        params.append(date_filter)
    if status_filter and status_filter != "all":
        query += " AND a.status = ?"
        params.append(status_filter)
    if search:
        query += " AND (a.client_name LIKE ? OR a.client_phone LIKE ? OR a.booking_code LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY a.date DESC, a.start_time ASC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.patch("/api/admin/appointments/{appt_id}")
def admin_update_appointment(
    appt_id: int,
    payload: AppointmentStatusUpdate,
    _: bool = Depends(verify_admin_pin)
):
    conn = get_db_connection()
    appt = conn.execute("SELECT * FROM appointments WHERE id = ?", (appt_id,)).fetchone()
    if not appt:
        conn.close()
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_date = payload.date if payload.date else appt["date"]
    new_start = payload.start_time if payload.start_time else appt["start_time"]
    new_status = payload.status if payload.status else appt["status"]
    new_notes = payload.notes if payload.notes is not None else appt["notes"]

    # If rescheduling, recompute end time and verify no collision
    if payload.date or payload.start_time:
        service = conn.execute("SELECT duration_minutes FROM services WHERE id = ?", (appt["service_id"],)).fetchone()
        dur = service["duration_minutes"] if service else 60
        s_min = time_to_minutes(new_start)
        e_min = s_min + dur
        new_end = minutes_to_time(e_min)

        conflict = conn.execute("""
            SELECT id FROM appointments
            WHERE date = ? AND status != 'cancelled' AND id != ?
            AND NOT (end_time <= ? OR start_time >= ?)
        """, (new_date, appt_id, new_start, new_end)).fetchone()
        if conflict:
            conn.close()
            raise HTTPException(status_code=409, detail="המועד שנבחר מתנגש עם תור קיים.")
    else:
        new_end = appt["end_time"]

    conn.execute("""
        UPDATE appointments
        SET status = ?, notes = ?, date = ?, start_time = ?, end_time = ?
        WHERE id = ?
    """, (new_status, new_notes, new_date, new_start, new_end, appt_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Updated appointment"}

@app.delete("/api/admin/appointments/{appt_id}")
def admin_delete_appointment(appt_id: int, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    conn.execute("DELETE FROM appointments WHERE id = ?", (appt_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/admin/appointments")
def admin_create_appointment(payload: AppointmentCreate, _: bool = Depends(verify_admin_pin)):
    return create_appointment(payload)

@app.get("/api/admin/stats")
def admin_get_stats(_: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    today_str = date.today().strftime("%Y-%m-%d")
    month_prefix = date.today().strftime("%Y-%m")

    today_count = conn.execute(
        "SELECT COUNT(*) FROM appointments WHERE date = ? AND status != 'cancelled'", (today_str,)
    ).fetchone()[0]

    month_appts = conn.execute("""
        SELECT a.status, s.price FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.date LIKE ? AND a.status != 'cancelled'
    """, (f"{month_prefix}%",)).fetchall()

    month_count = len(month_appts)
    month_revenue = sum(r["price"] for r in month_appts)

    # Top services
    top_services = conn.execute("""
        SELECT s.name_he, COUNT(a.id) as count
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.status != 'cancelled'
        GROUP BY s.id
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()

    conn.close()
    return {
        "today_appointments": today_count,
        "month_appointments": month_count,
        "month_revenue": month_revenue,
        "top_services": [dict(r) for r in top_services]
    }

# Services management
@app.get("/api/admin/services")
def admin_get_services(_: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM services ORDER BY sort_order ASC, id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/admin/services")
def admin_create_service(payload: ServiceCreate, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO services (
            category, name_he, name_en, duration_minutes, price,
            description_he, description_en, badge_he, badge_en, icon,
            is_active, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.category, payload.name_he, payload.name_en, payload.duration_minutes,
        payload.price, payload.description_he, payload.description_en,
        payload.badge_he, payload.badge_en, payload.icon or "sparkles",
        payload.is_active, payload.sort_order
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id}

@app.put("/api/admin/services/{service_id}")
def admin_update_service(service_id: int, payload: ServiceCreate, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    conn.execute("""
        UPDATE services SET
            category = ?, name_he = ?, name_en = ?, duration_minutes = ?,
            price = ?, description_he = ?, description_en = ?,
            badge_he = ?, badge_en = ?, icon = ?, is_active = ?, sort_order = ?
        WHERE id = ?
    """, (
        payload.category, payload.name_he, payload.name_en, payload.duration_minutes,
        payload.price, payload.description_he, payload.description_en,
        payload.badge_he, payload.badge_en, payload.icon,
        payload.is_active, payload.sort_order, service_id
    ))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/admin/services/{service_id}")
def admin_delete_service(service_id: int, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    # Check if existing appointments reference it
    count = conn.execute("SELECT COUNT(*) FROM appointments WHERE service_id = ?", (service_id,)).fetchone()[0]
    if count > 0:
        # Soft delete: deactivate
        conn.execute("UPDATE services SET is_active = 0 WHERE id = ?", (service_id,))
    else:
        conn.execute("DELETE FROM services WHERE id = ?", (service_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# Business hours management
@app.get("/api/admin/hours")
def admin_get_hours(_: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM business_hours ORDER BY day_of_week ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.put("/api/admin/hours")
def admin_update_hours(payload: List[BusinessHourUpdate], _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    for h in payload:
        conn.execute("""
            UPDATE business_hours SET
                is_open = ?, open_time = ?, close_time = ?, break_start = ?, break_end = ?
            WHERE day_of_week = ?
        """, (h.is_open, h.open_time, h.close_time, h.break_start, h.break_end, h.day_of_week))
    conn.commit()
    conn.close()
    return {"success": True}

# Settings management
@app.get("/api/admin/settings")
def admin_get_settings(_: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()
    return dict(row)

@app.put("/api/admin/settings")
def admin_update_settings(payload: SettingsUpdate, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    conn.execute("""
        UPDATE settings SET
            salon_name_he = ?, salon_name_en = ?, phone = ?, whatsapp_number = ?,
            address_he = ?, address_en = ?, instagram = ?, admin_pin = ?,
            cancellation_policy_he = ?, cancellation_policy_en = ?,
            slot_interval_minutes = ?
        WHERE id = 1
    """, (
        payload.salon_name_he, payload.salon_name_en, payload.phone, payload.whatsapp_number,
        payload.address_he, payload.address_en, payload.instagram, payload.admin_pin,
        payload.cancellation_policy_he, payload.cancellation_policy_en,
        payload.slot_interval_minutes
    ))
    conn.commit()
    conn.close()
    return {"success": True}

# Admin reviews management
@app.get("/api/admin/reviews")
def admin_get_reviews(_: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM reviews ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.delete("/api/admin/reviews/{review_id}")
def admin_delete_review(review_id: int, _: bool = Depends(verify_admin_pin)):
    conn = get_db_connection()
    conn.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    conn.commit()
    conn.close()
    return {"success": True}

# Serve static files & frontend pages
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Nail Salon Booking API is running. Frontend static/index.html is being prepared."}

@app.get("/admin")
def serve_admin():
    admin_path = os.path.join(STATIC_DIR, "admin.html")
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    return {"message": "Admin portal static/admin.html is being prepared."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

