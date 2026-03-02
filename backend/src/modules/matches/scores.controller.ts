import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { scoresService } from './scores.service';
import { successResponse } from '../../utils/apiResponse';

export async function proposeScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const score = await scoresService.proposeScore(
      req.params.matchId as string,
      req.user!.id,
      req.body,
    );
    successResponse(res, score, 201);
  } catch (error) {
    next(error);
  }
}

export async function approveScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const score = await scoresService.approveScore(
      req.params.matchId as string,
      req.user!.id,
    );
    successResponse(res, score);
  } catch (error) {
    next(error);
  }
}

export async function rejectScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const score = await scoresService.rejectScore(
      req.params.matchId as string,
      req.user!.id,
    );
    successResponse(res, score);
  } catch (error) {
    next(error);
  }
}

export async function deleteProposal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await scoresService.deleteProposal(
      req.params.matchId as string,
      req.user!.id,
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const score = await scoresService.getScore(req.params.matchId as string);
    successResponse(res, score);
  } catch (error) {
    next(error);
  }
}
