import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import ModulesController from '@/controllers/modules.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { HOUR, userRateLimit } from '@middlewares/rate-limit.middleware';
import { GetLinksDto } from '@/dtos/material.dto';

class ModulesRoute implements Route {
  public path = '/modules';
  public router = Router();
  public modulesController = new ModulesController();

  // Every request creates public shares and sends a mail via the student council's SMTP account
  private linksLimiter = userRateLimit(10, HOUR, 'Zu viele Anfragen. Bitte versuche es später erneut.');

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.modulesController.list);
    this.router.post(`${this.path}`, authMiddleware, this.linksLimiter, validationMiddleware(GetLinksDto, 'body'), this.modulesController.get);
  }
}

export default ModulesRoute;
