import { Router } from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  updateBuildingStatus,
  deleteBuilding,
} from '../../controllers/building.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';
import { validateObjectId } from '../../middleware/validateObjectId.middleware';

const router = Router();

// Protect all building management endpoints for provider_admin role only
router.use(authenticate, requireRole('provider_admin'));

router.get('/', getBuildings);
router.post('/', createBuilding);
router.get('/:id', validateObjectId('id'), getBuildingById);
router.patch('/:id', validateObjectId('id'), updateBuilding);
router.patch('/:id/status', validateObjectId('id'), updateBuildingStatus);
router.delete('/:id', validateObjectId('id'), deleteBuilding);

export default router;
