import { Request, Response, NextFunction } from 'express';
import { availabilityService } from './availability.service';
import { successResponse } from '../../utils/apiResponse';

export async function getCities(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cities = await availabilityService.getCities();
    successResponse(res, cities);
  } catch (error) {
    next(error);
  }
}

export async function getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { city, date } = req.query as { city: string; date: string };
    const data = await availabilityService.getAvailabilityByCity(city, date);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
}
