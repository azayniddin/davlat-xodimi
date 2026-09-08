import { getDb, saveDb } from '../config/db.js';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayHealth(req, res) {
  try {
    const db = getDb();
    const today = getTodayDateString();
    let record = db.health.find(h => h.userId === req.user.id && h.date === today);

    if (!record) {
      record = {
        id: 'hlth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId: req.user.id,
        date: today,
        waterGlasses: 0, // 8 stakan me'yor (har biri 250ml = 2 litr)
        ran200m: false,
        ran200mTime: null,
        lightExercises: false,
        lightExercisesTime: null,
        sportSession: {
          done: false,
          type: '',
          durationMinutes: 0
        },
        score: 0, // Kunlik salomatlik balli (0-100)
        updatedAt: new Date().toISOString()
      };
      db.health.push(record);
      saveDb(db);
    }

    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Salomatlik ko\'rsatkichlarini olishda xatolik' });
  }
}

// Salomatlik umumiy ballini hisoblash
function calculateHealthScore(record) {
  let score = 0;
  // Suv (maksimal 25 ball: har stakan 3.125 ball)
  score += Math.min(record.waterGlasses, 8) * 3.125;
  // 200m yugurish / piyoda faollik (25 ball)
  if (record.ran200m) score += 25;
  // Yengil ertalabki mashqlar (25 ball)
  if (record.lightExercises) score += 25;
  // Qo'shimcha sport mashg'uloti (25 ball)
  if (record.sportSession && record.sportSession.done) score += 25;

  return Math.round(score);
}

export function updateWater(req, res) {
  try {
    const { glasses } = req.body;
    const db = getDb();
    const today = getTodayDateString();
    let index = db.health.findIndex(h => h.userId === req.user.id && h.date === today);

    if (index === -1) {
      getTodayHealth(req, res);
      return;
    }

    const newGlasses = Math.max(0, Math.min(12, Number(glasses) || 0));
    db.health[index].waterGlasses = newGlasses;
    db.health[index].score = calculateHealthScore(db.health[index]);
    db.health[index].updatedAt = new Date().toISOString();

    saveDb(db);
    return res.json({
      message: 'Suv miqdori yangilandi',
      record: db.health[index]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Suv miqdorini yangilashda xatolik' });
  }
}

export function toggleRun200m(req, res) {
  try {
    const { ran, distance, durationSeconds } = req.body;
    const db = getDb();
    const today = getTodayDateString();
    let index = db.health.findIndex(h => h.userId === req.user.id && h.date === today);

    if (index === -1) {
      return res.status(404).json({ message: 'Salomatlik yozuvi topilmadi' });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    db.health[index].ran200m = Boolean(ran);
    db.health[index].ran200mTime = ran ? timeStr : null;
    db.health[index].ranDistance = Number(distance) || (ran ? 200 : 0);
    db.health[index].ranDurationSeconds = Number(durationSeconds) || 0;
    db.health[index].score = calculateHealthScore(db.health[index]);
    db.health[index].updatedAt = now.toISOString();

    saveDb(db);
    return res.json({
      message: ran ? `Yugurish muvaffaqiyatli qayd etildi! (Masofa: ${db.health[index].ranDistance}m)` : 'Yugurish bekor qilindi',
      record: db.health[index]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Yugurishni saqlashda xatolik' });
  }
}

export function toggleLightExercises(req, res) {
  try {
    const { done, durationMinutes, exercisesList } = req.body;
    const db = getDb();
    const today = getTodayDateString();
    let index = db.health.findIndex(h => h.userId === req.user.id && h.date === today);

    if (index === -1) {
      return res.status(404).json({ message: 'Salomatlik yozuvi topilmadi' });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    db.health[index].lightExercises = Boolean(done);
    db.health[index].lightExercisesTime = done ? timeStr : null;
    db.health[index].exercisesDurationMinutes = Number(durationMinutes) || (done ? 7 : 0);
    db.health[index].exercisesList = exercisesList || [];
    db.health[index].score = calculateHealthScore(db.health[index]);
    db.health[index].updatedAt = now.toISOString();

    saveDb(db);
    return res.json({
      message: done ? `Ertalabki badantarbiya mashqlari yakunlandi! (${db.health[index].exercisesDurationMinutes} daqiqa)` : 'Mashqlar bekor qilindi',
      record: db.health[index]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Mashqlarni saqlashda xatolik' });
  }
}

export function updateSportSession(req, res) {
  try {
    const { done, type, durationMinutes } = req.body;
    const db = getDb();
    const today = getTodayDateString();
    let index = db.health.findIndex(h => h.userId === req.user.id && h.date === today);

    if (index === -1) {
      return res.status(404).json({ message: 'Salomatlik yozuvi topilmadi' });
    }

    db.health[index].sportSession = {
      done: Boolean(done),
      type: type || 'Umumiy jismoniy tarbiya',
      durationMinutes: Number(durationMinutes) || 15
    };
    db.health[index].score = calculateHealthScore(db.health[index]);
    db.health[index].updatedAt = new Date().toISOString();

    saveDb(db);
    return res.json({
      message: 'Sport mashg\'uloti muvaffaqiyatli saqlandi',
      record: db.health[index]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Sport mashg\'ulotini saqlashda xatolik' });
  }
}
