import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { scoresService } from './scores.service';
import { successResponse } from '../../utils/apiResponse';

export async function reportScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const score = await scoresService.reportScore(
      req.params.matchId as string,
      req.user!.id,
      req.body,
    );
    successResponse(res, score, 201);
  } catch (error) {
    next(error);
  }
}

export async function getScores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scores = await scoresService.getScores(req.params.matchId as string);
    successResponse(res, scores);
  } catch (error) {
    next(error);
  }
}
