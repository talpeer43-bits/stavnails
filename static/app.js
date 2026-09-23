// Application State
let appState = {
  lang: 'he',
  settings: {},
  services: [],
  reviews: [],
  reviewsStats: { total: 0, avg_rating: 5.0 },
  currentRatingInput: 5,
  selectedService: null,
  selectedAddons: [],
  selectedDate: null,
  selectedSlot: null,
  currentStep: 1,
  lastBooking: null
};

// Translations
const translations = {
  he: {
    tagline: 'אומנות וטיפוח הציפורן',
    adminLink: 'ניהול סטודיו',
    heroTag: '✨ חווית מניקור ופדיקור יוקרתית',
    heroTitle: 'הציפורניים שלך, <br><span>האומנות והשלמות שלנו.</span>',
    heroDesc: 'מניקור רוסי מדויק, מבנה אנטומי מושלם, לק ג\'ל בעמידות גבוהה וחיזוק הציפורן הטבעית בסטנדרט סטריליזציה ומקצועיות ללא פשרות.',
    bookNowBtn: 'קביעת תור עכשיו',
    exploreServicesBtn: 'מחירון וטיפולים',
    ratingScore: 'חוות דעת של לקוחות אמיתיות',
    featSterile: '100% סטריליזציה ואוֹטוֹקְלָב רפואי',
    featProducts: 'חומרים פרימיום היפואלרגניים בלבד',
    featDurability: 'עמידות מוכחת עד 4 שבועות',
    featAtmosphere: 'קפה מפנק ואווירה בוטיקית אישית',
    servicesSubtitle: 'הטיפולים שלנו',
    servicesTitle: 'בחרי את הטיפול המושלם עבורך',
    servicesHint: 'הקליקי על הטיפול הרצוי לקביעת תור מהירה ונוחה',
    tabAll: 'הכל',
    tabGel: 'לק ג\'ל ומניקור',
    tabExtensions: 'בנייה ומילוי',
    tabPedicure: 'פדיקור',
    tabArt: 'נייל ארט ושדרוגים',
    stylesSubtitle: 'סגנונות ואומנות',
    stylesTitle: 'ההשראות המובילות של הסטודיו',
    styleChrome: 'Glazed Donut & Chrome',
    styleFrench: 'Micro French & Nude Chic',
    styleOmbre: 'Baby Boomer & Ombré',
    styleArt: 'Abstract Nail Art',
    reviewsSubtitle: 'ביקורות לקוחות',
    reviewsTitle: 'חוות דעת (ביקורות)',
    writeReviewBtn: 'כתיבת חוות דעת',
    reviewModalTitle: 'כתיבת חוות דעת לסטודיו',
    reviewRatingLabel: 'הדירוג שלך: *',
    reviewNameLabel: 'השם שלך *',
    reviewCommentLabel: 'איך הייתה החוויה שלך אצל סתיו? *',
    submitReviewBtn: 'פרסום חוות דעת',
    btnCancel: 'ביטול',
    modalBookingTitle: 'קביעת תור',
    step1Name: 'טיפול',
    step2Name: 'מועד ושעה',
    step3Name: 'פרטים ואישור',
    selectPrimaryPrompt: 'בחרי את הטיפול הראשי:',
    addonsTitle: 'תוספות ושדרוגים מומלצים:',
    chooseDateLabel: 'בחרי תאריך:',
    chooseTimeLabel: 'שעות פנויות:',
    noSlotsMsg: 'אין שעות פנויות בתאריך זה, אנא בחרי תאריך אחר.',
    sumTreatment: 'טיפול שנבחר:',
    sumDateTime: 'מועד:',
    sumDuration: 'משך משוער:',
    sumPrice: 'מחיר כולל:',
    sumName: 'שם הלקוח/ה:',
    clientNameLabel: 'שם מלא *',
    clientPhoneLabel: 'מספר טלפון (וואטסאפ) *',
    clientEmailLabel: 'אימייל (לקבלת הודעת אישור התור) *',
    clientNotesLabel: 'הערות / בקשות מיוחדות',
    confSuccessTitle: 'בקשת התור התקבלה וממתינה לאישור!',
    confSubtitle: 'פרטי הבקשה נשלחו ישירות לסטודיו. סתיו תאשר את התור ותקבלי הודעת אישור למייל שלך!',
    confEmailBtn: 'שליחת מייל לסטודיו',
    confIcsBtn: 'הוסיפי ליומן (Google / Apple Calendar)',
    confCloseBtn: 'סגור / קבעי תור נוסף',
    btnBack: 'חזור',
    btnContinue: 'המשך',
    footerAbout: 'הקפדה בלתי מתפשרת על בריאות הציפורן, חיטוי רפואי, חומרים מובחרים ועיצובים ייחודיים שמתאימים בדיוק לאופי שלך.',
    footerHoursTitle: 'שעות פעילות',
    footerSunThu: 'ראשון - חמישי:',
    footerFri: 'שישי:',
    footerSat: 'שבת:',
    closed: 'סגור',
    footerContactTitle: 'יצירת קשר',
    footerWaText: 'וואטסאפ לסטודיו',
    btnSelect: 'קבעי תור',
    minutes: 'דק\'',
    confirmBookingBtn: 'אשרי והזמיני תור'
  },
  en: {
    tagline: 'Art & Nail Care Studio',
    adminLink: 'Studio Portal',
    heroTag: '✨ Luxury Manicure & Pedicure Experience',
    heroTitle: 'Your Nails, <br><span>Our Art & Perfection.</span>',
    heroDesc: 'Precision Russian manicure, anatomical apex architecture, durable premium gel polish, and natural nail reinforcement with strict hospital-grade sterilization.',
    bookNowBtn: 'Book Appointment Now',
    exploreServicesBtn: 'View Services & Pricing',
    ratingScore: 'Authentic Client Reviews',
    featSterile: '100% Medical Autoclave Sterilization',
    featProducts: 'Hypoallergenic Premium Materials Only',
    featDurability: 'Proven 4-Week Long-Lasting Wear',
    featAtmosphere: 'Boutique Relaxing Studio & Gourmet Coffee',
    servicesSubtitle: 'Our Treatments',
    servicesTitle: 'Choose Your Perfect Treatment',
    servicesHint: 'Select any service to begin booking online instantly',
    tabAll: 'All',
    tabGel: 'Gel & Manicure',
    tabExtensions: 'Extensions & Refills',
    tabPedicure: 'Pedicure',
    tabArt: 'Nail Art & Add-ons',
    stylesSubtitle: 'Styles & Art',
    stylesTitle: 'Signature Studio Inspirations',
    styleChrome: 'Glazed Donut & Chrome',
    styleFrench: 'Micro French & Nude Chic',
    styleOmbre: 'Baby Boomer & Ombré',
    styleArt: 'Abstract Nail Art',
    reviewsSubtitle: 'Client Reviews',
    reviewsTitle: 'Authentic Client Experiences',
    writeReviewBtn: 'Write a Review',
    reviewModalTitle: 'Leave a Studio Review',
    reviewRatingLabel: 'Your Rating: *',
    reviewNameLabel: 'Your Name *',
    reviewCommentLabel: 'How was your experience with Stav? *',
    submitReviewBtn: 'Post Review',
    btnCancel: 'Cancel',
    modalBookingTitle: 'Book Appointment',
    step1Name: 'Service',
    step2Name: 'Date & Time',
    step3Name: 'Details & Confirmation',
    selectPrimaryPrompt: 'Choose your main service:',
    addonsTitle: 'Recommended Upgrades & Add-ons:',
    chooseDateLabel: 'Select Date:',
    chooseTimeLabel: 'Available Time Slots:',
    noSlotsMsg: 'No available slots on this date, please choose another day.',
    sumTreatment: 'Selected Service:',
    sumDateTime: 'Date & Time:',
    sumDuration: 'Estimated Duration:',
    sumPrice: 'Total Price:',
    sumName: 'Client Name:',
    clientNameLabel: 'Full Name *',
    clientPhoneLabel: 'Phone Number (WhatsApp) *',
    clientEmailLabel: 'Email (to receive booking confirmation) *',
    clientNotesLabel: 'Notes / Special Requests',
    confSuccessTitle: 'Booking Request Received!',
    confSubtitle: 'Your booking request was sent to the studio. Stav will confirm it and you will receive an email confirmation!',
    confEmailBtn: 'Send Email to Studio',
    confIcsBtn: 'Add to Calendar (Google / Apple)',
    confCloseBtn: 'Close / Book Another',
    btnBack: 'Back',
    btnContinue: 'Continue',
    footerAbout: 'Uncompromising dedication to nail health, autoclave sterilization, premium pigments, and bespoke art suited to your style.',
    footerHoursTitle: 'Working Hours',
    footerSunThu: 'Sunday - Thursday:',
    footerFri: 'Friday:',
    footerSat: 'Saturday:',
    closed: 'Closed',
    footerContactTitle: 'Contact Us',
    footerWaText: 'WhatsApp Chat',
    btnSelect: 'Select & Book',
    minutes: 'min',
    confirmBookingBtn: 'Confirm & Book Now'
  }
};

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// DOM Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadServices();
  await loadReviews();
  renderDatePills();
  applyLanguage(appState.lang);
});

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      appState.settings = await res.json();
      updateSalonBranding();
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

