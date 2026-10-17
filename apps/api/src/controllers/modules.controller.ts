import { NextFunction, Response } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import MaterialService from '@/services/material.service';
import { GetLinksDto } from '@/dtos/material.dto';

class ModulesController {

  private materialService: MaterialService = new MaterialService();


  public list = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {

    try {
      res.status(200).json({
        modules: await this.materialService.getMaterials()
      });
    } catch (error) {
      next(error);
    }
  };

  public get = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modules }: GetLinksDto = req.body;
      await this.materialService.createShares(modules, req.user.email);
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  };
}

export default ModulesController;
