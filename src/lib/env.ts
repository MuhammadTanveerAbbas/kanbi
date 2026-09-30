/**
 * Environment variable access.
 *
 * Every server secret is read through here rather than through a non null
 * assertion. `process.env.SECRET!` compiles, builds, and passes every check,
 * then arrives at the provider as the string "undefined" and fails there with a
 * message about the provider. Naming the variable turns that into an error that
 * says which one is missing.
 *
 * It lives outside `lib/billing` because the Supabase admin client needs it too,
 * and a helper for reading configuration has no business being owned by a
 * payment integration.
 */

/**
 * Returns the value, or throws naming the variable.
 *
 * Used on the paths where continuing without the value would be wrong. A
 * checkout with no Stripe key should stop, not create a session that fails.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set, so this operation cannot complete.`)
  }
  return value
}

/**
 * Returns the value, or throws naming the variable and what it is for.
 *
 * The extra detail is worth it for the keys where the name alone does not
 * explain where to get it.
 */
export function requireEnvWithHint(name: string, hint: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. ${hint}`)
  }
  return value
}

/**
 * Returns the value, or an empty string.
 *
 * For optional settings where a missing value is a legitimate state rather than
 * a misconfiguration. An optional model name falls back, for instance.
 */
export function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] || fallback
}