import { Request, Response } from 'express';
import { GetLinksDto } from '@dtos/material.dto';
import validationMiddleware from './validation.middleware';

const run = (body: unknown) =>
  new Promise<unknown>(resolve => {
    validationMiddleware(GetLinksDto, 'body')({ body } as Request, {} as Response, resolve);
  });

describe('validationMiddleware with GetLinksDto', () => {
  it('passes a valid body', async () => {
    await expect(run({ modules: [{ name: 'Datenbanken', etag: 'abc' }] })).resolves.toBeUndefined();
  });

  it('rejects an empty module list', async () => {
    await expect(run({ modules: [] })).resolves.toMatchObject({ status: 400 });
  });

  it('reports errors of nested modules instead of crashing', async () => {
    // Nested errors have no constraints of their own; this used to throw inside the middleware
    const error = await run({ modules: [{ name: 1 }] });
    expect(error).toMatchObject({ status: 400 });
    expect((error as Error).message).toContain('name must be a string');
    expect((error as Error).message).toContain('etag must be a string');
  });

  it('rejects unknown properties', async () => {
    await expect(run({ modules: [{ name: 'a', etag: 'b' }], admin: true })).resolves.toMatchObject({ status: 400 });
  });

  it('rejects more than 50 modules', async () => {
    const modules = Array.from({ length: 51 }, (_, i) => ({ name: 'm' + i, etag: 'e' + i }));
    await expect(run({ modules })).resolves.toMatchObject({ status: 400 });
  });
});
