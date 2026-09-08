import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../config/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

export async function login(req, res) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Telefon raqam va parol kiritilishi shart' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const db = getDb();
    const user = db.users.find(u => u.phone.replace(/\s+/g, '') === cleanPhone);

    if (!user) {
      return res.status(401).json({ message: 'Bunday telefon raqamli xodim topilmadi' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Parol noto\'g\'ri kiritildi' });
    }

    const token = generateToken(user);
    const { passwordHash, ...safeUser } = user;

    return res.json({
      message: 'Tizimga muvaffaqiyatli kirildi',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login xatosi:', error);
    return res.status(500).json({ message: 'Serverda ichki xatolik yuz berdi' });
  }
}

export function getMe(req, res) {
  return res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  try {
    const db = getDb();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const { fullName, phone, avatar, newPassword } = req.body;
    if (fullName) db.users[userIndex].fullName = fullName;
    if (phone) db.users[userIndex].phone = phone;
    if (avatar) db.users[userIndex].avatar = avatar;

    if (newPassword && newPassword.trim().length >= 4) {
      db.users[userIndex].passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    saveDb(db);
    const { passwordHash, ...safeUser } = db.users[userIndex];
    return res.json({ message: 'Profil muvaffaqiyatli yangilandi', user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Profilni yangilashda xatolik' });
  }
}
