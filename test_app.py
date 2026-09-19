import sys
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("--- 1. Testing GET /api/settings ---")
    res = client.get("/api/settings")
    assert res.status_code == 200, f"Failed settings: {res.status_code}"
    settings = res.json()
    assert "salon_name_he" in settings
    print("Settings OK:", settings["salon_name_he"])

    print("\n--- 2. Testing GET /api/services ---")
    res = client.get("/api/services")
    assert res.status_code == 200, f"Failed services: {res.status_code}"
    services = res.json()
    assert len(services) > 0
    print(f"Loaded {len(services)} services successfully.")
    first_service_id = services[0]["id"]

    print("\n--- 3. Testing GET /api/availability ---")
    # Find a future weekday (e.g. 3 days from now)
    future_date = (date.today() + timedelta(days=3))
    # If it's Saturday, shift to Sunday
    if (future_date.weekday() + 1) % 7 == 6:
        future_date += timedelta(days=1)
    future_date_str = future_date.strftime("%Y-%m-%d")

    res = client.get(f"/api/availability?date={future_date_str}&service_id={first_service_id}")
    assert res.status_code == 200, f"Failed availability: {res.status_code} {res.text}"
    avail = res.json()
    assert avail["is_open"] is True
    assert len(avail["slots"]) > 0, "No available slots returned for open day"
    chosen_slot = avail["slots"][0]["time"]
    print(f"Date {future_date_str} is open with {len(avail['slots'])} slots. First slot: {chosen_slot}")

    print("\n--- 4. Testing POST /api/appointments ---")
    booking_payload = {
        "client_name": "מיכל ישראלי",
        "client_phone": "052-9876543",
        "client_email": "michal@example.com",
        "service_id": first_service_id,
        "addon_ids": [],
        "date": future_date_str,
        "start_time": chosen_slot,
        "notes": "טיפול ראשון בסטודיו"
    }
    res = client.post("/api/appointments", json=booking_payload)
    assert res.status_code == 200, f"Failed appointment creation: {res.status_code} {res.text}"
    booking_data = res.json()
    assert booking_data["success"] is True
    assert "booking_code" in booking_data
    assert "whatsapp_url" in booking_data
    booking_code = booking_data["booking_code"]
    print(f"Appointment created successfully! Code: {booking_code}, WhatsApp link generated.")

    print("\n--- 5. Testing Slot Collision Prevention ---")
    # Trying to book the exact same slot again should fail with 409
    res_conflict = client.post("/api/appointments", json=booking_payload)
    assert res_conflict.status_code == 409, f"Expected 409 conflict, got {res_conflict.status_code}"
    print("Collision prevention verified: double booking prevented with 409 Conflict.")

    print("\n--- 6. Testing GET /api/appointments/ics/{code} ---")
    res_ics = client.get(f"/api/appointments/ics/{booking_code}")
    assert res_ics.status_code == 200, f"Failed .ics: {res_ics.status_code}"
    assert "BEGIN:VCALENDAR" in res_ics.text
    assert booking_code in res_ics.text
    print("iCalendar (.ics) download verified successfully.")

    print("\n--- 7. Testing Admin Authentication & Endpoints ---")
    # Wrong PIN
    res_bad_login = client.post("/api/admin/login", json={"pin": "wrong"})
    assert res_bad_login.status_code == 401

    # Correct PIN
    res_login = client.post("/api/admin/login", json={"pin": "1234"})
    assert res_login.status_code == 200

    admin_headers = {"x-admin-pin": "1234"}

    # Fetch appointments
    res_appts = client.get("/api/admin/appointments", headers=admin_headers)
    assert res_appts.status_code == 200
    all_appts = res_appts.json()
    found = any(a["booking_code"] == booking_code for a in all_appts)
    assert found, "Created appointment not found in admin list"
    appt_id = [a["id"] for a in all_appts if a["booking_code"] == booking_code][0]

    # Update appointment status to 'completed'
    res_update = client.patch(f"/api/admin/appointments/{appt_id}", headers=admin_headers, json={"status": "completed"})
    assert res_update.status_code == 200

    # Fetch admin stats
    res_stats = client.get("/api/admin/stats", headers=admin_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "month_appointments" in stats
    print("Admin stats verified:", stats)

    print("\n--- 8. Testing Reviews API (Public & Admin) ---")
    res_revs = client.get("/api/reviews")
    assert res_revs.status_code == 200

    review_payload = {
        "client_name": "שירן מזרחי",
        "rating": 5,
        "comment": "סתיו פשוט אלופה! הציפורניים מחזיקות מושלם והיחס הכי חם ואישי שיש."
    }
    res_post_rev = client.post("/api/reviews", json=review_payload)
    assert res_post_rev.status_code == 200, f"Failed review post: {res_post_rev.text}"
    rev_id = res_post_rev.json()["id"]

    res_revs_after = client.get("/api/reviews")
    assert res_revs_after.status_code == 200
    revs_data = res_revs_after.json()
    assert revs_data["total"] >= 1
    assert any(r["id"] == rev_id for r in revs_data["reviews"])

    res_admin_revs = client.get("/api/admin/reviews", headers=admin_headers)
    assert res_admin_revs.status_code == 200
    assert any(r["id"] == rev_id for r in res_admin_revs.json())
    print(f"Reviews API verified! Added review id={rev_id}, total={revs_data['total']}")

    print("\n--- 9. Testing Frontend Static Delivery ---")
    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "ציפורניים של סתיו" in res_index.text or "Stav's Nails" in res_index.text

    res_admin = client.get("/admin")
    assert res_admin.status_code == 200
    assert "ניהול סטודיו" in res_admin.text

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()
