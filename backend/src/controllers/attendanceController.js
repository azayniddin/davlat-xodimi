import { getDb, saveDb } from '../config/db.js';
import { calculateDistance } from '../utils/distance.js';

// Bugungi sanani YYYY-MM-DD formatida olish
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Joriy vaqtni HH:mm formatida olish
function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getTodayStatus(req, res) {
  try {
    const db = getDb();
    const today = getTodayDateString();
    const record = db.attendance.find(a => a.userId === req.user.id && a.date === today) || null;
    const settings = db.settings;

    return res.json({
      today,
      record,
      settings: {
        organizationName: settings.organizationName,
        orgLat: settings.orgLat,
        orgLng: settings.orgLng,
        allowedRadiusMeters: settings.allowedRadiusMeters,
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Holatni olishda xatolik yuz berdi' });
  }
}

export function checkIn(req, res) {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Geolokatsiya koordinatalari (kenglik va uzunlik) talab qilinadi' });
    }

    const db = getDb();
    const settings = db.settings;
    const distance = calculateDistance(Number(lat), Number(lng), settings.orgLat, settings.orgLng);

    // 300 metr radius tekshiruvi (aldashdan himoya)
    if (distance > settings.allowedRadiusMeters) {
      return res.status(403).json({
        success: false,
        message: `Siz ishxona hududidan tashqaridasiz! Masofa: ${distance} metr. Ruxsat etilgan masofa: ${settings.allowedRadiusMeters} metr. Iltimos, idoraga yaqinlashing.`,
        distance,
        allowedRadius: settings.allowedRadiusMeters
      });
    }

    const today = getTodayDateString();
    const existingIndex = db.attendance.findIndex(a => a.userId === req.user.id && a.date === today);
    const currentTime = getCurrentTimeString();

    // Kechikishni aniqlash
    const isLate = currentTime > settings.workStartTime;
    const status = isLate ? 'late' : 'on_time';

    if (existingIndex !== -1) {
      const existing = db.attendance[existingIndex];
      if (existing.checkInTime) {
        return res.status(400).json({
          message: `Siz bugun soat ${existing.checkInTime} da allaqachon ishga kelganingizni qayd etgansiz!`,
          record: existing
        });
      }
      existing.checkInTime = currentTime;
      existing.checkInCoords = { lat, lng };
      existing.checkInDistance = distance;
      existing.status = status;
      saveDb(db);
      return res.json({ message: 'Ishga kelganingiz muvaffaqiyatli tasdiqlandi!', record: existing });
    }

    const newRecord = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userId: req.user.id,
      date: today,
      checkInTime: currentTime,
      checkInCoords: { lat, lng },
      checkInDistance: distance,
      checkOutTime: null,
      checkOutCoords: null,
      checkOutDistance: null,
      status,
      createdAt: new Date().toISOString()
    };

    db.attendance.push(newRecord);
    saveDb(db);

    return res.json({
      message: `Ishga kelganingiz muvaffaqiyatli tasdiqlandi! (${isLate ? 'Kechikdingiz: ' + currentTime : 'O\'z vaqtida: ' + currentTime})`,
      record: newRecord
    });
  } catch (error) {
    console.error('Check-in xatosi:', error);
    return res.status(500).json({ message: 'Davomatni qayd qilishda xatolik yuz berdi' });
  }
}

export function checkOut(req, res) {
  try {
    const { lat, lng } = req.body;
    const db = getDb();
    const settings = db.settings;
    const today = getTodayDateString();
    const existingIndex = db.attendance.findIndex(a => a.userId === req.user.id && a.date === today);

    if (existingIndex === -1 || !db.attendance[existingIndex].checkInTime) {
      return res.status(400).json({ message: 'Avval ishga kelganingizni tasdiqlashingiz lozim!' });
    }

    let distance = null;
    if (lat !== undefined && lng !== undefined) {
      distance = calculateDistance(Number(lat), Number(lng), settings.orgLat, settings.orgLng);
    }

    const currentTime = getCurrentTimeString();
    db.attendance[existingIndex].checkOutTime = currentTime;
    if (lat !== undefined && lng !== undefined) {
      db.attendance[existingIndex].checkOutCoords = { lat, lng };
      db.attendance[existingIndex].checkOutDistance = distance;
    }

    saveDb(db);

    return res.json({
      message: `Ishdan ketganingiz muvaffaqiyatli qayd etildi! Soat: ${currentTime}`,
      record: db.attendance[existingIndex]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Ketishni qayd qilishda xatolik yuz berdi' });
  }
}

export function getMyHistory(req, res) {
  try {
    const db = getDb();
    const records = db.attendance
      .filter(a => a.userId === req.user.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Tarixni olishda xatolik yuz berdi' });
  }
}
