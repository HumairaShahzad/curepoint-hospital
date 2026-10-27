// db.js
// CurePoint Hospital — LocalStorage Data Manager
// Shared data layer used by every page (index, patients, doctors, lab, billing, reports)
// and by the floating AI chat widget.

// ---------- 1. Storage keys ----------
const DB_KEYS = {
  PATIENTS: 'hp_patients',
  DOCTORS:  'hp_doctors',
  VISITS:   'hp_visits',
  LAB_TESTS:'hp_lab_tests',
  PAYMENTS: 'hp_payments',
  COUNTERS: 'hp_counters'
};

// ---------- 2. Low-level read/write ----------
function getRecords(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('getRecords failed for', key, e);
    return [];
  }
}

function saveRecords(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records));
    return true;
  } catch (e) {
    console.error('saveRecords failed for', key, e);
    alert('Could not save data: storage may be full.');
    return false;
  }
}

function addRecord(key, record) {
  const list = getRecords(key);
  list.push(record);
  saveRecords(key, list);
  return record;
}

function updateRecord(key, id, patch) {
  const list = getRecords(key);
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  saveRecords(key, list);
  return list[idx];
}

function deleteRecord(key, id) {
  const list = getRecords(key).filter(r => r.id !== id);
  saveRecords(key, list);
}

// ---------- 3. Auto-ID generators ----------
function nextId(prefix) {
  const counters = JSON.parse(localStorage.getItem(DB_KEYS.COUNTERS) || '{}');
  counters[prefix] = (counters[prefix] || 0) + 1;
  localStorage.setItem(DB_KEYS.COUNTERS, JSON.stringify(counters));
  return `${prefix}-${String(counters[prefix]).padStart(4, '0')}`;
}

