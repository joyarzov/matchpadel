import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { matchesService } from './matches.service';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';
import { formatMatch, formatMatches } from './matchFormat';

export async function createMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchesService.createMatch(req.user!.id, req.body);
    successResponse(res, formatMatch(match as unknown as Record<string, unknown>), 201);
  } catch (error) {
    next(error);
  }
}

export async function listMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = req.query as any;
    const { matches, total } = await matchesService.listMatches(filters);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    paginatedResponse(res, formatMatches(matches as unknown as Record<string, unknown>[]), total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchesService.getMatchById(req.params.matchId as string);
    successResponse(res, formatMatch(match as unknown as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
}

export async function updateMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchesService.updateMatch(req.params.matchId as string, req.user!.id, req.body);
    successResponse(res, formatMatch(match as unknown as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
}

export async function cancelMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await matchesService.cancelMatch(req.params.matchId as string, req.user!.id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function joinMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await matchesService.joinMatch(req.params.matchId as string, req.user!.id);
    successResponse(res, formatMatch(match as unknown as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
}

export async function leaveMatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await matchesService.leaveMatch(req.params.matchId as string, req.user!.id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getMyMatches(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { matches, total } = await matchesService.getMyMatches(req.user!.id, page, limit);
    paginatedResponse(res, formatMatches(matches as unknown as Record<string, unknown>[]), total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function removeGuest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await matchesService.removeGuest(
      req.params.matchId as string,
      req.params.matchPlayerId as string,
      req.user!.id,
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getWhatsAppLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await matchesService.getWhatsAppLink(req.params.matchId as string);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}
