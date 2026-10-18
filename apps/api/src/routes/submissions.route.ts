import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import Route from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@middlewares/validation.middleware';
import { globalRateLimit, HOUR, userRateLimit } from '@middlewares/rate-limit.middleware';
import HttpException from '@exceptions/HttpException';
import SubmissionsController from '@/controllers/submissions.controller';
import { SubmissionDto } from '@/dtos/submission.dto';
import { MAX_FILE_SIZE } from '@/services/submission.service';

const LIMIT_MESSAGE = 'Zu viele Einreichungen. Bitte versuche es später erneut.';

// Kept in memory: files are at most 20 MB and go straight to the AcademicCloud
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, fieldSize: 4096 },
}).single('file');

// Turns multer errors (e.g. file too large) into proper HTTP errors
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, error => {
    if (error instanceof multer.MulterError) {
      next(new HttpException(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, error.message));
    } else {
      next(error);
    }
  });
};

class SubmissionsRoute implements Route {
  public path = '/submissions';
  public router = Router();
  public submissionsController = new SubmissionsController();

  // Per IP (IPv6 grouped by /56), per access link and in total, checked before the upload is buffered
  private ipLimiter = rateLimit({
    windowMs: HOUR,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: LIMIT_MESSAGE },
  });
  // Per day, so a single link cannot use up the global limit on its own
  private userLimiter = userRateLimit(10, 24 * HOUR, LIMIT_MESSAGE);
  private globalLimiter = globalRateLimit(50, 24 * HOUR, LIMIT_MESSAGE);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.ipLimiter, authMiddleware, this.userLimiter, this.globalLimiter,
      uploadMiddleware, validationMiddleware(SubmissionDto, 'body'), this.submissionsController.create);
  }
}

export default SubmissionsRoute;
