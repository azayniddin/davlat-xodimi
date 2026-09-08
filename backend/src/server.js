import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { autoSeedIfEmpty } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Marshrutlar
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint (Railway & monitoring uchun)
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Davlat xodimlari tizimi backend API ishlamoqda',
    time: new Date().toISOString()
  });
});

// Asosiy root
app.get('/', (req, res) => {
  res.send('Davlat xodimlari tizimi API serveri faol.');
});

// Serverni ishga tushirish
async function startServer() {
  // Bazani tekshirish va kerak bo'lsa dastlabki ma'lumotlarni kiritish
  await autoSeedIfEmpty();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(` DAVLAT XODIMLARI TIZIMI BACKEND API`);
    console.log(` Server port: http://0.0.0.0:${PORT}`);
    console.log(`=========================================`);
  });
}

startServer();
