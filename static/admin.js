// Admin State
let adminState = {
  pin: sessionStorage.getItem('salon_admin_pin') || '',
  services: [],
  appointments: [],
  hours: [],
  reviews: [],
  settings: {}
};

document.addEventListener('DOMContentLoaded', () => {
  if (adminState.pin) {
    checkPinAndInit();
  } else {
    document.getElementById('authOverlay').style.display = 'flex';
  }
});

async function handleAdminLogin(e) {
  if (e) e.preventDefault();
  const pin = document.getElementById('adminPinInput').value.trim();

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });

    if (res.ok) {
      adminState.pin = pin;
      sessionStorage.setItem('salon_admin_pin', pin);
      document.getElementById('authOverlay').style.display = 'none';
      initAdminDashboard();
    } else {
      alert('קוד PIN שגוי, נסי שוב.');
    }
  } catch (err) {
    alert('שגיאת תקשורת עם השרת');
    console.error(err);
  }
}

async function checkPinAndInit() {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminState.pin })
    });
    if (res.ok) {
      document.getElementById('authOverlay').style.display = 'none';
      initAdminDashboard();
    } else {
      sessionStorage.removeItem('salon_admin_pin');
      document.getElementById('authOverlay').style.display = 'flex';
    }
  } catch (err) {
    document.getElementById('authOverlay').style.display = 'flex';
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('salon_admin_pin');
  adminState.pin = '';
  location.reload();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-pin': adminState.pin
  };
}

async function initAdminDashboard() {
  await loadStats();
  await loadAppointments();
  await loadAdminServices();
  await loadBusinessHours();
  await loadAdminReviews();
  await loadSalonSettings();

  // Set today's date in manual booking modal
  const todayStr = new Date().toISOString().split('T')[0];
  const manualDateInput = document.getElementById('manualDate');
  if (manualDateInput) manualDateInput.value = todayStr;
}

// Navigation Tabs
function switchAdminTab(tabId, btn) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
  if (tabId === 'appts') document.getElementById('tabViewAppts').classList.add('active');
  if (tabId === 'services') document.getElementById('tabViewServices').classList.add('active');
  if (tabId === 'hours') document.getElementById('tabViewHours').classList.add('active');
  if (tabId === 'reviews') document.getElementById('tabViewReviews').classList.add('active');
  if (tabId === 'settings') document.getElementById('tabViewSettings').classList.add('active');
}

// 1. Stats
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('statTodayCount').innerText = data.today_appointments;
      document.getElementById('statMonthCount').innerText = data.month_appointments;
      document.getElementById('statMonthRevenue').innerText = `${data.month_revenue.toLocaleString()} ₪`;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// 2. Appointments
async function loadAppointments() {
  const dateVal = document.getElementById('filterDateInput').value;
  const statusVal = document.getElementById('filterStatusSelect').value;
  const searchVal = document.getElementById('searchClientInput').value.trim();

  let url = '/api/admin/appointments?';
  const params = [];
  if (dateVal) params.push(`date=${dateVal}`);
  if (statusVal && statusVal !== 'all') params.push(`status=${statusVal}`);
  if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);

  url += params.join('&');

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) {
      adminState.appointments = await res.json();
      renderAppointmentsTable();
    }
  } catch (err) {
    console.error('Failed to load appointments:', err);
  }
}

function filterDateShortcut(type) {
  const dateInput = document.getElementById('filterDateInput');
  const d = new Date();

  if (type === 'today') {
    dateInput.value = d.toISOString().split('T')[0];
  } else if (type === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    dateInput.value = d.toISOString().split('T')[0];
  } else if (type === 'all') {
    dateInput.value = '';
  }
  loadAppointments();
}

