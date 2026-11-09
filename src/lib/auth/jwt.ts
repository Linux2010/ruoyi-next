import { jwtVerify, SignJWT } from "jose";
import { resolveJwtSecret } from "./secret";

const JWT_EXPIRES_IN = "24h";

export interface JWTPayload {
  userId: number;
  userName: string;
  roles: string[];
  permissions: string[];
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = resolveJwtSecret();
  return new SignJWT({
    userId: payload.userId,
    userName: payload.userName,
    roles: payload.roles,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  // Resolve outside the try block: a missing/weak secret is a configuration
  // error and must surface, not be swallowed and reported as "invalid token".
  const secret = resolveJwtSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as number,
      userName: payload.userName as string,
      roles: (payload.roles as string[]) || [],
      permissions: (payload.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    // Secure cookies are silently dropped by browsers over plain HTTP, which
    // breaks login on local/LAN deployments. Opt in explicitly with
    // COOKIE_SECURE=true when serving over HTTPS.
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60,
  };
}

export const AUTH_COOKIE_NAME = "ruoyi-next-token";
