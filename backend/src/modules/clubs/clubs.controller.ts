import { Request, Response, NextFunction } from 'express';
import { clubsService } from './clubs.service';
import { successResponse } from '../../utils/apiResponse';

export async function listClubs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clubs = await clubsService.listActive();
    successResponse(res, clubs);
  } catch (error) {
    next(error);
  }
}

export async function getClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const club = await clubsService.getById(req.params.clubId as string);
    successResponse(res, club);
  } catch (error) {
    next(error);
  }
}

export async function createClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const club = await clubsService.create(req.body);
    successResponse(res, club, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const club = await clubsService.update(req.params.clubId as string, req.body);
    successResponse(res, club);
  } catch (error) {
    next(error);
  }
}

export async function deactivateClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const club = await clubsService.deactivate(req.params.clubId as string);
    successResponse(res, club);
  } catch (error) {
    next(error);
  }
}
