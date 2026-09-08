import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Papka mavjudligini ta'minlash
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Boshlang'ich ma'lumotlar strukturasi
const initialData = {
  users: [],
  attendance: [],
  health: [],
  settings: {
    id: 'main',
    organizationName: "O'zbekiston Respublikasi Davlat Idorasi",
    // Odatiy koordinata: Toshkent shahri markazi (Amir Temur xiyoboni yaqini)
    orgLat: 41.311081,
    orgLng: 69.279737,
    allowedRadiusMeters: 300, // 300 metr radius talab qilingan
    workStartTime: '09:00',
    workEndTime: '18:00'
  }
};

/**
 * Ma'lumotlar bazasini o'qish
 */
export function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Bazani o\'qishda xatolik:', error);
    return initialData;
  }
}

/**
 * Ma'lumotlar bazasini saqlash
 */
export function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Bazaga yozishda xatolik:', error);
    return false;
  }
}
