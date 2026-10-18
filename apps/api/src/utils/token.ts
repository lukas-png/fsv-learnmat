import config from 'config';
import jwt from 'jsonwebtoken';
import { DataStoredInToken } from '@interfaces/auth.interface';
import { isUniMail } from '@utils/util';

// Roughly one semester; afterwards students simply request a new link
export const TOKEN_LIFETIME_DAYS = 180;
const TOKEN_LIFETIME = `${TOKEN_LIFETIME_DAYS}d`;

// Thrown by verifyToken for expired tokens (exp or maxAge), so callers can tell them apart from invalid ones
export { TokenExpiredError } from 'jsonwebtoken';

export const signToken = (data: DataStoredInToken): { token: string, expires: Date } => {
  const token = jwt.sign(data, config.get<string>('secretKey'), { algorithm: 'HS256', expiresIn: TOKEN_LIFETIME });
  return { token, expires: new Date((jwt.decode(token) as { exp: number }).exp * 1000) };
};

// maxAge also expires tokens issued before expiresIn was introduced (they carry an iat, but no exp).
// The email ends up as mail recipient, so it is checked again even though the token is signed.
export const verifyToken = (token: string): DataStoredInToken => {
  const payload = jwt.verify(token, config.get<string>('secretKey'), { algorithms: ['HS256'], maxAge: TOKEN_LIFETIME });
  if (typeof payload !== 'object' || typeof payload.email !== 'string' || !isUniMail(payload.email)) {
    throw new Error('Invalid token payload');
  }
  return { email: payload.email };
};
