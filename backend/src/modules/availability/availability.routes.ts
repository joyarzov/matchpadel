import { Router } from 'express';
import { getCities, getAvailability } from './availability.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { availabilityQuerySchema } from './availability.validators';

const router = Router();

router.get('/cities', authenticate, getCities);
router.get('/', authenticate, validateRequest({ query: availabilityQuerySchema }), getAvailability);

export default router;
