import bcrypt from "bcryptjs";

/**
 * Verify password against BCrypt hash stored in database.
 * Compatible with Spring Security BCryptPasswordEncoder (RuoYi Java backend).
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Hash a password using BCrypt.
 * Used when creating new users.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}
