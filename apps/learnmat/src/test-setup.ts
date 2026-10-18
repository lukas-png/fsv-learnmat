import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// jsdom cannot parse some modern CSS in Angular Material's styles and reports it via
// console.error; the styles are irrelevant for the tests, so drop just this message
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0] as { message?: string } | string | undefined;
  const message = typeof first === 'string' ? first : first?.message;
  if (message?.includes('Could not parse CSS stylesheet')) {
    return;
  }
  consoleError(...args);
};
