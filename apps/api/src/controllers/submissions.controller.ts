import { NextFunction, Response } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { SubmissionDto } from '@/dtos/submission.dto';
import HttpException from '@exceptions/HttpException';
import SubmissionService from '@/services/submission.service';

class SubmissionsController {

  private submissionService = new SubmissionService();

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new HttpException(400, 'file is required');
      }
      const { module, note }: SubmissionDto = req.body;
      await this.submissionService.submit(req.file.buffer, module, note);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  };
}

export default SubmissionsController;
