import { Request, Response, NextFunction } from 'express';
import { courtsService } from './courts.service';
import { successResponse } from '../../utils/apiResponse';

export async function listCourts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courts = await courtsService.listByClub(req.params.clubId as string);
    successResponse(res, courts);
  } catch (error) {
    next(error);
  }
}

export async function getCourt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const court = await courtsService.getById(req.params.clubId as string, req.params.courtId as string);
    successResponse(res, court);
  } catch (error) {
    next(error);
  }
}

export async function createCourt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const court = await courtsService.create(req.params.clubId as string, req.body);
    successResponse(res, court, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateCourt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const court = await courtsService.update(req.params.clubId as string, req.params.courtId as string, req.body);
    successResponse(res, court);
  } catch (error) {
    next(error);
  }
}

export async function deactivateCourt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const court = await courtsService.deactivate(req.params.clubId as string, req.params.courtId as string);
    successResponse(res, court);
  } catch (error) {
    next(error);
  }
}