function updateSalonBranding() {
  const isHe = appState.lang === 'he';
  const name = isHe ? appState.settings.salon_name_he : appState.settings.salon_name_en;
  const address = isHe ? appState.settings.address_he : appState.settings.address_en;

  if (name) {
    document.getElementById('navSalonName').innerText = name;
    document.getElementById('footerSalonName').innerText = name;
    document.getElementById('copyrightSalonName').innerText = name;
    document.title = `${name} | ${isHe ? 'קביעת תור אונליין' : 'Book Appointment'}`;
  }
  const phoneEl = document.getElementById('footerPhone');
  if (phoneEl && appState.settings.phone) {
    phoneEl.innerText = appState.settings.phone;
    const phoneLinkEl = document.getElementById('footerPhoneLink');
    if (phoneLinkEl) phoneLinkEl.href = `tel:${appState.settings.phone}`;
  }
  if (address) {
    const addressEl = document.getElementById('footerAddress');
    if (addressEl) addressEl.innerText = address;
  }
  const waLinkEl = document.getElementById('footerWaLink');
  if (waLinkEl && appState.settings.whatsapp_number) {
    waLinkEl.href = `https://wa.me/${appState.settings.whatsapp_number}`;
  }
  if (appState.settings.cancellation_policy_he) {
    document.getElementById('cancellationNotice').innerText = isHe
      ? `* ${appState.settings.cancellation_policy_he}`
      : `* ${appState.settings.cancellation_policy_en}`;
  }
}