function renderAppointmentsTable() {
  const tbody = document.getElementById('apptsTableBody');
  const noMsg = document.getElementById('noApptsMsg');
  tbody.innerHTML = '';

  if (adminState.appointments.length === 0) {
    noMsg.style.display = 'block';
    return;
  }
  noMsg.style.display = 'none';

  adminState.appointments.forEach(a => {
    const tr = document.createElement('tr');

    // Phone cleanup for WhatsApp
    let cleanPhone = a.client_phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.slice(1);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`היי ${a.client_name}, תזכורת לתור שלך ב${a.date} בשעה ${a.start_time} 💅`)}`;

    const statusLabels = {
      confirmed: 'מאושר',
      completed: 'הושלם',
      cancelled: 'מבוטל',
      no_show: 'לא הגיעה'
    };

    tr.innerHTML = `
      <td>
        <strong>${a.date}</strong><br>
        <span style="color: var(--primary-dark); font-weight: 700;">${a.start_time} - ${a.end_time}</span>
      </td>
      <td>
        <strong>${a.client_name}</strong><br>
        <small style="color: var(--text-light);">${a.booking_code}</small>
      </td>
      <td>
        <a href="tel:${a.client_phone}" style="color: var(--text-main); font-weight: 600;">${a.client_phone}</a>
        <a href="${waUrl}" target="_blank" class="btn-action-sm btn-wa-sm" title="הודעת וואטסאפ ללקוחה">
          💬 וואטסאפ
        </a>
      </td>
      <td>
        <strong>${a.service_name_he}</strong><br>
        <small style="color: var(--text-muted);">${a.duration_minutes} דק'</small>
      </td>
      <td><strong>${a.price} ₪</strong></td>
      <td>
        <span class="status-badge status-${a.status}">
          ${statusLabels[a.status] || a.status}
        </span>
      </td>
      <td style="max-width: 160px; font-size: 12.5px; color: var(--text-muted);">
        ${a.notes || '-'}
      </td>
      <td>
        <select onchange="updateAppointmentStatus(${a.id}, this.value)" class="form-input" style="padding: 4px 8px; font-size: 12px; width: auto; display: inline-block;">
          <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>מאושר</option>
          <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>הושלם</option>
          <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>ביטול</option>
          <option value="no_show" ${a.status === 'no_show' ? 'selected' : ''}>לא הגיעה</option>
        </select>
        <button onclick="deleteAppointment(${a.id})" class="btn-action-sm" style="color: #dc2626;" title="מחיקת תור">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateAppointmentStatus(apptId, newStatus) {
  try {
    const res = await fetch(`/api/admin/appointments/${apptId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      loadStats();
      loadAppointments();
    } else {
      alert('שגיאה בעדכון סטטוס');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteAppointment(apptId) {
  if (!confirm('האם את בטוחה שברצונך למחוק תור זה לחלוטין?')) return;
  try {
    const res = await fetch(`/api/admin/appointments/${apptId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      loadStats();
      loadAppointments();
    }
  } catch (err) {
    console.error(err);
  }
}

// Manual Booking Modal
function openManualBookingModal() {
  document.getElementById('manualBookingModal').classList.add('active');
  const select = document.getElementById('manualServiceSelect');
  select.innerHTML = '';
  adminState.services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.innerText = `${s.name_he} (${s.price} ₪, ${s.duration_minutes} דק')`;
    select.appendChild(opt);
  });
}

function closeManualBookingModal() {
  document.getElementById('manualBookingModal').classList.remove('active');
}

async function handleManualBookingSubmit(e) {
  e.preventDefault();
  const payload = {
    client_name: document.getElementById('manualName').value.trim(),
    client_phone: document.getElementById('manualPhone').value.trim(),
    service_id: parseInt(document.getElementById('manualServiceSelect').value),
    date: document.getElementById('manualDate').value,
    start_time: document.getElementById('manualStartTime').value,
    notes: document.getElementById('manualNotes').value.trim()
  };

  try {
    const res = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(`התור נקבע בהצלחה! קוד: ${data.booking_code}`);
      closeManualBookingModal();
      loadStats();
      loadAppointments();
    } else {
      alert(data.detail || 'שגיאה בשמירת התור');
    }
  } catch (err) {
    alert('שגיאת תקשורת');
    console.error(err);
  }
}

