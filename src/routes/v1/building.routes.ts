import { Router } from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  updateBuildingStatus,
} from '../../controllers/building.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

// Protect all building management endpoints for provider_admin role only
router.use(authenticate, requireRole('provider_admin'));

router.get('/', getBuildings);
router.post('/', createBuilding);
router.get('/:id', getBuildingById);
router.patch('/:id', updateBuilding);
router.patch('/:id/status', updateBuildingStatus);

export default router;
