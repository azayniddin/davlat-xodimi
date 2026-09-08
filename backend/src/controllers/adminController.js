import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../config/db.js';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDashboardStats(req, res) {
  try {
    const db = getDb();
    const today = getTodayDateString();

    const employees = db.users.filter(u => u.role === 'employee');
    const totalEmployees = employees.length;

    const todayAttendance = db.attendance.filter(a => a.date === today);
    const todayHealth = db.health.filter(h => h.date === today);

    const arrivedCount = todayAttendance.filter(a => a.checkInTime).length;
    const lateCount = todayAttendance.filter(a => a.status === 'late').length;
    const onTimeCount = todayAttendance.filter(a => a.status === 'on_time').length;
    const absentCount = Math.max(0, totalEmployees - arrivedCount);

    const ran200mCount = todayHealth.filter(h => h.ran200m).length;
    const lightExercisesCount = todayHealth.filter(h => h.lightExercises).length;
    const sportSessionCount = todayHealth.filter(h => h.sportSession && h.sportSession.done).length;

    const totalGlasses = todayHealth.reduce((sum, h) => sum + (h.waterGlasses || 0), 0);
    const avgWaterGlasses = totalEmployees > 0 ? (totalGlasses / totalEmployees).toFixed(1) : 0;

    return res.json({
      today,
      totalEmployees,
      attendance: {
        arrivedCount,
        onTimeCount,
        lateCount,
        absentCount,
        arrivedPercentage: totalEmployees > 0 ? Math.round((arrivedCount / totalEmployees) * 100) : 0
      },
      health: {
        ran200mCount,
        lightExercisesCount,
        sportSessionCount,
        avgWaterGlasses
      },
      settings: db.settings
    });
  } catch (error) {
    console.error('Stats xatosi:', error);
    return res.status(500).json({ message: 'Statistikani olishda xatolik yuz berdi' });
  }
}

export function getEmployeesOverview(req, res) {
  try {
    const db = getDb();
    const today = getTodayDateString();

    const employees = db.users
      .filter(u => u.role === 'employee')
      .map(user => {
        const att = db.attendance.find(a => a.userId === user.id && a.date === today);
        const hlth = db.health.find(h => h.userId === user.id && h.date === today);

        return {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          position: user.position || 'Mutaxassis',
          department: user.department || 'Umumiy bo\'lim',
          avatar: user.avatar,
          createdAt: user.createdAt,
          todayAttendance: att ? {
            checkInTime: att.checkInTime,
            checkOutTime: att.checkOutTime,
            status: att.status,
            distance: att.checkInDistance
          } : null,
          todayHealth: hlth ? {
            waterGlasses: hlth.waterGlasses,
            ran200m: hlth.ran200m,
            ran200mTime: hlth.ran200mTime,
            lightExercises: hlth.lightExercises,
            lightExercisesTime: hlth.lightExercisesTime,
            sportSession: hlth.sportSession,
            score: hlth.score
          } : {
            waterGlasses: 0,
            ran200m: false,
            lightExercises: false,
            sportSession: { done: false },
            score: 0
          }
        };
      });

    return res.json({ employees, date: today });
  } catch (error) {
    return res.status(500).json({ message: 'Xodimlar ro\'yxatini olishda xatolik' });
  }
}

export async function createEmployee(req, res) {
  try {
    const { fullName, phone, position, department, password } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Ism-familiya, telefon va parol to\'ldirilishi shart' });
    }

    const db = getDb();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const exists = db.users.find(u => u.phone.replace(/\s+/g, '') === cleanPhone);

    if (exists) {
      return res.status(400).json({ message: 'Ushbu telefon raqamli xodim allaqachon mavjud' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      fullName: fullName.trim(),
      phone: cleanPhone,
      passwordHash,
      role: 'employee',
      position: position?.trim() || 'Yetakchi mutaxassis',
      department: department?.trim() || 'Ijro apparati',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ message: 'Yangi xodim muvaffaqiyatli qo\'shildi', employee: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Xodimni qo\'shishda xatolik' });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { fullName, phone, position, department, password } = req.body;
    const db = getDb();
    const index = db.users.findIndex(u => u.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Xodim topilmadi' });
    }

    if (fullName) db.users[index].fullName = fullName.trim();
    if (phone) db.users[index].phone = phone.trim();
    if (position) db.users[index].position = position.trim();
    if (department) db.users[index].department = department.trim();

    if (password && password.trim().length >= 4) {
      db.users[index].passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    saveDb(db);
    const { passwordHash, ...safeUser } = db.users[index];
    return res.json({ message: 'Xodim ma\'lumotlari muvaffaqiyatli yangilandi', employee: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Xodimni yangilashda xatolik' });
  }
}

export function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== id);

    if (db.users.length === initialLen) {
      return res.status(404).json({ message: 'Xodim topilmadi' });
    }

    // Xodimga tegishli davomat va sport ma'lumotlarini ham tozalash
    db.attendance = db.attendance.filter(a => a.userId !== id);
    db.health = db.health.filter(h => h.userId !== id);

    saveDb(db);
    return res.json({ message: 'Xodim tizimdan muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    return res.status(500).json({ message: 'Xodimni o\'chirishda xatolik' });
  }
}

export function getSettings(req, res) {
  const db = getDb();
  return res.json({ settings: db.settings });
}

export function updateSettings(req, res) {
  try {
    const { organizationName, orgLat, orgLng, allowedRadiusMeters, workStartTime, workEndTime } = req.body;
    const db = getDb();

    if (organizationName) db.settings.organizationName = organizationName;
    if (orgLat !== undefined) db.settings.orgLat = Number(orgLat);
    if (orgLng !== undefined) db.settings.orgLng = Number(orgLng);
    if (allowedRadiusMeters !== undefined) db.settings.allowedRadiusMeters = Number(allowedRadiusMeters);
    if (workStartTime) db.settings.workStartTime = workStartTime;
    if (workEndTime) db.settings.workEndTime = workEndTime;

    saveDb(db);
    return res.json({ message: 'Tizim va lokatsiya sozlamalari muvaffaqiyatli saqlandi', settings: db.settings });
  } catch (error) {
    return res.status(500).json({ message: 'Sozlamalarni yangilashda xatolik' });
  }
}
