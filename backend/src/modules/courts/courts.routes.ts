import { Router } from 'express';
import { listCourts, getCourt, createCourt, updateCourt, deactivateCourt } from './courts.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { createCourtSchema, updateCourtSchema, courtIdParamSchema } from './courts.validators';

const router = Router({ mergeParams: true });

// Public routes
router.get('/', listCourts);
router.get('/:courtId', validateRequest({ params: courtIdParamSchema }), getCourt);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ body: createCourtSchema }),
  createCourt
);
router.put(
  '/:courtId',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ params: courtIdParamSchema, body: updateCourtSchema }),
  updateCourt
);
router.delete(
  '/:courtId',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ params: courtIdParamSchema }),
  deactivateCourt
);

export default router;