// ---------- 4. Helpers ----------
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- 5. Sample data generator (30-day fake hospital) ----------
function loadSampleData() {
  // Clear everything first
  Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));

  // -- 5 doctors --
  const doctorSeeds = [
    { name: 'Dr. Rahman',  specialization: 'Medicine',   fee: 500 },
    { name: 'Dr. Akter',   specialization: 'Gynecology', fee: 700 },
    { name: 'Dr. Hossain', specialization: 'Cardiology', fee: 900 },
    { name: 'Dr. Chowdhury', specialization: 'Pediatrics', fee: 600 },
    { name: 'Dr. Islam',   specialization: 'Orthopedics', fee: 800 }
  ];
  const doctors = doctorSeeds.map(d => ({
    id: nextId('D'),
    ...d,
    createdAt: new Date().toISOString()
  }));
  saveRecords(DB_KEYS.DOCTORS, doctors);

  // -- 50 patients --
  const firstNames = ['Rahim','Karim','Fatima','Ayesha','Sakib','Nadia','Hasan','Mitu','Rafi','Shoma','Jamal','Rina','Tanvir','Sumi','Imran','Lima','Rakib','Sabina','Nasir','Rupa','Mehedi','Shila','Arif','Nilufar','Zahid','Mala','Faisal','Rupali','Shahin','Monira','Shafiq','Ruma','Masud','Tania','Jahid','Rozina','Belal','Shaheen','Munir','Shahana','Kabir','Nasima','Rubel','Afsana','Shamim','Taslima','Delwar','Sultana','Khaled','Parvin'];
  const lastNames = ['Ahmed','Khan','Begum','Sultana','Hossain','Rahman','Islam','Alam','Chowdhury','Mia'];
  const areas = ['Dhanmondi','Gulshan','Uttara','Mirpur','Mohammadpur','Banani','Baridhara','Khilgaon','Shyamoli','Lalbagh'];

  const patients = [];
  for (let i = 0; i < 50; i++) {
    const regDaysAgo = randomInt(0, 30);
    patients.push({
      id: nextId('P'),
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      age: randomInt(1, 85),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      phone: '01' + randomInt(3, 9) + String(randomInt(10000000, 99999999)),
      address: `${randomInt(1,99)}/A, ${pick(areas)}, Dhaka`,
      registeredAt: new Date(Date.now() - regDaysAgo * 86400000).toISOString()
    });
  }
  saveRecords(DB_KEYS.PATIENTS, patients);

  // -- Visits + payments for consultations --
  const complaints = ['Fever and headache','Chest pain','Stomach ache','Cough and cold','Back pain','Dizziness','High blood pressure','Diabetes checkup','Joint pain','Skin rash'];
  const medicines  = ['Napa 500mg - 1+1+1','Omeprazole 20mg - 1+0+1','Ciprofloxacin 500mg - 1+0+1','Amlodipine 5mg - 0+0+1','Metformin 500mg - 1+0+1','Paracetamol 500mg - 1+1+1','Losartan 50mg - 1+0+0'];
  const visits = [];
  const payments = [];
  const methods = ['Cash','Card','bKash'];

  for (let d = 30; d >= 0; d--) {
    const date = daysAgoISO(d);
    const visitsToday = randomInt(3, 8);
    for (let v = 0; v < visitsToday; v++) {
      const patient = pick(patients);
      const doctor  = pick(doctors);
      const visitId = nextId('V');
      visits.push({
        id: visitId,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        complaint: pick(complaints),
        prescription: pick(medicines),
        fee: doctor.fee,
        date: date
      });
      // Billing charge
      payments.push({
        id: nextId('PAY'),
        patientId: patient.id,
        patientName: patient.name,
        source: 'Doctor Visit',
        refId: visitId,
        amount: doctor.fee,
        paid: 0,
        method: '',
        note: `Consultation with ${doctor.name}`,
        date: date
      });
      // 75% pay immediately
      if (Math.random() < 0.75) {
        payments.push({
          id: nextId('PAY'),
          patientId: patient.id,
          patientName: patient.name,
          source: 'Doctor Visit',
          refId: visitId,
          amount: 0,
          paid: doctor.fee,
          method: pick(methods),
          note: 'Paid at counter',
          date: date
        });
      }
    }
  }
  saveRecords(DB_KEYS.VISITS, visits);

  // -- Lab tests --
  const testCatalog = [
    { name: 'Complete Blood Count (CBC)', price: 400 },
    { name: 'Blood Sugar (Fasting)',      price: 150 },
    { name: 'Lipid Profile',              price: 1200 },
    { name: 'Liver Function Test',        price: 1500 },
    { name: 'Kidney Function Test',       price: 1300 },
    { name: 'Urine Routine',              price: 200 },
    { name: 'Chest X-Ray',                price: 500 },
    { name: 'Abdominal Ultrasound',       price: 1800 },
    { name: 'ECG',                        price: 400 },
    { name: 'Thyroid (TSH)',              price: 600 },
    { name: 'RT-PCR COVID',               price: 2500 },
    { name: 'Dengue NS1',                 price: 800 }
  ];

  const labTests = [];
  for (let d = 30; d >= 0; d--) {
    const date = daysAgoISO(d);
    const testsToday = randomInt(2, 6);
    for (let t = 0; t < testsToday; t++) {
      const patient = pick(patients);
      const test = pick(testCatalog);
      const isDone = d > 1 ? Math.random() < 0.85 : Math.random() < 0.4; // recent ones more likely pending
      const testId = nextId('L');
      labTests.push({
        id: testId,
        patientId: patient.id,
        patientName: patient.name,
        testName: test.name,
        price: test.price,
        status: isDone ? 'Done' : 'Pending',
        result: isDone ? 'Within normal range.' : '',
        date: date
      });
      if (isDone) {
        // Charge
        payments.push({
          id: nextId('PAY'),
          patientId: patient.id,
          patientName: patient.name,
          source: 'Lab Test',
          refId: testId,
          amount: test.price,
          paid: 0,
          method: '',
          note: test.name,
          date: date
        });
        // 70% pay
        if (Math.random() < 0.7) {
          payments.push({
            id: nextId('PAY'),
            patientId: patient.id,
            patientName: patient.name,
            source: 'Lab Test',
            refId: testId,
            amount: 0,
            paid: test.price,
            method: pick(methods),
            note: 'Paid at lab counter',
            date: date
          });
        }
      }
    }
  }
  saveRecords(DB_KEYS.LAB_TESTS, labTests);
  saveRecords(DB_KEYS.PAYMENTS, payments);

  console.log(`✓ Sample loaded: ${patients.length} patients, ${doctors.length} doctors, ${visits.length} visits, ${labTests.length} lab tests, ${payments.length} billing rows.`);
}