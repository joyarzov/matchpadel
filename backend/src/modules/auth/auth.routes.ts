import { Router } from 'express';
import { register, login, refresh, logout, getMe } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { loginLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema } from './auth.validators';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', loginLimiter, validateRequest({ body: loginSchema }), login);
router.post('/refresh', validateRequest({ body: refreshSchema }), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
