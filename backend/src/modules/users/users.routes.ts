import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  updateRole,
  deactivateUser,
  getUserStats,
  getRanking,
  searchUsers,
} from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  userIdParamSchema,
  searchUsersSchema,
} from './users.validators';

const router = Router();

// Public routes (before auth middleware)
router.get('/ranking', getRanking);

// All routes below require authentication
router.use(authenticate);

// Player routes
router.get('/search', validateRequest({ query: searchUsersSchema }), searchUsers);
router.get('/stats', getUserStats);
router.get('/profile', getProfile);
router.put('/profile', validateRequest({ body: updateProfileSchema }), updateProfile);
router.put('/change-password', validateRequest({ body: changePasswordSchema }), changePassword);

// Admin routes
router.get('/', authorize('ADMIN'), listUsers);
router.patch(
  '/:id/role',
  authorize('ADMIN'),
  validateRequest({ params: userIdParamSchema, body: updateRoleSchema }),
  updateRole
);
router.delete(
  '/:id',
  authorize('ADMIN'),
  validateRequest({ params: userIdParamSchema }),
  deactivateUser
);

export default router;
