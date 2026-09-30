import Stripe from 'stripe'
import { optionalEnv, requireEnv } from '@/lib/env'

// Re-exported so the billing routes have one import to make.
export { requireEnv }

/**
 * Lazily constructed Stripe client.
 *
 * The three billing routes used to call `new Stripe(process.env.STRIPE_SECRET_KEY!)`
 * at module scope. That looks harmless and is not: Next.js imports every route
 * module while collecting page data for the build, so the Stripe constructor ran
 * during `next build` with no key present and threw "Neither apiKey nor
 * config.authenticator provided".
 *
 * The consequence was that the build only succeeded on a machine that happened
 * to have a real secret in `.env.local`. CI has no secrets, so the build failed
 * there, which is why main was red for the last several months.
 *
 * Building the client on first use fixes it properly rather than by papering
 * over it with a placeholder key. A placeholder would let the build pass and
 * then fail confusingly at runtime on the first real checkout.
 */

let cached: Stripe | null = null

/**
 * Returns the shared client, or throws a message that names the missing
 * variable rather than whatever the SDK happens to say.
 */
export function getStripe(): Stripe {
  if (cached) return cached

  const key = optionalEnv('STRIPE_SECRET_KEY')
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Billing cannot work without it.'
    )
  }

  cached = new Stripe(key, {
    // Pinned because the SDK types are strict about the accepted values and a
    // newer account default would otherwise fail the type check.
    apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
  })

  return cached
}
