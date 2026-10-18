import express, { NextFunction, Request, Response } from 'express';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { RequestWithUser } from '@interfaces/auth.interface';
import { globalRateLimit, HOUR, userRateLimit } from './rate-limit.middleware';

// Stands in for authMiddleware: the user comes from a header instead of a token
const fakeAuth = (req: Request, res: Response, next: NextFunction) => {
  (req as RequestWithUser).user = { email: req.header('X-User') ?? '' };
  next();
};

const serve = async (limiter: express.RequestHandler) => {
  const app = express();
  app.post('/', fakeAuth, limiter, (req, res) => res.sendStatus(200));
  const server: Server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  const post = (user: string) => fetch(url, { method: 'POST', headers: { 'X-User': user } }).then(r => r.status);
  return { server, post };
};

describe('rate limits', () => {
  let server: Server | undefined;

  afterEach(() => server?.close());

  it('counts per access token owner, regardless of case', async () => {
    const app = await serve(userRateLimit(2, HOUR, 'too many'));
    server = app.server;

    expect(await app.post('max@uni-hildesheim.de')).toBe(200);
    expect(await app.post('Max@Uni-Hildesheim.de')).toBe(200);
    expect(await app.post('max@uni-hildesheim.de')).toBe(429);
    expect(await app.post('erika@uni-hildesheim.de')).toBe(200);
  });

  it('shares one counter between all users for the global limit', async () => {
    const app = await serve(globalRateLimit(2, HOUR, 'too many'));
    server = app.server;

    expect(await app.post('max@uni-hildesheim.de')).toBe(200);
    expect(await app.post('erika@uni-hildesheim.de')).toBe(200);
    expect(await app.post('john@uni-hildesheim.de')).toBe(429);
  });
});
