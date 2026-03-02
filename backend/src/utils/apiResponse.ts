import { Response } from 'express';

export function successResponse(res: Response, data: unknown, status: number = 200): void {
  res.status(status).json({
    success: true,
    data,
  });
}

export function errorResponse(res: Response, message: string, status: number = 400): void {
  res.status(status).json({
    success: false,
    error: message,
  });
}

export function paginatedResponse(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number
): void {
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
