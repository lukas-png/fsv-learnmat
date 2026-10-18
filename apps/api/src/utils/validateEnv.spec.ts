import { cleanEnv } from 'envalid';
import { secretKey } from './validateEnv';

const check = (value?: string) =>
  cleanEnv({ SECRET_KEY: value }, { SECRET_KEY: secretKey() }, {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length) throw new Error(String(Object.values(errors)[0]));
    },
  });

describe('SECRET_KEY validation', () => {
  it('accepts a long random key', () => {
    expect(() => check('3f9a1c0e8b7d4f2a6e5c9b1d0a8f7e6c5b4a3d2e1f0a9b8c')).not.toThrow();
  });

  it.each([
    ['missing', undefined],
    ['too short', 'a1b2c3d4'],
    ['the old default', 'secretKey'],
    ['a long placeholder', 'my-super-secret-key-for-learnmat-2026'],
    ['a repeated character', 'x'.repeat(40)],
  ])('rejects a key that is %s', (_, value) => {
    expect(() => check(value)).toThrow();
  });
});
