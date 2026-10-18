import { createHash } from 'crypto';
import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { RequestWithUser } from '@interfaces/auth.interface';

export const HOUR = 60 * 60 * 1000;

// Limits per access token owner, so one link cannot be used from many IPs to get around the
// per-IP limits. Must run after authMiddleware. Only a hash of the address is kept in memory.
export const userRateLimit = (limit: number, windowMs: number, message: string) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => createHash('sha256').update((req as RequestWithUser).user.email.toLowerCase()).digest('hex'),
  message: { message },
});

// One shared counter for everyone, as an upper bound for what ends up in the AcademicCloud
export const globalRateLimit = (limit: number, windowMs: number, message: string) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: () => 'global',
  message: { message },
});
