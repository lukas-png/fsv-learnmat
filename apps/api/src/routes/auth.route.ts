import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import AuthController from '@controllers/auth.controller';
import { CreateUserDto } from '@dtos/users.dto';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';

class AuthRoute implements Route {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  // Every signup sends a mail via the student council's SMTP account, so limit it per IP.
  // Behind the reverse proxy this needs TRUST_PROXY=true, otherwise all requests share the proxy IP.
  private signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut.' },
  });

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, this.signupLimiter, validationMiddleware(CreateUserDto, 'body'), this.authController.signUp);
    this.router.post(`${this.path}validate`, this.authController.validate);
  }
}

export default AuthRoute;
