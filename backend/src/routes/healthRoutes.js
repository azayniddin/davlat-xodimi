import { Router } from 'express';
import {
  getTodayHealth,
  updateWater,
  toggleRun200m,
  toggleLightExercises,
  updateSportSession
} from '../controllers/healthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/today', getTodayHealth);
router.post('/water', updateWater);
router.post('/run200m', toggleRun200m);
router.post('/light-exercises', toggleLightExercises);
router.post('/sport-session', updateSportSession);

export default router;
