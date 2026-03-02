import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { authService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { refreshToken } = req.body;
    await authService.logout(userId, refreshToken);
    successResponse(res, { message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await authService.getMe(userId);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}
