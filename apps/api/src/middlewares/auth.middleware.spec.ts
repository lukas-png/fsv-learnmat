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
    ['a token for a non-university address', 'Bearer ' + jwt.sign({ email: 'a@example.com, b@uni-hildesheim.de' }, 'test-secret')],
    ['an expired token', 'Bearer ' + jwt.sign({ email: 'max@uni-hildesheim.de' }, 'test-secret', { expiresIn: -1 })],
    // Issued before tokens got an expiry: no exp, but an iat older than the token lifetime
    ['an old token without expiry', 'Bearer ' + jwt.sign({ email: 'max@uni-hildesheim.de', iat: Math.floor(Date.now() / 1000) - 181 * 86400 }, 'test-secret')],
    ['an unsigned token', 'Bearer ' + jwt.sign({ email: 'max@uni-hildesheim.de' }, '', { algorithm: 'none' })],
  ])('responds 401 for %s', async (_, authorization) => {
    const next = jest.fn();

    await authMiddleware(requestWith(authorization), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
