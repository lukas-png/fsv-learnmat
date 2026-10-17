import { NextFunction, Request, Response } from 'express';
import HttpException from '@exceptions/HttpException';
import { logger } from '@utils/logger';

const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    // Only HttpExceptions carry messages meant for the client; others (e.g. SMTP errors) may leak internals
    res.status(status).json({ message: error instanceof HttpException ? message : 'Something went wrong' });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
