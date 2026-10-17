import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from './auth.middleware';

jest.mock('config', () => ({
  get: (key: string) => ({ secretKey: 'test-secret' })[key],
}));

const requestWith = (authorization?: string) =>
  ({ header: (name: string) => (name === 'Authorization' ? authorization : undefined) }) as unknown as RequestWithUser;

describe('authMiddleware', () => {
  it('sets req.user for a valid token', async () => {
    const req = requestWith('Bearer ' + jwt.sign({ email: 'max@uni-hildesheim.de' }, 'test-secret'));
    const next = jest.fn();

    await authMiddleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ email: 'max@uni-hildesheim.de' });
  });

  it.each([
    ['no header', undefined],
    ['no bearer token', 'Basic abc'],
    ['an invalid token', 'Bearer not-a-jwt'],
    ['a token with another secret', 'Bearer ' + jwt.sign({ email: 'max@uni-hildesheim.de' }, 'other-secret')],
    ['a token without email', 'Bearer ' + jwt.sign({ foo: 'bar' }, 'test-secret')],
  ])('responds 401 for %s', async (_, authorization) => {
    const next = jest.fn();

    await authMiddleware(requestWith(authorization), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