async function loadServices() {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      appState.services = await res.json();
      renderServiceCards(appState.services);
      renderModalServiceList();
    }
  } catch (err) {
    console.error('Failed to load services:', err);
  }
}

function renderServiceCards(servicesList) {
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';

  const isHe = appState.lang === 'he';
  const t = translations[appState.lang];
  const currency = appState.settings.currency_symbol || '₪';

  servicesList.forEach(srv => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.dataset.category = srv.category;

    const title = isHe ? srv.name_he : srv.name_en;
    const desc = isHe ? srv.description_he : srv.description_en;
    const badge = isHe ? srv.badge_he : srv.badge_en;

    card.innerHTML = `
      ${badge ? `<div class="service-badge">${badge}</div>` : ''}
      <div class="service-header">
        <h3 class="service-name">${title}</h3>
      </div>
      <p class="service-desc">${desc || ''}</p>
      <div class="service-footer">
        <div class="service-price-block">
          <span class="service-price">${srv.price} ${currency}</span>
          <span class="service-duration">⏱ ${srv.duration_minutes} ${t.minutes}</span>
        </div>
        <button class="btn-book-service" onclick="selectServiceAndOpen(${srv.id})">
          ${t.btnSelect}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterCategory(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    if (cat === 'all' || card.dataset.category === cat) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Modal & Booking Wizard
function openBookingModal() {
  document.getElementById('bookingModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setStep(1);
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
  document.body.style.overflow = '';
}

function selectServiceAndOpen(serviceId) {
  const srv = appState.services.find(s => s.id === serviceId);
  if (srv) {
    appState.selectedService = srv;
  }
  openBookingModal();
  renderModalServiceList();
}

function renderModalServiceList() {
  const listEl = document.getElementById('modalServiceList');
  const addonsGrid = document.getElementById('modalAddonsGrid');
  if (!listEl || !addonsGrid) return;

  listEl.innerHTML = '';
  addonsGrid.innerHTML = '';

  const isHe = appState.lang === 'he';
  const t = translations[appState.lang];
  const currency = appState.settings.currency_symbol || '₪';

  // Separate main services and add-on services (care / art can act as add-ons)
  const mainServices = appState.services.filter(s => s.category !== 'art' && s.category !== 'care');
  const addons = appState.services.filter(s => s.category === 'art' || s.category === 'care');

  // Default selection if none selected
  if (!appState.selectedService && mainServices.length > 0) {
    appState.selectedService = mainServices[0];
  }

  mainServices.forEach(srv => {
    const item = document.createElement('div');
    const isSelected = appState.selectedService && appState.selectedService.id === srv.id;
    item.className = `select-service-item ${isSelected ? 'selected' : ''}`;
    item.onclick = () => {
      appState.selectedService = srv;
      renderModalServiceList();
    };

    const title = isHe ? srv.name_he : srv.name_en;

    item.innerHTML = `
      <div class="item-left">
        <div class="item-title">${title}</div>
        <div class="item-meta">⏱ ${srv.duration_minutes} ${t.minutes}</div>
      </div>
      <div class="item-price">${srv.price} ${currency}</div>
    `;
    listEl.appendChild(item);
  });

  // Render addons
  addons.forEach(add => {
    const pill = document.createElement('div');
    const isSelected = appState.selectedAddons.some(a => a.id === add.id);
    pill.className = `addon-pill ${isSelected ? 'selected' : ''}`;
    pill.onclick = () => {
      if (isSelected) {
        appState.selectedAddons = appState.selectedAddons.filter(a => a.id !== add.id);
      } else {
        appState.selectedAddons.push(add);
      }
      renderModalServiceList();
    };

    const title = isHe ? add.name_he : add.name_en;

    pill.innerHTML = `
      <span>${isSelected ? '✓ ' : '+ '}${title}</span>
      <strong style="color: var(--primary-dark);">${add.price} ${currency}</strong>
    `;
    addonsGrid.appendChild(pill);
  });
}

// Date generation
function renderDatePills() {
  const container = document.getElementById('dateScrollRow');
  if (!container) return;
  container.innerHTML = '';

  const isHe = appState.lang === 'he';
  const today = new Date();

  // Generate 28 consecutive days
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
    const dayName = isHe ? hebrewDays[dayOfWeek] : englishDays[dayOfWeek];
    const monthName = isHe ? hebrewMonths[d.getMonth()] : englishMonths[d.getMonth()];

    // Saturday is closed by default
    const isSaturday = dayOfWeek === 6;

    const pill = document.createElement('div');
    pill.className = `date-pill ${isSaturday ? 'disabled' : ''}`;
    pill.dataset.date = dateStr;

    pill.innerHTML = `
      <div class="date-day-name">${dayName}</div>
      <div class="date-day-num">${d.getDate()}</div>
      <div class="date-month-name">${monthName}</div>
    `;

    if (!isSaturday) {
      pill.onclick = () => selectDate(dateStr, pill);
      // Select first available non-saturday by default
      if (!appState.selectedDate) {
        appState.selectedDate = dateStr;
        pill.classList.add('selected');
      }
    }

    container.appendChild(pill);
  }

  if (appState.selectedDate) {
    loadSlotsForSelectedDate();
  }
}

function selectDate(dateStr, pillEl) {
  document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('selected'));
  if (pillEl) pillEl.classList.add('selected');
  appState.selectedDate = dateStr;
  loadSlotsForSelectedDate();
}

async function loadSlotsForSelectedDate() {
  if (!appState.selectedDate || !appState.selectedService) return;

  const summaryEl = document.getElementById('selectedDateSummary');
  const gridEl = document.getElementById('slotsGrid');
  const noSlotsEl = document.getElementById('noSlotsMsg');

  gridEl.innerHTML = '<div style="padding: 20px; text-align: center; grid-column: 1/-1;"><span class="spinner" style="border-top-color: var(--primary);"></span></div>';
  noSlotsEl.style.display = 'none';

  const d = new Date(appState.selectedDate);
  const isHe = appState.lang === 'he';
  const dayName = isHe ? hebrewDays[d.getDay()] : englishDays[d.getDay()];
  summaryEl.innerText = `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`;

  const addonIds = appState.selectedAddons.map(a => a.id).join(',');
  const url = `/api/availability?date=${appState.selectedDate}&service_id=${appState.selectedService.id}${addonIds ? `&addons=${addonIds}` : ''}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    gridEl.innerHTML = '';

    if (!data.is_open || !data.slots || data.slots.length === 0) {
      noSlotsEl.style.display = 'block';
      appState.selectedSlot = null;
      return;
    }

    data.slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = appState.selectedSlot === slot.time;
      btn.className = `time-slot-btn ${isSelected ? 'selected' : ''}`;
      btn.innerText = slot.time;
      btn.onclick = () => {
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        appState.selectedSlot = slot.time;
      };
      gridEl.appendChild(btn);
    });

    // Auto-select first slot if none selected
    if (!appState.selectedSlot && data.slots.length > 0) {
      appState.selectedSlot = data.slots[0].time;
      const firstBtn = gridEl.querySelector('.time-slot-btn');
      if (firstBtn) firstBtn.classList.add('selected');
    }
  } catch (err) {
    gridEl.innerHTML = '';
    noSlotsEl.style.display = 'block';
    console.error('Failed to load slots:', err);
  }
}

