import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import ModulesController from '@/controllers/modules.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { GetLinksDto } from '@/dtos/material.dto';

class ModulesRoute implements Route {
  public path = '/modules';
  public router = Router();
  public modulesController = new ModulesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.modulesController.list);
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(GetLinksDto, 'body'), this.modulesController.get);
  }
}

export default ModulesRoute;
