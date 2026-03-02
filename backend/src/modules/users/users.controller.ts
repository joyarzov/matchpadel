import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { usersService } from './users.service';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getProfile(req.user!.id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.updateProfile(req.user!.id, req.body);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.changePassword(req.user!.id, req.body);
    successResponse(res, { message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { users, total } = await usersService.listUsers(page, limit);
    paginatedResponse(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const user = await usersService.updateRole(id, role);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const user = await usersService.deactivateUser(id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function getUserStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await usersService.getUserStats(req.user!.id);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
}

export async function getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const ranking = await usersService.getRanking(limit);
    successResponse(res, ranking);
  } catch (error) {
    next(error);
  }
}