// Step Navigation
function setStep(step) {
  appState.currentStep = step;

  // Panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const currentPanel = document.getElementById(`stepPanel${step}`);
  if (currentPanel) currentPanel.classList.add('active');

  // Indicators
  const ind1 = document.getElementById('indicatorStep1');
  const ind2 = document.getElementById('indicatorStep2');
  const ind3 = document.getElementById('indicatorStep3');

  ind1.className = 'wizard-step-indicator ' + (step === 1 ? 'active' : (step > 1 ? 'completed' : ''));
  ind2.className = 'wizard-step-indicator ' + (step === 2 ? 'active' : (step > 2 ? 'completed' : ''));
  ind3.className = 'wizard-step-indicator ' + (step === 3 ? 'active' : (step > 3 ? 'completed' : ''));

  // Footer Buttons
  const btnPrev = document.getElementById('btnPrevStep');
  const btnNext = document.getElementById('btnNextStep');
  const modalFooter = document.getElementById('modalFooter');
  const t = translations[appState.lang];

  if (step === 1) {
    btnPrev.style.display = 'none';
    btnNext.style.display = 'inline-flex';
    btnNext.innerText = t.btnContinue;
    modalFooter.style.display = 'flex';
  } else if (step === 2) {
    btnPrev.style.display = 'inline-flex';
    btnNext.style.display = 'inline-flex';
    btnNext.innerText = t.btnContinue;
    modalFooter.style.display = 'flex';
    loadSlotsForSelectedDate();
  } else if (step === 3) {
    btnPrev.style.display = 'inline-flex';
    btnNext.style.display = 'inline-flex';
    btnNext.innerText = t.confirmBookingBtn;
    modalFooter.style.display = 'flex';
    updateStep3Summary();
  } else if (step === 4) {
    modalFooter.style.display = 'none';
  }
}

