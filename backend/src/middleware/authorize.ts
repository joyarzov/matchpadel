import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { UserRole } from '@prisma/client';
import { errorResponse } from '../utils/apiResponse';

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'No autenticado', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, 'No tienes permisos para realizar esta acción', 403);
      return;
    }

    next();
  };
}
