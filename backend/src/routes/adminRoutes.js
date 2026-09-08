import { Router } from 'express';
import {
  getDashboardStats,
  getEmployeesOverview,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Barcha admin marshrutlariga faqat boshliq ruxsat oladi
router.use(authMiddleware, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/employees', getEmployeesOverview);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