function nextStep() {
  if (appState.currentStep === 1) {
    if (!appState.selectedService) {
      alert(appState.lang === 'he' ? 'אנא בחרי טיפול להמשך' : 'Please select a service');
      return;
    }
    setStep(2);
  } else if (appState.currentStep === 2) {
    if (!appState.selectedSlot) {
      alert(appState.lang === 'he' ? 'אנא בחרי שעה פנויה' : 'Please choose an available time slot');
      return;
    }
    setStep(3);
  } else if (appState.currentStep === 3) {
    const form = document.getElementById('clientForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    handleBookingSubmit();
  }
}

function prevStep() {
  if (appState.currentStep > 1) {
    setStep(appState.currentStep - 1);
  }
}

function updateStep3Summary() {
  const isHe = appState.lang === 'he';
  const currency = appState.settings.currency_symbol || '₪';
  const t = translations[appState.lang];

  let serviceNames = [isHe ? appState.selectedService.name_he : appState.selectedService.name_en];
  let totalPrice = appState.selectedService.price;
  let totalMinutes = appState.selectedService.duration_minutes;

  appState.selectedAddons.forEach(a => {
    serviceNames.push(isHe ? `+ ${a.name_he}` : `+ ${a.name_en}`);
    totalPrice += a.price;
    totalMinutes += a.duration_minutes;
  });

  document.getElementById('sumServiceName').innerText = serviceNames.join(' ');
  document.getElementById('sumDateTimeText').innerText = `${appState.selectedDate} | ${appState.selectedSlot}`;
  document.getElementById('sumDurationText').innerText = `${totalMinutes} ${t.minutes}`;
  document.getElementById('sumPriceText').innerText = `${totalPrice} ${currency}`;
}

async function handleBookingSubmit(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const notes = document.getElementById('clientNotes').value.trim();

  const btnNext = document.getElementById('btnNextStep');
  btnNext.disabled = true;
  btnNext.innerHTML = '<span class="spinner"></span>';

  const payload = {
    client_name: name,
    client_phone: phone,
    client_email: email,
    service_id: appState.selectedService.id,
    addon_ids: appState.selectedAddons.map(a => a.id),
    date: appState.selectedDate,
    start_time: appState.selectedSlot,
    notes: notes
  };

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {}

    btnNext.disabled = false;
    btnNext.innerText = translations[appState.lang]?.confirmBookingBtn || 'אשרי והזמיני תור';

    if (!res.ok) {
      const msg = data.detail || (appState.lang === 'he' ? 'שעה זו נתפסה או שאינה זמינה, אנא בחרי שעה אחרת.' : 'Slot unavailable, please pick another.');
      alert(msg);
      return;
    }

    appState.lastBooking = data;
    renderConfirmationStep(data);
    setStep(4);
  } catch (err) {
    btnNext.disabled = false;
    btnNext.innerText = translations[appState.lang]?.confirmBookingBtn || 'אשרי והזמיני תור';
    alert('שגיאת תקשורת עם השרת, אנא נסי שנית.');
    console.error(err);
  }
}

