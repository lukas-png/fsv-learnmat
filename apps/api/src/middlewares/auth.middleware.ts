import { NextFunction, Response } from 'express';
import HttpException from '@exceptions/HttpException';
import { RequestWithUser } from '@interfaces/auth.interface';
import { verifyToken } from '@utils/token';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const Authorization = req.header('Authorization')?.split('Bearer ')[1] || null;

  if (!Authorization) {
    next(new HttpException(401, 'Authentication token missing'));
    return;
  }

  try {
    req.user = verifyToken(Authorization);
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
    return;
  }
  next();
};

export default authMiddleware;
