import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import HttpException from '@exceptions/HttpException';

// Nested errors (from @ValidateNested) carry their messages in children, not in constraints
const collectMessages = (errors: ValidationError[]): string[] =>
  errors.flatMap(error => [...Object.values(error.constraints ?? {}), ...collectMessages(error.children ?? [])]);

const validationMiddleware = (
  type: any,
  value: string | 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return (req, res, next) => {
    validate(plainToClass(type, req[value]), { skipMissingProperties, whitelist, forbidNonWhitelisted }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = collectMessages(errors).join(', ');
        next(new HttpException(400, message));
      } else {
        next();
      }
    }).catch(next);
  };
};

export default validationMiddleware;