function renderConfirmationStep(booking) {
  const isHe = appState.lang === 'he';
  const currency = appState.settings.currency_symbol || '₪';

  const isPending = booking.status === 'pending';
  const badgeSuffix = isPending ? (isHe ? ' (ממתין לאישור ⏳)' : ' (Pending ⏳)') : '';
  document.getElementById('confBookingCode').innerText = `${booking.booking_code}${badgeSuffix}`;
  document.getElementById('confClientName').innerText = booking.client_name;
  document.getElementById('confService').innerText = isHe ? booking.service_name_he : booking.service_name_en;
  document.getElementById('confDateTime').innerText = `${booking.date} | ${booking.start_time} - ${booking.end_time}`;
  document.getElementById('confPrice').innerText = `${booking.total_price} ${currency}`;

  // Email button to studio
  const emailBtn = document.getElementById('confEmailBtn');
  if (emailBtn) {
    const serviceName = isHe ? booking.service_name_he : booking.service_name_en;
    const subject = encodeURIComponent(`אישור תור - ${booking.client_name} - ${booking.booking_code}`);
    const body = encodeURIComponent(
      `היי סתיו!\nקבעתי תור חדש באתר 💅\n\nשם: ${booking.client_name}\nטיפול: ${serviceName}\nמועד: ${booking.date} (${booking.start_time} - ${booking.end_time})\nקוד תור: ${booking.booking_code}\nמחיר: ${booking.total_price} ${currency}\n\nאשמח לקבל אישור, תודה!`
    );
    emailBtn.href = `mailto:talpeer1909@gmail.com?subject=${subject}&body=${body}`;
  }

  // ICS download button
  const icsBtn = document.getElementById('confIcsBtn');
  if (icsBtn) {
    icsBtn.href = `/api/appointments/ics/${booking.booking_code}`;
  }
}

function resetAndCloseBooking() {
  closeBookingModal();
  document.getElementById('clientForm').reset();
  appState.selectedSlot = null;
  appState.selectedAddons = [];
  setStep(1);
}

// Language Switcher
function toggleLanguage() {
  appState.lang = appState.lang === 'he' ? 'en' : 'he';
  applyLanguage(appState.lang);
}

function applyLanguage(lang) {
  const html = document.documentElement;
  const isHe = lang === 'he';

  html.lang = lang;
  html.dir = isHe ? 'rtl' : 'ltr';

  document.getElementById('langLabel').innerText = isHe ? 'English' : 'עברית';

  // Apply all data-i18n keys
  const t = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) {
      el.innerHTML = t[key];
    }
  });

  updateSalonBranding();
  renderServiceCards(appState.services);
  renderModalServiceList();
  renderDatePills();
  renderReviews();
}

