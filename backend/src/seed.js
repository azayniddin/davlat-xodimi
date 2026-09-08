import bcrypt from 'bcryptjs';
import { getDb, saveDb } from './config/db.js';

export async function autoSeedIfEmpty() {
  const db = getDb();
  if (db.users && db.users.length > 0) {
    return;
  }
  console.log('Baza bo\'sh. Namunaviy ma\'lumotlar yuklanmoqda...');
  await runSeed();
}

export async function runSeed() {
  const db = getDb();

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const employeePasswordHash = await bcrypt.hash('xodim123', 10);

  const initialUsers = [
    {
      id: 'usr_admin_1',
      fullName: 'Rahimov Jamshid Anvarovich',
      phone: '+998901234567',
      passwordHash: adminPasswordHash,
      role: 'admin',
      position: 'Departament boshlig\'i',
      department: 'Boshqaruv apparati',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_emp_1',
      fullName: 'Karimov Jasur Bahodirovich',
      phone: '+998909876543',
      passwordHash: employeePasswordHash,
      role: 'employee',
      position: 'Bosh mutaxassis',
      department: 'Axborot texnologiyalari bo\'limi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_emp_2',
      fullName: 'Toshmatova Nilufar Alisherovna',
      phone: '+998911112233',
      passwordHash: employeePasswordHash,
      role: 'employee',
      position: 'Yetakchi mutaxassis',
      department: 'Inson resurslari (HR) bo\'limi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_emp_3',
      fullName: 'Aliyev Sardor Rustamovich',
      phone: '+998933334455',
      passwordHash: employeePasswordHash,
      role: 'employee',
      position: 'Katta hisobchi-auditor',
      department: 'Moliya va iqtisod bo\'limi',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_emp_4',
      fullName: 'Saidova Dildora Otabekovna',
      phone: '+998977778899',
      passwordHash: employeePasswordHash,
      role: 'employee',
      position: 'Matbuot kotibi',
      department: 'Jamoatchilik bilan aloqalar xizmati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    }
  ];

  // Bugungi sana
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Namunaviy bugungi davomat
  const initialAttendance = [
    {
      id: 'att_demo_1',
      userId: 'usr_emp_1',
      date: today,
      checkInTime: '08:42',
      checkInCoords: { lat: 41.311081, lng: 69.279737 },
      checkInDistance: 35,
      checkOutTime: null,
      status: 'on_time',
      createdAt: new Date().toISOString()
    },
    {
      id: 'att_demo_2',
      userId: 'usr_emp_2',
      date: today,
      checkInTime: '08:55',
      checkInCoords: { lat: 41.311100, lng: 69.279780 },
      checkInDistance: 62,
      checkOutTime: null,
      status: 'on_time',
      createdAt: new Date().toISOString()
    },
    {
      id: 'att_demo_3',
      userId: 'usr_emp_3',
      date: today,
      checkInTime: '09:23',
      checkInCoords: { lat: 41.311050, lng: 69.279690 },
      checkInDistance: 90,
      checkOutTime: null,
      status: 'late',
      createdAt: new Date().toISOString()
    }
  ];

  // Namunaviy bugungi salomatlik ko'rsatkichlari
  const initialHealth = [
    {
      id: 'hlth_demo_1',
      userId: 'usr_emp_1',
      date: today,
      waterGlasses: 6,
      ran200m: true,
      ran200mTime: '07:30',
      lightExercises: true,
      lightExercisesTime: '07:45',
      sportSession: {
        done: true,
        type: 'Turnik va brus',
        durationMinutes: 20
      },
      score: 100,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'hlth_demo_2',
      userId: 'usr_emp_2',
      date: today,
      waterGlasses: 5,
      ran200m: true,
      ran200mTime: '08:10',
      lightExercises: true,
      lightExercisesTime: '08:15',
      sportSession: {
        done: false,
        type: '',
        durationMinutes: 0
      },
      score: 75,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'hlth_demo_3',
      userId: 'usr_emp_3',
      date: today,
      waterGlasses: 3,
      ran200m: false,
      ran200mTime: null,
      lightExercises: false,
      lightExercisesTime: null,
      sportSession: {
        done: false,
        type: '',
        durationMinutes: 0
      },
      score: 25,
      updatedAt: new Date().toISOString()
    }
  ];

  db.users = initialUsers;
  db.attendance = initialAttendance;
  db.health = initialHealth;

  saveDb(db);
  console.log('Namunaviy ma\'lumotlar muvaffaqiyatli saqlandi!');
}

// To'g'ridan-to'g'ri chaqirilsa
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => {
    console.log('Seed jarayoni yakunlandi.');
    process.exit(0);
  });
}