// 3. Services Management
async function loadAdminServices() {
  try {
    const res = await fetch('/api/admin/services', { headers: authHeaders() });
    if (res.ok) {
      adminState.services = await res.json();
      renderAdminServicesTable();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderAdminServicesTable() {
  const tbody = document.getElementById('adminServicesTableBody');
  tbody.innerHTML = '';

  adminState.services.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${s.name_he}</strong><br>
        <small style="color: var(--text-light);">${s.name_en || ''}</small>
      </td>
      <td>${s.category}</td>
      <td>${s.duration_minutes} דק'</td>
      <td><strong>${s.price} ₪</strong></td>
      <td>${s.badge_he ? `<span class="service-badge" style="position: static;">${s.badge_he}</span>` : '-'}</td>
      <td>
        <button onclick="editService(${s.id})" class="btn-action-sm">✏️ עריכה</button>
        <button onclick="deleteService(${s.id})" class="btn-action-sm" style="color: #dc2626;">🗑️ מחיקה</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openNewServiceModal() {
  document.getElementById('serviceModalTitle').innerText = 'הוספת טיפול חדש';
  document.getElementById('editServiceId').value = '';
  document.getElementById('srvNameHe').value = '';
  document.getElementById('srvNameEn').value = '';
  document.getElementById('srvDuration').value = '60';
  document.getElementById('srvPrice').value = '140';
  document.getElementById('srvDescHe').value = '';
  document.getElementById('srvBadgeHe').value = '';
  document.getElementById('serviceModal').classList.add('active');
}

function editService(id) {
  const s = adminState.services.find(item => item.id === id);
  if (!s) return;

  document.getElementById('serviceModalTitle').innerText = 'עריכת טיפול';
  document.getElementById('editServiceId').value = s.id;
  document.getElementById('srvNameHe').value = s.name_he;
  document.getElementById('srvNameEn').value = s.name_en || '';
  document.getElementById('srvCategory').value = s.category;
  document.getElementById('srvDuration').value = s.duration_minutes;
  document.getElementById('srvPrice').value = s.price;
  document.getElementById('srvDescHe').value = s.description_he || '';
  document.getElementById('srvBadgeHe').value = s.badge_he || '';
  document.getElementById('serviceModal').classList.add('active');
}

function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('active');
}

async function saveServiceForm(e) {
  e.preventDefault();
  const id = document.getElementById('editServiceId').value;
  const payload = {
    category: document.getElementById('srvCategory').value,
    name_he: document.getElementById('srvNameHe').value.trim(),
    name_en: document.getElementById('srvNameEn').value.trim() || document.getElementById('srvNameHe').value.trim(),
    duration_minutes: parseInt(document.getElementById('srvDuration').value),
    price: parseFloat(document.getElementById('srvPrice').value),
    description_he: document.getElementById('srvDescHe').value.trim(),
    description_en: '',
    badge_he: document.getElementById('srvBadgeHe').value.trim(),
    badge_en: '',
    icon: 'sparkles',
    is_active: 1,
    sort_order: 0
  };

  const url = id ? `/api/admin/services/${id}` : '/api/admin/services';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeServiceModal();
      loadAdminServices();
    } else {
      alert('שגיאה בשמירת הטיפול');
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteService(id) {
  if (!confirm('האם להסיר טיפול זה?')) return;
  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      loadAdminServices();
    }
  } catch (err) {
    console.error(err);
  }
}

// 4. Business Hours
async function loadBusinessHours() {
  try {
    const res = await fetch('/api/admin/hours', { headers: authHeaders() });
    if (res.ok) {
      adminState.hours = await res.json();
      renderBusinessHours();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderBusinessHours() {
  const container = document.getElementById('hoursFormContainer');
  container.innerHTML = '';

  adminState.hours.forEach(h => {
    const row = document.createElement('div');
    row.style.cssText = 'display: grid; grid-template-columns: 120px 100px 1fr 1fr; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border);';
    row.innerHTML = `
      <div style="font-weight: 700;">יום ${h.day_name_he}</div>
      <div>
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13.5px;">
          <input type="checkbox" id="hourOpen_${h.day_of_week}" ${h.is_open ? 'checked' : ''}>
          <span>פעיל</span>
        </label>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 12px; color: var(--text-muted);">פתיחה:</span>
        <input type="time" id="hourStart_${h.day_of_week}" class="form-input" value="${h.open_time}" style="padding: 4px 8px; font-size: 13px;">
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 12px; color: var(--text-muted);">סגירה:</span>
        <input type="time" id="hourEnd_${h.day_of_week}" class="form-input" value="${h.close_time}" style="padding: 4px 8px; font-size: 13px;">
      </div>
    `;
    container.appendChild(row);
  });
}

async function saveBusinessHours() {
  const updatedHours = adminState.hours.map(h => {
    const isOpen = document.getElementById(`hourOpen_${h.day_of_week}`).checked ? 1 : 0;
    const openTime = document.getElementById(`hourStart_${h.day_of_week}`).value;
    const closeTime = document.getElementById(`hourEnd_${h.day_of_week}`).value;
    return {
      day_of_week: h.day_of_week,
      is_open: isOpen,
      open_time: openTime,
      close_time: closeTime,
      break_start: h.break_start || '',
      break_end: h.break_end || ''
    };
  });

  try {
    const res = await fetch('/api/admin/hours', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updatedHours)
    });
    if (res.ok) {
      alert('שעות הפעילות עודכנו בהצלחה!');
      loadBusinessHours();
    } else {
      alert('שגיאה בשמירת שעות פעילות');
    }
  } catch (err) {
    console.error(err);
  }
}

// 5. Studio Settings
async function loadSalonSettings() {
  try {
    const res = await fetch('/api/admin/settings', { headers: authHeaders() });
    if (res.ok) {
      adminState.settings = await res.json();
      document.getElementById('settingNameHe').value = adminState.settings.salon_name_he || '';
      document.getElementById('settingNameEn').value = adminState.settings.salon_name_en || '';
      document.getElementById('settingPhone').value = adminState.settings.phone || '';
      document.getElementById('settingWa').value = adminState.settings.whatsapp_number || '';
      document.getElementById('settingAddress').value = adminState.settings.address_he || '';
      document.getElementById('settingPin').value = adminState.settings.admin_pin || '1234';
      document.getElementById('settingPolicy').value = adminState.settings.cancellation_policy_he || '';
      document.getElementById('adminSalonTitle').innerText = `ניהול ${adminState.settings.salon_name_he}`;
    }
  } catch (err) {
    console.error(err);
  }
}

async function saveSalonSettings(e) {
  e.preventDefault();
  const payload = {
    salon_name_he: document.getElementById('settingNameHe').value.trim(),
    salon_name_en: document.getElementById('settingNameEn').value.trim(),
    phone: document.getElementById('settingPhone').value.trim(),
    whatsapp_number: document.getElementById('settingWa').value.trim(),
    address_he: document.getElementById('settingAddress').value.trim(),
    address_en: document.getElementById('settingAddress').value.trim(),
    instagram: adminState.settings.instagram || '',
    admin_pin: document.getElementById('settingPin').value.trim(),
    cancellation_policy_he: document.getElementById('settingPolicy').value.trim(),
    cancellation_policy_en: '',
    slot_interval_minutes: adminState.settings.slot_interval_minutes || 30
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('הגדרות הסטודיו עודכנו בהצלחה!');
      adminState.pin = payload.admin_pin;
      sessionStorage.setItem('salon_admin_pin', payload.admin_pin);
      loadSalonSettings();
    } else {
      alert('שגיאה בשמירת הגדרות');
    }
  } catch (err) {
    console.error(err);
  }
}

// 6. Reviews Management
async function loadAdminReviews() {
  try {
    const res = await fetch('/api/admin/reviews', { headers: authHeaders() });
    if (res.ok) {
      adminState.reviews = await res.json();
      renderAdminReviewsTable();
    }
  } catch (err) {
    console.error('Failed to load admin reviews:', err);
  }
}

function renderAdminReviewsTable() {
  const tbody = document.getElementById('adminReviewsTableBody');
  const noMsg = document.getElementById('noAdminReviewsMsg');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (adminState.reviews.length === 0) {
    if (noMsg) noMsg.style.display = 'block';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  adminState.reviews.forEach(r => {
    const tr = document.createElement('tr');
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    tr.innerHTML = `
      <td>${r.created_at || '-'}</td>
      <td><strong>${escapeHtml(r.client_name)}</strong></td>
      <td><span style="color: #ffb703; font-size: 15px; letter-spacing: 1px;">${stars}</span></td>
      <td style="max-width: 320px; font-size: 13.5px;">"${escapeHtml(r.comment)}"</td>
      <td>
        <button onclick="deleteAdminReview(${r.id})" class="btn-action-sm" style="color: #dc2626;" title="מחיקת חוות דעת">
          🗑️ מחיקה
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function deleteAdminReview(id) {
  if (!confirm('האם את בטוחה שברצונך למחוק חוות דעת זו?')) return;
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      loadAdminReviews();
    } else {
      alert('שגיאה במחיקת חוות דעת');
    }
  } catch (err) {
    console.error(err);
  }
}
