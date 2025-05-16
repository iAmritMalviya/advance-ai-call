import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { z } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    logger.error('Error occurred:', err);

    if (err instanceof z.ZodError) {
        res.status(400).json({
            error: 'Validation error',
            details: err.errors
        });
        return;
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }; 