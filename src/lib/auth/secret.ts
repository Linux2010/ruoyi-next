/**
 * JWT signing key resolution.
 *
 * Production must never fall back to a publicly known key. A missing or weak
 * secret throws at request time instead of silently issuing forgeable tokens —
 * fail fast so a misconfigured deployment is loud, not compromised.
 * See SECURITY.md.
 */

/** Minimum length enforced for JWT_SECRET when NODE_ENV=production. */
export const JWT_SECRET_MIN_LENGTH = 32;

/** Development-only fallback; never used in production. */
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me";

export function resolveJwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!configured) {
    if (isProduction) {
      throw new Error(
        "JWT_SECRET must be set in production. " +
          "Generate one with: openssl rand -base64 48"
      );
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  if (isProduction && configured.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters in production.`
    );
  }

  return new TextEncoder().encode(configured);
}
