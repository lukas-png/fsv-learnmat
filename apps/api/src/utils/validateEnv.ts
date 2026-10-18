import { cleanEnv, makeValidator, port, str } from 'envalid';

// Anyone who knows the JWT secret can create access tokens for arbitrary addresses
export const secretKey = makeValidator<string>(value => {
  if (value.length < 32) throw new Error('must be at least 32 characters long, e.g. openssl rand -hex 32');
  if (/^(.)\1*$/.test(value) || /secret|password|changeme/i.test(value)) throw new Error('looks like a placeholder');
  return value;
});

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    SECRET_KEY: secretKey(),
  });
};

export default validateEnv;
