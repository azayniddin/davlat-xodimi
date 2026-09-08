import { Router } from 'express';
import { getTodayStatus, checkIn, checkOut, getMyHistory } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/today', getTodayStatus);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', getMyHistory);

export default router;
