import { NextFunction, Request, Response } from 'express';

class IndexController {
  // Health check: no external calls, so it can be polled freely
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