// Real Reviews Logic
async function loadReviews() {
  try {
    const res = await fetch('/api/reviews');
    if (res.ok) {
      const data = await res.json();
      appState.reviews = data.reviews || [];
      appState.reviewsStats = {
        total: data.total || 0,
        avg_rating: data.avg_rating || 5.0
      };
      renderReviews();
    }
  } catch (err) {
    console.error('Failed to load reviews:', err);
  }
}

function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  const avgText = document.getElementById('reviewsAvgText');
  const countText = document.getElementById('reviewsCountText');
  const heroText = document.getElementById('heroRatingText');
  if (!grid) return;

  const isHe = appState.lang === 'he';
  const total = appState.reviewsStats.total;
  const avg = appState.reviewsStats.avg_rating;

  if (avgText) {
    avgText.innerText = `${avg.toFixed(1)} ${isHe ? 'מתוך 5' : 'out of 5'}`;
  }
  if (countText) {
    countText.innerText = `${total} ${isHe ? 'חוות דעת' : (total === 1 ? 'review' : 'reviews')}`;
  }
  if (heroText) {
    if (total > 0) {
      heroText.innerText = `${avg.toFixed(1)} (${total} ${isHe ? 'חוות דעת אמיתיות' : 'authentic reviews'})`;
    } else {
      heroText.innerText = isHe ? 'חוות דעת של לקוחות אמיתיות' : 'Authentic Client Reviews';
    }
  }

  grid.innerHTML = '';

  if (appState.reviews.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-reviews-card';
    emptyCard.innerHTML = `
      <div style="font-size: 38px; margin-bottom: 10px;">✨</div>
      <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 6px;">
        ${isHe ? 'היי הראשונה לפרגן ולכתוב חוות דעת!' : 'Be the first to leave a review!'}
      </h3>
      <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 16px;">
        ${isHe ? 'היית אצל סתיו בטיפול? נשמח מאוד לשמוע איך היה ולשתף לקוחות חדשות.' : 'Had an appointment with Stav? We would love to hear your feedback.'}
      </p>
      <button class="btn-primary" onclick="openReviewModal()" style="font-size: 13.5px; padding: 8px 20px;">
        ✍️ ${isHe ? 'כתיבת חוות דעת עכשיו' : 'Write a Review Now'}
      </button>
    `;
    grid.appendChild(emptyCard);
    return;
  }

  appState.reviews.forEach(rev => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const starsStr = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);

    card.innerHTML = `
      <div class="review-stars" style="color: #ffb703; font-size: 16px; letter-spacing: 2px;">${starsStr}</div>
      <p class="review-text">"${escapeHtml(rev.comment)}"</p>
      <div class="review-author">${escapeHtml(rev.client_name)}</div>
      <div class="review-date">${rev.created_at || ''}</div>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openReviewModal() {
  document.getElementById('reviewModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setRating(5);
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
  document.body.style.overflow = '';
}

function setRating(val) {
  appState.currentRatingInput = val;
  const ratingInput = document.getElementById('reviewRatingVal');
  if (ratingInput) ratingInput.value = val;

  const starBtns = document.querySelectorAll('#starPicker .star-btn');
  starBtns.forEach(btn => {
    const btnVal = parseInt(btn.dataset.val);
    if (btnVal <= val) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reviewClientName').value.trim();
  const comment = document.getElementById('reviewComment').value.trim();
  const rating = parseInt(document.getElementById('reviewRatingVal').value) || 5;

  const btn = document.getElementById('btnSubmitReview');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: name,
        rating: rating,
        comment: comment
      })
    });

    btn.disabled = false;
    btn.innerHTML = translations[appState.lang].submitReviewBtn;

    if (res.ok) {
      alert(appState.lang === 'he' ? 'תודה רבה! חוות הדעת שלך פורסמה בהצלחה ❤️' : 'Thank you! Your review has been posted ❤️');
      document.getElementById('reviewForm').reset();
      closeReviewModal();
      await loadReviews();
    } else {
      const err = await res.json();
      alert(err.detail || 'שגיאה בשמירת חוות הדעת');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = translations[appState.lang].submitReviewBtn;
    alert('שגיאת תקשורת עם השרת');
    console.error(err);
  }
}
