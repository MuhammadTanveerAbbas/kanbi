import { optionalEnv } from '@/lib/env';

export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = optionalEnv('CRON_SECRET');
  // No secret configured means the endpoint is closed, not open. Failing open
  // here would let anyone call the maintenance routes.
  if (!secret) return false;
  return request.headers.get('Authorization') === `Bearer ${secret}`;
}
