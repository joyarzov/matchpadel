import { Router } from 'express';
import {
  createMatch,
  listMatches,
  getMatch,
  updateMatch,
  cancelMatch,
  joinMatch,
  leaveMatch,
  getMyMatches,
  getWhatsAppLink,
} from './matches.controller';
import { reportScore, getScores } from './scores.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createMatchSchema,
  updateMatchSchema,
  matchFiltersSchema,
  matchIdParamSchema,
} from './matches.validators';
import { reportScoreSchema } from './scores.validators';

const router = Router();

// My matches (must be before /:matchId to avoid conflict)
router.get(
  '/me/matches',
  authenticate,
  getMyMatches
);

// Public routes
router.get('/', validateRequest({ query: matchFiltersSchema }), listMatches);
router.get('/:matchId', validateRequest({ params: matchIdParamSchema }), getMatch);
router.get('/:matchId/whatsapp', validateRequest({ params: matchIdParamSchema }), getWhatsAppLink);
router.get('/:matchId/scores', validateRequest({ params: matchIdParamSchema }), getScores);

// Authenticated routes
router.post(
  '/',
  authenticate,
  validateRequest({ body: createMatchSchema }),
  createMatch
);
router.put(
  '/:matchId',
  authenticate,
  validateRequest({ params: matchIdParamSchema, body: updateMatchSchema }),
  updateMatch
);
router.patch(
  '/:matchId/cancel',
  authenticate,
  validateRequest({ params: matchIdParamSchema }),
  cancelMatch
);
router.post(
  '/:matchId/join',
  authenticate,
  validateRequest({ params: matchIdParamSchema }),
  joinMatch
);
router.delete(
  '/:matchId/leave',
  authenticate,
  validateRequest({ params: matchIdParamSchema }),
  leaveMatch
);
router.post(
  '/:matchId/score',
  authenticate,
  validateRequest({ params: matchIdParamSchema, body: reportScoreSchema }),
  reportScore
);
export default router;
