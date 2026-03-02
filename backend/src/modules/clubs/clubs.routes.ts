import { Router } from 'express';
import { listClubs, getClub, createClub, updateClub, deactivateClub } from './clubs.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { createClubSchema, updateClubSchema, clubIdParamSchema } from './clubs.validators';
import courtsRouter from '../courts/courts.routes';

const router = Router();

// Public routes
router.get('/', listClubs);
router.get('/:clubId', validateRequest({ params: clubIdParamSchema }), getClub);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ body: createClubSchema }),
  createClub
);
router.put(
  '/:clubId',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ params: clubIdParamSchema, body: updateClubSchema }),
  updateClub
);
router.delete(
  '/:clubId',
  authenticate,
  authorize('ADMIN'),
  validateRequest({ params: clubIdParamSchema }),
  deactivateClub
);

// Nested courts routes
router.use('/:clubId/courts', validateRequest({ params: clubIdParamSchema }), courtsRouter);

export default router;
